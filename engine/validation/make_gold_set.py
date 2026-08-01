"""Produce a hand-labelling worksheet so the human-agreement check can actually run.

    python -m engine.validation.make_gold_set --n 50

Cohen's kappa between the relevance gate and a human is the one validation check that cannot be
automated — it requires a person to read documents and disagree. This samples documents, strips the
model's verdict so the labeller isn't anchored by it, and writes a file that takes about fifteen
minutes to fill in.

Sampling is stratified across the gate's own decision classes (relevant, and each rejection reason)
rather than uniform. A uniform sample of a corpus that is ~72% rejected would be mostly obvious
noise, producing a flattering kappa that says nothing about the boundary cases where the gate
actually might be wrong.
"""

from __future__ import annotations

import argparse
import json
import random
from collections import defaultdict
from pathlib import Path

INTERIM = Path("data/interim")
GOLD = Path("data/gold")
WORKSHEET = GOLD / "worksheet.md"
LABELS = GOLD / "labels.jsonl"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=50)
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()

    GOLD.mkdir(parents=True, exist_ok=True)
    docs = {json.loads(l)["doc_id"]: json.loads(l) for l in (INTERIM / "documents.jsonl").open()}
    relevance = [json.loads(l) for l in (INTERIM / "relevance.jsonl").open()]

    # Stratify by the gate's decision class so borderline rejections are represented.
    strata: dict[str, list] = defaultdict(list)
    for r in relevance:
        key = "relevant" if r.get("is_relevant") else f"rejected:{r.get('off_topic_reason')}"
        strata[key].append(r)

    rng = random.Random(args.seed)
    per_stratum = max(1, args.n // len(strata))
    picked = []
    for key, rows in sorted(strata.items()):
        picked.extend(rng.sample(rows, min(per_stratum, len(rows))))
    rng.shuffle(picked)          # present in random order — no clustering by class
    picked = picked[: args.n]

    lines = [
        "# Gold set — relevance labelling worksheet",
        "",
        "**Question for each document:** does it say anything about *what* the person chooses to",
        "buy — what they bought, why, how they found it, what stopped them buying something, or",
        "what they buy elsewhere instead?",
        "",
        "- **YES** — anything about shopping behaviour, product choice, or category decisions",
        "- **NO** — purely about delivery times, rider conduct, app bugs, refunds, or contentless praise",
        "",
        "Borderline rule: a delivery complaint is NO, but a delivery complaint that explains why they",
        "only buy certain things is YES — the link to *what* they buy is what matters.",
        "",
        "The model's verdict is deliberately not shown. Seeing it first would anchor your judgement",
        "and inflate the agreement score.",
        "",
        "Replace each `?` with `YES` or `NO`, then run:",
        "",
        "```",
        "python -m engine.validation.make_gold_set --compile",
        "python -m engine.validation.checks",
        "```",
        "",
        "---",
        "",
    ]
    for i, r in enumerate(picked, 1):
        text = (docs.get(r["doc_id"], {}).get("text") or "").replace("\n", " ").strip()
        lines.append(f"### {i}. `{r['doc_id']}`")
        lines.append("")
        lines.append(f"> {text[:400]}")
        lines.append("")
        lines.append("**Relevant?** `?`")
        lines.append("")

    WORKSHEET.write_text("\n".join(lines))
    print(f"wrote {WORKSHEET} with {len(picked)} documents across {len(strata)} strata")
    print("strata:", {k: min(per_stratum, len(v)) for k, v in sorted(strata.items())})


def compile_labels() -> None:
    """Parse the filled worksheet into labels.jsonl for the kappa check."""
    import re

    if not WORKSHEET.exists():
        raise SystemExit(f"{WORKSHEET} not found — generate it first.")

    text = WORKSHEET.read_text()
    blocks = re.findall(r"### \d+\. `([^`]+)`.*?\*\*Relevant\?\*\* `([^`]+)`", text, re.S)
    rows, unlabelled = [], 0
    for doc_id, verdict in blocks:
        v = verdict.strip().upper()
        if v == "YES":
            rows.append({"doc_id": doc_id, "is_relevant": True})
        elif v == "NO":
            rows.append({"doc_id": doc_id, "is_relevant": False})
        else:
            unlabelled += 1

    LABELS.write_text("\n".join(json.dumps(r) for r in rows))
    print(f"compiled {len(rows)} labels -> {LABELS}" + (f"  ({unlabelled} still unlabelled)" if unlabelled else ""))
    if len(rows) < 30:
        print("NOTE: kappa on fewer than ~30 labels is too noisy to report. Label more.")


if __name__ == "__main__":
    import sys

    if "--compile" in sys.argv:
        compile_labels()
    else:
        main()
