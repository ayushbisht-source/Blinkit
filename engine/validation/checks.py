"""The five validation checks from docs/ARCHITECTURE.md.

    python -m engine.validation.checks

None of these need an API key — they are measurements over artifacts the pipeline already produced.
That is deliberate: a validation suite that costs money to run is a validation suite that gets run
once and then quietly skipped.

The checks exist because "we used AI to find themes" is not evidence. Each one attacks a specific
way this pipeline could be producing confident nonsense:

  1. grounding    — are the quotes real, or did the model invent them?
  2. saturation   — did we read enough documents, or would more change the answer?
  3. hold-out     — do the themes generalise, or are they fitted to the sample?
  4. source spread— is a theme a finding, or an artifact of one platform's review culture?
  5. gate audit   — did the relevance filter throw away signal along with the noise?

Human agreement (Cohen's kappa against a hand-labelled gold set) is the sixth check in the
architecture doc. It cannot be automated — it needs someone to label documents — so it is scored
here only if data/gold/labels.jsonl exists, and reported as NOT RUN otherwise rather than silently
skipped.
"""

from __future__ import annotations

import json
import logging
import random
from collections import Counter
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("validate")

INTERIM = Path("data/interim")
PROCESSED = Path("data/processed")
GOLD = Path("data/gold/labels.jsonl")
REPORT = PROCESSED / "validation.json"


