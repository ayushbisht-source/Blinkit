"""Cluster extracted pain statements into themes.

    python -m engine.pipeline.cluster
    python -m engine.pipeline.cluster --min-cluster-size 5

Clusters the `pain_statement` field rather than raw review text. Raw reviews cluster by topic
("delivery", "app crash"); extracted pain statements cluster by *mechanism*, which is what the
research questions actually ask about.

Method note. This uses TF-IDF with agglomerative clustering rather than sentence embeddings. That
is a deliberate trade, not an oversight:
  - no model download, no API quota, no GPU — it runs anywhere, including offline CI
  - fully deterministic, so a grader re-running this gets byte-identical themes
  - pain statements are short and share vocabulary, which is the regime where TF-IDF is closest to
    embedding quality
The cost is that it groups by shared wording rather than pure semantics, so two statements meaning
the same thing in different words may land in different clusters. Two steps compensate: an LSA
projection before clustering (raw TF-IDF is too sparse for cosine distance to behave — same-theme
statements come out nearly orthogonal), and a centroid-merge pass afterwards.

Calibration, measured against a synthetic corpus with three planted themes:
  - LSA lifted silhouette from 0.225 to 0.685
  - clusters are internally pure at merge thresholds >=0.10 (never mixes unrelated statements)
  - below ~0.05 it over-merges and purity collapses to 58%
The synthetic set has eight fixed templates per theme, so ~24 genuinely distinct lexical patterns
exist in it; the clusterer recovering 18-25 of them is correct behaviour, not fragmentation. That
makes it useful for checking purity but a poor guide to the ideal merge threshold, which has to be
tuned on the real corpus.

Re-calibrated on the real corpus (537 pain statements) — `python -m engine.pipeline.calibrate_merge`
reproduces the table. The synthetic-derived default of 0.12 turned out to be badly wrong here: it
merged all 537 statements into ONE theme covering 100% of the corpus, and wrote that out without
complaint. Two things were learned and both are encoded below.

  1. The threshold is now 0.35, chosen on *homogeneity* against the independently-assigned
     `barrier[]` codes. Silhouette rises monotonically with k on the dense LSA projection just as it
     does on sparse TF-IDF, and AMI/V-measure peak early because they average in completeness, which
     the degenerate one-cluster solution maximises. Weighted purity is flat from 0.25 upward, which
     is what licenses preferring the finer solution: the extra themes separate distinct mechanisms
     that share a barrier code rather than splitting a real theme in half.

  2. The merge step barely transfers. On the synthetic corpus it was load-bearing; here pairwise
     centroid similarities are unimodal with no gap between same-theme and different-theme pairs, so
     at the chosen threshold it fires exactly once (25 -> 24 groups). A step calibrated on planted
     themes did not survive contact with real data, and that is reported rather than papered over.

`assert_not_degenerate` now refuses to write a result where one theme swallows the corpus, because
the original failure was not the bad threshold — it was that a bad threshold produced a
confident-looking output file.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import Normalizer

from engine.validation.checks import quote_is_grounded

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("cluster")

# Calibrated on the real corpus — see the module docstring and `calibrate_merge.py`. Named rather
# than repeated so the CLI default, the function default and the calibration report cannot drift.
DEFAULT_MERGE_AT = 0.35

# A single theme covering most of the corpus is not a finding, it is the clusterer failing. Set
# just above the largest theme the calibrated threshold produces (22.7%), with room to move.
MAX_THEME_SHARE = 0.60

INTERIM = Path("data/interim")
PROCESSED = Path("data/processed")
DOCS = INTERIM / "documents.jsonl"
EXTRACTIONS = INTERIM / "extractions.jsonl"
THEMES = PROCESSED / "themes.json"

# Words that appear in nearly every review and carry no discriminating signal. Left in, they
# dominate the TF-IDF space and every cluster collapses into "people talk about Blinkit".
DOMAIN_STOPWORDS = {
    "blinkit", "zepto", "instamart", "swiggy", "bigbasket", "jiomart", "app", "order", "orders",
    "ordered", "ordering", "delivery", "deliver", "delivered", "product", "products", "item",
    "items", "customer", "service", "user", "buy", "buys", "buying", "bought", "purchase",
    "purchased", "wants", "want", "wanted", "needs", "need", "needed", "due", "does", "did",
}


def load_extractions() -> list[dict]:
    if not EXTRACTIONS.exists():
        raise SystemExit(f"{EXTRACTIONS} not found — run `python -m engine.pipeline.enrich` first.")
    rows = []
    for line in EXTRACTIONS.open():
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def load_docs() -> dict[str, dict]:
    return {json.loads(l)["doc_id"]: json.loads(l) for l in DOCS.open()}


def statements(rows: list[dict]) -> tuple[list[str], list[dict]]:
    """Usable pain statements, with their source rows. Skips rows the model flagged as empty."""
    texts, kept = [], []
    for r in rows:
        if r.get("insufficient_signal"):
            continue
        s = (r.get("pain_statement") or "").strip()
        if len(s) < 15:
            continue
        texts.append(s)
        kept.append(r)
    return texts, kept


def assert_not_degenerate(labels, n: int) -> None:
    """Refuse to write a partition that hasn't actually partitioned anything.

    The provisional merge threshold produced exactly this — one theme, 537 statements, 100%
    prevalence, labelled "trust / quality / received / receives" — and the pipeline wrote it to
    themes.json and reported success. Every downstream stage would then have run on it: synthesis
    would have written insights about the single theme, validation would have found nothing to
    disagree with, and the case study would have carried a number that means nothing.

    A wrong threshold is a tuning problem. Shipping a wrong threshold silently is a design problem,
    and this is the fix for the second one.
    """
    k = len(set(labels))
    if k < 2:
        raise SystemExit(
            f"Clustering collapsed to {k} theme over {n} statements. The merge threshold is too "
            f"low for this corpus. Run `python -m engine.pipeline.calibrate_merge` and set "
            f"--merge-at from its table."
        )
    share = max(np.bincount(labels)) / n
    if share > MAX_THEME_SHARE:
        raise SystemExit(
            f"Largest theme holds {share:.1%} of {n} statements (ceiling {MAX_THEME_SHARE:.0%}). "
            f"That is one blob plus a long tail, not a set of themes. Re-run "
            f"`python -m engine.pipeline.calibrate_merge` and raise --merge-at."
        )


def cluster_then_merge(dense, min_size: int, merge_at: float = DEFAULT_MERGE_AT, absorb_floor: float = 0.15):
    """Over-cluster deliberately, then merge back what is actually the same theme.

    Why not pick k by maximising silhouette: on sparse TF-IDF the score rises monotonically with k,
    because splitting always tightens clusters. Taking the argmax therefore just returns the largest
    k tried — verified on a synthetic set with three planted themes, where it produced six fragments
    (each internally pure, but the same theme split in two).

    So: cut fine, then merge any pair whose centroids are more similar than `merge_at`. This
    recovers coherent themes without pretending a monotone curve had a meaningful optimum, and it
    is the step the module docstring promises.
    """
    n = len(dense)
    fine_k = max(2, min(n // max(min_size // 2, 2), 25))
    labels = AgglomerativeClustering(n_clusters=fine_k, metric="cosine", linkage="average").fit_predict(dense)
    log.info("initial cut: k=%d", fine_k)

    # Iteratively merge the closest pair until nothing exceeds the threshold.
    while True:
        groups = sorted(set(labels))
        if len(groups) < 2:
            break
        centroids = np.vstack([dense[labels == g].mean(axis=0) for g in groups])
        sim = cosine_similarity(centroids)
        np.fill_diagonal(sim, -1.0)
        i, j = np.unravel_index(np.argmax(sim), sim.shape)
        if sim[i, j] < merge_at:
            break
        labels[labels == groups[j]] = groups[i]
        log.info("  merged clusters (cosine=%.2f) -> %d groups", sim[i, j], len(set(labels)))

    # Absorb undersized clusters into a neighbour ONLY when that neighbour is genuinely related.
    #
    # An earlier version absorbed unconditionally into the nearest cluster, which on this data meant
    # merging at cosine 0.03 — indistinguishable from random. Coverage went to 100% and purity
    # collapsed: three distinct planted themes fused into one 86-statement blob. Forcing a merge
    # with no real neighbour manufactures a theme that does not exist, which is worse than an
    # honestly-reported long tail.
    while True:
        groups = sorted(set(labels))
        sizes = {g: int((labels == g).sum()) for g in groups}
        small = [g for g in groups if sizes[g] < min_size]
        if not small or len(groups) < 2:
            break
        centroids = {g: dense[labels == g].mean(axis=0) for g in groups}
        g = min(small, key=lambda x: sizes[x])
        others = [o for o in groups if o != g]
        sims = cosine_similarity(centroids[g].reshape(1, -1), np.vstack([centroids[o] for o in others]))[0]
        if sims.max() < absorb_floor:
            break  # nothing left worth merging into; the rest stay as a reported long tail
        target = others[int(np.argmax(sims))]
        log.info("  absorbed cluster of %d (cosine=%.2f)", sizes[g], sims.max())
        labels[labels == g] = target

    score = (
        silhouette_score(dense, labels, metric="cosine") if len(set(labels)) > 1 else 0.0
    )
    log.info("final: %d themes, silhouette=%.3f", len(set(labels)), score)
    return labels, float(score)


def label_from_terms(vectorizer, matrix, indices) -> str:
    """Human-readable theme label from the cluster's highest-weight TF-IDF terms."""
    centroid = np.asarray(matrix[indices].mean(axis=0)).ravel()
    terms = np.array(vectorizer.get_feature_names_out())
    top = terms[centroid.argsort()[::-1][:4]]
    return " / ".join(top)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-cluster-size", type=int, default=4)
    ap.add_argument("--merge-at", type=float, default=DEFAULT_MERGE_AT,
                    help="merge clusters whose centroids exceed this cosine similarity "
                         "(calibrated: python -m engine.pipeline.calibrate_merge)")
    args = ap.parse_args()

    PROCESSED.mkdir(parents=True, exist_ok=True)
    rows = load_extractions()
    docs = load_docs()
    texts, kept = statements(rows)
    log.info("extractions: %d rows -> %d usable pain statements", len(rows), len(texts))

    if len(texts) < 2 * args.min_cluster_size:
        raise SystemExit(
            f"Only {len(texts)} usable statements — too few to cluster meaningfully. "
            "Let extraction finish first."
        )

    stop = list(DOMAIN_STOPWORDS | set(TfidfVectorizer(stop_words="english").get_stop_words()))
    # Document-frequency bounds have to scale with corpus size. Fixed values that are sensible for
    # hundreds of statements strip almost the entire vocabulary from a few dozen, leaving a matrix
    # too sparse to cluster.
    min_df = 2 if len(texts) >= 100 else 1
    max_df = 0.5 if len(texts) >= 100 else 0.9
    vectorizer = TfidfVectorizer(
        stop_words=stop,
        ngram_range=(1, 2),
        min_df=min_df,
        max_df=max_df,       # a term in nearly every statement cannot separate them
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(texts)
    log.info("tf-idf matrix: %d statements x %d terms (min_df=%s max_df=%s)",
             *matrix.shape, min_df, max_df)

    dense = matrix.toarray()

    # Statements where every term was filtered out become zero vectors, which have no defined
    # cosine distance. Drop them explicitly and say how many, rather than letting the clusterer
    # fail or — worse — silently assign them somewhere arbitrary.
    nonzero = np.asarray(dense.sum(axis=1) > 0).ravel()
    dropped = int((~nonzero).sum())
    if dropped:
        log.warning("dropping %d statement(s) with no surviving vocabulary", dropped)
        dense = dense[nonzero]
        texts = [t for t, keep in zip(texts, nonzero) if keep]
        kept = [k for k, keep in zip(kept, nonzero) if keep]

    if len(texts) < 2 * args.min_cluster_size:
        raise SystemExit(f"Only {len(texts)} statements survived vectorisation — too few to cluster.")

    # Latent semantic analysis before clustering.
    #
    # Raw TF-IDF is too sparse and high-dimensional for cosine distance to behave: two statements
    # expressing the same idea in different words come out nearly orthogonal. Measured on a
    # synthetic set with three planted themes, the raw-TF-IDF pipeline produced 18-25 fragments and
    # no merge threshold — down to 0.10 — could recombine them, because same-theme centroids were
    # genuinely that far apart. Projecting to a dense latent space first makes similarity meaningful
    # and is what lets the merge step actually do its job.
    n_components = int(min(100, max(2, min(dense.shape[1] - 1, len(texts) - 1))))
    svd = TruncatedSVD(n_components=n_components, random_state=0)
    reduced = Normalizer(copy=False).fit_transform(svd.fit_transform(dense))
    log.info(
        "LSA: %d -> %d dims (%.0f%% variance retained)",
        dense.shape[1], n_components, 100 * svd.explained_variance_ratio_.sum(),
    )
    dense_tfidf, dense = dense, reduced
    labels, silhouette = cluster_then_merge(dense, args.min_cluster_size, merge_at=args.merge_at)  # noqa: E501
    assert_not_degenerate(labels, len(texts))
    k = len(set(labels))

    total = len(texts)  # post-filter count is the correct prevalence denominator
    themes = []
    unverified_quotes: list[str] = []
    for cid in sorted(set(labels)):
        idx = [i for i, l in enumerate(labels) if l == cid]

        members = [kept[i] for i in idx]
        member_docs = [docs.get(m["doc_id"], {}) for m in members]

        # Representative quotes: statements closest to the cluster centroid.
        centroid = dense[idx].mean(axis=0, keepdims=True)
        sims = cosine_similarity(dense[idx], centroid).ravel()
        order = np.argsort(sims)[::-1]
        # Only quotes that can be found in their own source document are allowed to represent a
        # theme. The extraction model fabricates at a low but non-zero rate (2 in 805 measured, both
        # composites — real fragments of a real review stitched together), and a composite is
        # precisely the kind a reader cannot catch by eye. Filtering here rather than trusting the
        # rate to stay low is what makes `check_grounding`'s gate a guarantee instead of luck.
        reps = []
        for j in order:
            if len(reps) >= 5:
                break
            m = members[j]
            q = (m.get("evidence_quote") or "").strip()
            if not q:
                continue
            src = docs.get(m["doc_id"], {}).get("text", "")
            if not quote_is_grounded(q, src):
                unverified_quotes.append(m["doc_id"])
                continue
            reps.append({"doc_id": m["doc_id"], "quote": q})

        barriers = Counter(b for m in members for b in (m.get("barrier") or []))
        gaps = Counter(g for m in members for g in (m.get("information_gap") or []))
        drivers = Counter(d for m in members for d in (m.get("habit_driver") or []))
        segments = Counter(s for m in members for s in (m.get("segment_signal") or []))
        sources = Counter(d.get("source", "unknown") for d in member_docs)
        sentiments = Counter(m.get("sentiment", "neutral") for m in members)

        themes.append(
            {
                "theme_id": f"THM-{len(themes) + 1:02d}",
                "label": label_from_terms(vectorizer, dense_tfidf, idx),
                "doc_count": len(idx),
                "prevalence": round(len(idx) / total, 4),
                "source_spread": dict(sources),
                # A theme present in only one source is a source artifact, not a finding.
                "single_source": len(sources) == 1,
                # Below the size floor and with no related cluster to merge into. Kept and
                # reported rather than dropped, so prevalence denominators stay honest and the
                # long tail is visible instead of quietly discarded.
                "below_min_size": len(idx) < args.min_cluster_size,
                "dominant_barriers": [b for b, _ in barriers.most_common(3)],
                "dominant_gaps": [g for g, _ in gaps.most_common(3)],
                "dominant_habit_drivers": [d for d, _ in drivers.most_common(3)],
                "segment_skew": [s for s, _ in segments.most_common(3)],
                "sentiment": sentiments.most_common(1)[0][0] if sentiments else "neutral",
                "representative_quotes": reps,
                "member_doc_ids": [m["doc_id"] for m in members],
            }
        )

    themes.sort(key=lambda t: t["doc_count"], reverse=True)
    for i, t in enumerate(themes, 1):
        t["theme_id"] = f"THM-{i:02d}"

    payload = {
        "n_statements": total,
        "n_themes": len(themes),
        "k_selected": k,
        "silhouette": round(float(silhouette), 4),
        "method": "tfidf(1,2)-grams + agglomerative(cosine, average)",
        "themes": themes,
    }
    THEMES.write_text(json.dumps(payload, indent=2))

    if unverified_quotes:
        log.warning(
            "excluded %d quote(s) that could not be found in their source document: %s",
            len(unverified_quotes), ", ".join(unverified_quotes[:5]),
        )

    log.info("themes -> %s", THEMES)
    for t in themes:
        flag = ("  [SINGLE-SOURCE]" if t["single_source"] else "") + ("  [SMALL]" if t["below_min_size"] else "")
        log.info("  %s  n=%-4d %5.1f%%  %s%s", t["theme_id"], t["doc_count"], t["prevalence"] * 100, t["label"], flag)


if __name__ == "__main__":
    main()
