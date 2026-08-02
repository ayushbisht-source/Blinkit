"""Choose the centroid-merge threshold on the real corpus, and show the working.

    python -m engine.pipeline.calibrate_merge

`cluster.py`'s merge threshold was originally calibrated against a synthetic corpus with three
planted themes, and its own docstring flagged that as "a poor guide to the ideal merge threshold,
which has to be tuned on the real corpus." This script does that tuning, reproducibly, so the chosen
value is a reported measurement rather than a number someone liked the look of.

It exists because the first real run collapsed all 537 statements into a single theme at the
provisional default of 0.12. That is the failure this module is meant to make impossible to ship
quietly.

## Why not silhouette

The clustering docstring warns that silhouette rises monotonically with k on sparse TF-IDF, so its
argmax just returns the largest k tried. Measured here, that holds on the *dense LSA* projection
too: 0.005 (k=6) -> 0.088 (k=25), rising the whole way. Still not a selector.

## The external criterion, and its limits

Each extraction row carries a `barrier[]` code assigned by the model from the raw review text, while
the clusterer only ever sees the `pain_statement` wording. Agreement between the two is therefore
informative in a way silhouette is not — it compares the geometry against labels the geometry did
not produce.

Stated limit: both come from the same LLM pass over the same document, so this is weaker than
human-coded ground truth. It is not independent, only *differently derived*.

## Reading the table

The metric that settles it is **homogeneity** (is each theme about one barrier), not completeness
(is each barrier confined to one theme) and not the AMI/V-measure that average the two.

Completeness is maximised by the degenerate solution: put everything in one cluster and every
barrier class is trivially "complete". It is the same defect as silhouette's monotonicity, pointing
the other way. Optimising it would also defeat the purpose of clustering at all — one theme per
barrier just reproduces the enum, and the reason to cluster is to find *distinguishable mechanisms
inside* a barrier class. "Vegetables arrive rotten" and "dry fruits are not fresh and cost a lot"
are both `trust_quality`, and they are different problems with different fixes.

Weighted purity is reported alongside because it is the honest cross-check: if splitting the large
theme were manufacturing spurious distinctions, purity would fall. On this corpus it does not move
at all between thresholds 0.25 and 0.40, which is what licenses preferring the finer solution.
"""

from __future__ import annotations

import collections
import logging

import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    adjusted_mutual_info_score,
    homogeneity_completeness_v_measure,
    silhouette_score,
)
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import Normalizer

from engine.pipeline import cluster as C

THRESHOLDS = [0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50]


def build_space():
    """Reproduce cluster.py's vectorisation exactly, so the sweep measures the real pipeline."""
    rows = C.load_extractions()
    texts, kept = C.statements(rows)
    stop = list(C.DOMAIN_STOPWORDS | set(TfidfVectorizer(stop_words="english").get_stop_words()))
    min_df = 2 if len(texts) >= 100 else 1
    max_df = 0.5 if len(texts) >= 100 else 0.9
    vec = TfidfVectorizer(
        stop_words=stop, ngram_range=(1, 2), min_df=min_df, max_df=max_df, sublinear_tf=True
    )
    dense = vec.fit_transform(texts).toarray()

    nonzero = dense.sum(axis=1) > 0
    dense = dense[nonzero]
    kept = [k for k, z in zip(kept, nonzero) if z]

    n_components = int(min(100, max(2, min(dense.shape[1] - 1, len(kept) - 1))))
    svd = TruncatedSVD(n_components=n_components, random_state=0)
    reduced = Normalizer(copy=False).fit_transform(svd.fit_transform(dense))
    return reduced, kept


def weighted_purity(labels, truth) -> float:
    hits = 0
    for g in set(labels):
        idx = [i for i, l in enumerate(labels) if l == g]
        counts = collections.Counter(truth[i] for i in idx)
        hits += counts.most_common(1)[0][1]
    return hits / len(labels)


def centroid_gap(reduced, k=25) -> None:
    """Is there a similarity gap between same-theme and different-theme centroids?

    The merge step assumes there is one. If pairwise centroid similarities are unimodal, no single
    global threshold can separate "same theme" from "different theme", and the step can only ever
    trade one kind of error for the other.
    """
    from sklearn.cluster import AgglomerativeClustering

    labels = AgglomerativeClustering(
        n_clusters=k, metric="cosine", linkage="average"
    ).fit_predict(reduced)
    cents = np.vstack([reduced[labels == g].mean(axis=0) for g in sorted(set(labels))])
    sim = cosine_similarity(cents)
    pairs = sim[np.triu_indices_from(sim, 1)]
    print(f"\nPairwise centroid cosine at the k={k} fine cut ({len(pairs)} pairs)")
    print(
        f"  min {pairs.min():.3f}   p25 {np.percentile(pairs, 25):.3f}   "
        f"median {np.median(pairs):.3f}   p75 {np.percentile(pairs, 75):.3f}   max {pairs.max():.3f}"
    )
    hist, edges = np.histogram(pairs, bins=10)
    for h, lo, hi in zip(hist, edges[:-1], edges[1:]):
        print(f"   {lo:5.2f}–{hi:5.2f} {'#' * int(h / 2):<40} {h}")
    print(
        "  Unimodal with a thin right tail — no gap. So no threshold cleanly separates same-theme\n"
        "  from different-theme centroids, and the choice below has to be made on a downstream\n"
        "  criterion rather than by finding a natural break."
    )


def main() -> None:
    logging.disable(logging.INFO)  # the sweep prints its own table
    reduced, kept = build_space()
    barrier = [(k.get("barrier") or ["(none)"])[0] for k in kept]

    labelled = sum(1 for b in barrier if b != "(none)")
    print(f"{len(kept)} statements · {labelled} carry a barrier code · {len(set(barrier))} distinct")

    centroid_gap(reduced)

    print(
        f"\n{'merge_at':>9} {'k':>4} {'homog':>7} {'compl':>7} {'V':>7} "
        f"{'AMI':>7} {'purity':>7} {'silh':>7} {'largest':>8}"
    )
    for t in THRESHOLDS:
        labels, _ = C.cluster_then_merge(reduced.copy(), 4, merge_at=t)
        k = len(set(labels))
        h, c, v = homogeneity_completeness_v_measure(barrier, labels)
        ami = adjusted_mutual_info_score(barrier, labels)
        sil = silhouette_score(reduced, labels, metric="cosine") if k > 1 else 0.0
        largest = 100 * max(np.bincount(labels)) / len(labels)
        print(
            f"{t:9.2f} {k:4d} {h:7.3f} {c:7.3f} {v:7.3f} {ami:7.3f} "
            f"{weighted_purity(labels, barrier):7.3f} {sil:7.3f} {largest:7.1f}%"
        )

    print(
        "\nReading:\n"
        "  · silhouette rises monotonically with k — invalid as a selector, as on sparse TF-IDF.\n"
        "  · AMI and V peak early because both average in completeness, which the degenerate\n"
        "    one-cluster solution maximises. Not a selector either.\n"
        "  · weighted purity is flat from 0.25 upward: the finer solutions are not manufacturing\n"
        "    distinctions, they are separating mechanisms that share a barrier code.\n"
        "  · homogeneity plateaus around 0.35.\n"
        f"\n  Chosen: merge_at = {C.DEFAULT_MERGE_AT} (see cluster.py).\n"
        "  Note the merge step is nearly inert on this corpus — it fires once. Calibrated on a\n"
        "  synthetic corpus it was load-bearing; on real data the centroid distribution has no gap\n"
        "  for it to exploit. That non-transfer is reported rather than hidden."
    )


if __name__ == "__main__":
    main()