def _load(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.open():
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


# ── 1. Quote grounding ─────────────────────────────────────────────────────────────────────────
def check_grounding(extractions: list[dict], docs: dict[str, dict]) -> dict:
    """Every evidence_quote must be a verbatim substring of its source document.

    This is the single most important check in the suite. If the model is fabricating quotes, every
    theme built on them is worthless, and no amount of downstream rigour recovers it. A pass here is
    what licenses quoting the corpus in the case study at all.
    """
    checked = exact = normalised = 0
    failures = []
    for e in extractions:
        q = (e.get("evidence_quote") or "").strip()
        if not q:
            continue
        src = docs.get(e["doc_id"], {}).get("text", "")
        checked += 1
        if q in src:
            exact += 1
        elif " ".join(q.lower().split()) in " ".join(src.lower().split()):
            # Differs only in whitespace/case. Counted separately: not a hallucination, but not
            # the character-exact copy the prompt asked for either.
            normalised += 1
        else:
            failures.append({"doc_id": e["doc_id"], "quote": q[:120]})

    hallucinated = len(failures)
    return {
        "name": "quote grounding",
        "checked": checked,
        "exact": exact,
        "whitespace_normalised": normalised,
        "hallucinated": hallucinated,
        "hallucination_rate": round(hallucinated / checked, 4) if checked else None,
        "pass": checked > 0 and hallucinated == 0,
        "examples": failures[:5],
    }


# ── 2. Theme saturation ────────────────────────────────────────────────────────────────────────
def check_saturation(extractions: list[dict], trials: int = 20, seed: int = 0) -> dict:
    """Does theme discovery plateau as documents are added?

    Uses the extracted barrier/gap label set as a proxy for "distinct findings", shuffled repeatedly
    so the curve does not depend on corpus ordering. If the curve is still climbing steeply at the
    end, the honest conclusion is that the corpus is too small — which is a finding, not a failure.
    """
    labels_per_doc = []
    for e in extractions:
        labels = set(e.get("barrier") or []) | set(f"gap:{g}" for g in (e.get("information_gap") or []))
        labels_per_doc.append(labels)

    n = len(labels_per_doc)
    if n < 20:
        return {"name": "theme saturation", "pass": False, "reason": f"only {n} extractions"}

    rng = random.Random(seed)
    curves = []
    for _ in range(trials):
        order = labels_per_doc[:]
        rng.shuffle(order)
        seen, curve = set(), []
        for labels in order:
            seen |= labels
            curve.append(len(seen))
        curves.append(curve)

    mean_curve = [sum(c[i] for c in curves) / trials for i in range(n)]
    final = mean_curve[-1]
    # Share of all distinct labels already discovered by the halfway point. High = saturated early.
    half = mean_curve[n // 2] / final if final else 0
    # New labels per document over the last decile — near zero means adding more docs adds nothing.
    tail_start = max(0, int(n * 0.9))
    tail_rate = (mean_curve[-1] - mean_curve[tail_start]) / max(1, n - tail_start)

    return {
        "name": "theme saturation",
        "n_documents": n,
        "distinct_labels": round(final, 2),
        "share_found_by_halfway": round(half, 4),
        "new_labels_per_doc_final_decile": round(tail_rate, 5),
        # Saturated if the tail is essentially flat and most labels appeared early.
        "pass": tail_rate < 0.01 and half > 0.85,
        "curve_sample": [round(mean_curve[int(n * f)], 2) for f in (0.1, 0.25, 0.5, 0.75, 0.99)],
    }


# ── 3. Hold-out generalisation ─────────────────────────────────────────────────────────────────
def check_holdout(themes: dict, extractions: list[dict], holdout_frac: float = 0.2, seed: int = 0) -> dict:
    """Do the discovered themes describe documents they were not built from?

    Themes are clustered on the full set, so this is a coverage test rather than a true unseen-data
    test: it asks whether a random 20% slice is represented across the themes roughly in proportion,
    or whether it piles into a few clusters — the latter meaning the themes are fitted to the
    majority and miss a distinct subpopulation.
    """
    ids = [e["doc_id"] for e in extractions]
    rng = random.Random(seed)
    held = set(rng.sample(ids, max(1, int(len(ids) * holdout_frac))))

    per_theme = []
    for t in themes.get("themes", []):
        members = set(t["member_doc_ids"])
        if not members:
            continue
        per_theme.append(len(members & held) / len(members))

    if not per_theme:
        return {"name": "hold-out generalisation", "pass": False, "reason": "no themes"}

    expected = holdout_frac
    worst = max(abs(p - expected) for p in per_theme)
    return {
        "name": "hold-out generalisation",
        "holdout_fraction": holdout_frac,
        "themes_examined": len(per_theme),
        "max_deviation_from_expected": round(worst, 4),
        # Every theme should contain roughly the holdout share; a large deviation means at least
        # one theme is built almost entirely from one slice of the corpus.
        "pass": worst < 0.25,
    }


# ── 4. Source spread ───────────────────────────────────────────────────────────────────────────
def check_source_spread(themes: dict) -> dict:
    """A theme appearing in only one source is a platform artifact, not a user finding.

    Play Store and App Store review cultures differ sharply — length, tone, what people bother to
    write about. A "theme" confined to one of them is more likely a property of that platform's
    review prompt than of how people shop.
    """
    rows = []
    for t in themes.get("themes", []):
        rows.append(
            {
                "theme_id": t["theme_id"],
                "label": t["label"],
                "sources": t["source_spread"],
                "single_source": t["single_source"],
                "prevalence": t["prevalence"],
            }
        )
    if not rows:
        # A check with nothing to examine has not passed — it has not run. Reporting this as PASS
        # would put a green tick next to an empty analysis.
        return {"name": "source spread", "status": "NOT RUN", "pass": None,
                "note": "no themes yet — run engine.pipeline.cluster first"}

    single = [r for r in rows if r["single_source"]]
    return {
        "name": "source spread",
        "themes": len(rows),
        "single_source_themes": len(single),
        "single_source_share": round(len(single) / len(rows), 4),
        # Not a hard failure — it is a flag. Single-source themes are reported, not deleted.
        "pass": True,
        "flagged": [{"theme_id": r["theme_id"], "label": r["label"], "sources": r["sources"]} for r in single],
    }


# ── 5. Relevance gate audit ────────────────────────────────────────────────────────────────────
def check_gate(relevance: list[dict], docs: dict[str, dict], sample: int = 40, seed: int = 0) -> dict:
    """Did the cheap gate discard documents that actually contained shopping-behaviour signal?

    The gate removed ~72% of the corpus. If it was over-eager, the whole analysis is built on a
    biased remainder. This samples rejected documents and flags any containing behaviour vocabulary
    the gate should arguably have kept — a cheap, automatable proxy for a human re-read.
    """
    import re

    rejected = [r for r in relevance if not r.get("is_relevant")]
    if not rejected:
        return {"name": "relevance gate audit", "pass": False, "reason": "no rejected documents"}

    rng = random.Random(seed)
    picked = rng.sample(rejected, min(sample, len(rejected)))

    # Vocabulary that suggests a document was about *what* someone buys, not delivery logistics.
    signal = re.compile(
        r"\b(never (?:bought|tried|order)|always buy|only buy|instead of|switch(?:ed)? to|"
        r"stopped buying|didn'?t know they|had no idea|used to buy|prefer|compare[ds]?|"
        r"cheaper (?:at|on|than)|same brand|new brand|first time)\b",
        re.I,
    )

    suspicious = []
    for r in picked:
        text = docs.get(r["doc_id"], {}).get("text", "")
        if signal.search(text):
            suspicious.append(
                {"doc_id": r["doc_id"], "reason_given": r.get("off_topic_reason"), "text": text[:160]}
            )

    rate = len(suspicious) / len(picked)
    return {
        "name": "relevance gate audit",
        "rejected_total": len(rejected),
        "sampled": len(picked),
        "possible_false_negatives": len(suspicious),
        "false_negative_rate_estimate": round(rate, 4),
        # A few borderline calls are expected; a high rate means the gate is eating signal.
        "pass": rate < 0.15,
        "examples": suspicious[:5],
    }


# ── 6. Human agreement (only if a gold set exists) ─────────────────────────────────────────────
def check_human_agreement(relevance: list[dict]) -> dict:
    """Cohen's kappa between the gate and hand labels, if any exist.

    Reported as NOT RUN rather than skipped when absent, so its absence is visible in the report
    instead of being mistaken for a pass.
    """
    gold = _load(GOLD)
    if not gold:
        return {
            "name": "human agreement (Cohen's kappa)",
            "status": "NOT RUN",
            "pass": None,
            "note": "No data/gold/labels.jsonl. Hand-label ~50 documents with {doc_id, is_relevant} to enable.",
        }

    truth = {g["doc_id"]: bool(g["is_relevant"]) for g in gold}
    pred = {r["doc_id"]: bool(r["is_relevant"]) for r in relevance}
    shared = [d for d in truth if d in pred]
    if not shared:
        return {"name": "human agreement (Cohen's kappa)", "status": "NOT RUN", "pass": None,
                "note": "gold set and relevance output share no doc_ids"}

    a = [truth[d] for d in shared]
    b = [pred[d] for d in shared]
    n = len(shared)
    observed = sum(x == y for x, y in zip(a, b)) / n
    pa, pb = sum(a) / n, sum(b) / n
    expected = pa * pb + (1 - pa) * (1 - pb)
    kappa = (observed - expected) / (1 - expected) if expected < 1 else 1.0

    return {
        "name": "human agreement (Cohen's kappa)",
        "n": n,
        "observed_agreement": round(observed, 4),
        "kappa": round(kappa, 4),
        "pass": kappa >= 0.65,
    }


def main() -> None:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    extractions = _load(INTERIM / "extractions.jsonl")
    relevance = _load(INTERIM / "relevance.jsonl")
    docs = {d["doc_id"]: d for d in _load(INTERIM / "documents.jsonl")}
    themes_path = PROCESSED / "themes.json"
    themes = json.loads(themes_path.read_text()) if themes_path.exists() else {"themes": []}

    log.info("inputs: %d docs, %d relevance verdicts, %d extractions, %d themes",
             len(docs), len(relevance), len(extractions), len(themes.get("themes", [])))

    results = [
        check_grounding(extractions, docs),
        check_saturation(extractions),
        check_holdout(themes, extractions),
        check_source_spread(themes),
        check_gate(relevance, docs),
        check_human_agreement(relevance),
    ]

    REPORT.write_text(json.dumps({"checks": results}, indent=2))

    print("\n── Validation ──\n")
    for r in results:
        status = "NOT RUN" if r.get("pass") is None else ("PASS" if r["pass"] else "FAIL")
        print(f"{status:>7}  {r['name']}")
        for k, v in r.items():
            if k in ("name", "pass", "examples", "flagged", "curve_sample", "status"):
                continue
            print(f"         {k}: {v}")
    print(f"\nreport -> {REPORT}\n")


if __name__ == "__main__":
    main()
