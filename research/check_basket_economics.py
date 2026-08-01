"""Recompute every corpus number quoted in `research/transcripts/P03.md` §3.

P03 named a barrier the schema has no field for — basket economics, i.e. a minimum-order or
free-delivery threshold shaping what goes in the cart. Unlike the other two gaps the interviews
found, this one *does* leave text, so the claim "the engine can see this and has nowhere to put it"
is checkable against the collected corpus rather than argued.

Run:  python research/check_basket_economics.py

Prints the counts quoted in the transcript. If they don't match, the transcript is wrong and should
be corrected — the same discipline as `research/verify_personas.py`, and for the same reason: a
plausible number written alongside an argument is not evidence for it.
"""

from __future__ import annotations

import collections
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "data" / "interim" / "documents.jsonl"
RELEVANCE = ROOT / "data" / "interim" / "relevance.jsonl"

# Broad: any mention of the fee/threshold machinery.
BASKET_ECONOMICS = re.compile(
    r"\b(min(imum)?\s*(order|cart|amount|value)|mov\b|handling\s*(charge|fee)|"
    r"deliver(y|ies)\s*(charge|fee|charges|fees)|free\s*deliver|"
    r"small\s*cart|cart\s*(value|amount)|surge\s*fee|rain\s*fee|extra\s*charge)",
    re.I,
)

# Narrow: a *threshold* specifically — a rupee line the basket has to clear. This is the subset
# that speaks to basket shape rather than to fees being disliked in general.
THRESHOLD = re.compile(
    r"\b(min(imum)?\s*(order|cart|amount|value|purchase)|"
    r"free\s*deliver\w*\s*(above|over|on|for|after)?|"
    r"above\s*\d{2,4}|below\s*\d{2,4}|under\s*\d{2,4}|"
    r"\d{2,4}\s*(se\s*)?(upar|ke\s*upar)|order\s*(above|below|under))",
    re.I,
)


def load(path: pathlib.Path) -> dict:
    if not path.exists():
        raise SystemExit(f"missing {path} — run collection and the relevance stage first")
    out = {}
    with path.open() as fh:
        for line in fh:
            line = line.strip()
            if line:
                rec = json.loads(line)
                out[rec["doc_id"]] = rec
    return out


def report(name: str, pattern: re.Pattern, docs: dict, rel: dict) -> list[str]:
    hits = [i for i, d in docs.items() if pattern.search(d["text"])]
    verdicts = collections.Counter()
    for doc_id in hits:
        r = rel.get(doc_id)
        if r is None:
            verdicts["not scored"] += 1
        elif r["is_relevant"]:
            verdicts["kept as relevant"] += 1
        else:
            verdicts[f"rejected: {r['off_topic_reason']}"] += 1

    print(f"\n{name}: {len(hits)} of {len(docs)} documents")
    for label, n in verdicts.most_common():
        print(f"  {n:5d}  {label}")
    return hits


def main() -> None:
    docs = load(DOCS)
    rel = load(RELEVANCE)
    print(f"corpus: {len(docs)} documents, {len(rel)} relevance verdicts")

    report("Basket-economics language (broad)", BASKET_ECONOMICS, docs, rel)
    narrow = report("Threshold-shapes-the-basket language (narrow)", THRESHOLD, docs, rel)

    # The point of the section is the ones the gate KEPT: those reach extraction, where the
    # barrier[] enum has no value for what they describe.
    kept = [i for i in narrow if rel.get(i, {}).get("is_relevant")]
    print(f"\nKept as relevant and heading into extraction with no barrier[] code to land in: {len(kept)}")
    print("\nSample:")
    for doc_id in kept[:5]:
        print(f"  · {docs[doc_id]['text'][:150]}")

    print(
        "\nCaveat: keyword matching, so both over- and under-inclusive. It establishes that the "
        "signal is present in quantity, not its exact prevalence."
    )


if __name__ == "__main__":
    main()
