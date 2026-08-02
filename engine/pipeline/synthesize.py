"""Turn themes into insights.

    python -m engine.pipeline.synthesize

A theme is a cluster. An insight names the mechanism behind it and states what follows. The gap
between those two is where most analyses quietly fail — restating a cluster in more confident
language feels like progress and isn't.

Two safeguards against that failure mode are built in rather than left to the prompt:

  1. `contradicting_evidence` is computed here, not asked of the model. Documents inside a theme
     whose extracted barrier labels disagree with the theme's dominant barrier are counted and
     attached. A model asked to find evidence against its own conclusion tends to find none; the
     data can be checked directly.

  2. Prevalence, n, source spread and segment skew are carried over from the clustering step
     untouched. The model never gets to state a number, so it cannot inflate one.
"""

from __future__ import annotations

import argparse
import json
import logging
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

from engine.llm import LLMClient

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("synthesize")

PROMPTS = Path("engine/prompts")
INTERIM = Path("data/interim")
PROCESSED = Path("data/processed")
THEMES = PROCESSED / "themes.json"
EXTRACTIONS = INTERIM / "extractions.jsonl"
INSIGHTS = PROCESSED / "insights.json"

SYNTH_BATCH = 3  # a few themes per call; enough context each, few enough calls to be quota-cheap

# Output budget per theme. Was 700, which silently broke this whole stage.
#
# Extraction asks the same model (strong tier) for 400 tokens per document and works. Synthesis
# looked comparable but is not: an extraction row is a handful of enum labels, while an insight is
# five prose fields — statement, mechanism, so_what, caveat, evidence. On top of that the model
# spends part of max_tokens on extended thinking before writing anything, so a 3,600-token ceiling
# for four rich insights truncated the JSON mid-object every single time.
#
# 2,500 with a 2,000 base and three themes per call gives 9,500 — comparable headroom to the 7,000
# extraction runs on 15 documents, for output that is far longer per item.
TOKENS_PER_THEME = 2500


def _load_extractions() -> dict[str, dict]:
    out = {}
    if not EXTRACTIONS.exists():
        return out
    for line in EXTRACTIONS.open():
        try:
            r = json.loads(line)
            out[r["doc_id"]] = r
        except (json.JSONDecodeError, KeyError):
            continue
    return out


def contradicting_docs(theme: dict, extractions: dict[str, dict]) -> list[str]:
    """Documents inside the theme that disagree with its dominant barrier.

    Computed rather than requested. Asking a model for evidence against its own conclusion reliably
    returns an empty list; counting label disagreement inside the cluster does not. An empty result
    here is itself informative — it means the theme is unusually coherent, not that nobody looked.
    """
    dominant = set(theme.get("dominant_barriers") or [])
    if not dominant:
        return []
    against = []
    for doc_id in theme.get("member_doc_ids", []):
        row = extractions.get(doc_id)
        if not row:
            continue
        labels = set(row.get("barrier") or [])
        # Has barrier labels, none of which are the theme's dominant one.
        if labels and not (labels & dominant):
            against.append(doc_id)
    return against


def _theme_payload(theme: dict) -> dict:
    """What the model sees. Deliberately excludes prevalence and counts."""
    return {
        "theme_id": theme["theme_id"],
        "label": theme["label"],
        "dominant_barriers": theme.get("dominant_barriers", []),
        "dominant_information_gaps": theme.get("dominant_gaps", []),
        "dominant_habit_drivers": theme.get("dominant_habit_drivers", []),
        "segment_signals": theme.get("segment_skew", []),
        "sentiment": theme.get("sentiment"),
        "quotes": [q["quote"] for q in theme.get("representative_quotes", [])][:5],
    }


def _collect(result, batch: list[dict]) -> tuple[dict[str, dict], str]:
    """Pull per-theme objects out of whatever shape the model actually returned.

    The prompt asks for a bare JSON array. Models routinely comply *almost*: wrapping the array in
    `{"insights": [...]}` is the common one. The original loop did `for r in result` and checked
    `isinstance(r, dict)`, so a wrapped response iterated the dict's **keys** — strings — matched
    nothing, raised nothing, and left the batch silently empty. Nine batches of that produced 25
    placeholder insights and a green workflow.

    So: accept the array, accept a single wrapped array whatever the key is called, accept a lone
    object. Match on `theme_id`; if the model returned the right number of objects but unrecognised
    ids, fall back to positional order and say so, because losing good analysis to an id typo is
    worse than a warning.

    Returns (insights_by_theme_id, reason_if_empty).
    """
    if isinstance(result, dict):
        # A wrapper object: take the first value that is a list of dicts.
        for value in result.values():
            if isinstance(value, list) and any(isinstance(v, dict) for v in value):
                result = value
                break
        else:
            # Or a single insight returned bare rather than in an array.
            result = [result] if result.get("theme_id") else []

    if not isinstance(result, list):
        return {}, f"expected a list, got {type(result).__name__}"
    if not result:
        return {}, "empty array"

    objects = [r for r in result if isinstance(r, dict)]
    if not objects:
        kinds = sorted({type(r).__name__ for r in result})
        return {}, f"array contained no objects (types: {', '.join(kinds)})"

    wanted = {t["theme_id"] for t in batch}
    matched = {r["theme_id"]: r for r in objects if r.get("theme_id") in wanted}
    if matched:
        return matched, ""

    if len(objects) == len(batch):
        log.warning(
            "    theme_ids unrecognised (%s) — assigning by position",
            ", ".join(str(r.get("theme_id")) for r in objects),
        )
        return {t["theme_id"]: {**r, "theme_id": t["theme_id"]} for t, r in zip(batch, objects)}, ""

    return {}, (
        f"{len(objects)} object(s) but none carried a theme_id from this batch "
        f"(got {[r.get('theme_id') for r in objects]}, wanted {sorted(wanted)})"
    )


def fallback_insight(theme: dict) -> dict:
    """Used when no LLM is available.

    Deliberately does NOT invent a mechanism — that is exactly the thing a template cannot do
    honestly. It states the observation and marks the mechanism as unanalysed, so a reader can tell
    at a glance which insights were synthesised and which are placeholders.
    """
    barriers = ", ".join(theme.get("dominant_barriers") or []) or "unclassified"
    return {
        "theme_id": theme["theme_id"],
        "statement": f"Cluster of {theme['doc_count']} statements characterised by: {theme['label']}.",
        "mechanism": "NOT ANALYSED — generated without a model; no mechanism claimed.",
        "so_what": f"Dominant barrier(s): {barriers}. Requires synthesis before use.",
        "research_questions_answered": [],
        "confidence": 0.0,
        "caveat": "Template output, not analysis. Re-run with an API key present.",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-prevalence", type=float, default=0.0,
                    help="skip themes below this share of statements")
    ap.add_argument("--allow-placeholders", action="store_true",
                    help="write deterministic placeholders even if every LLM batch failed. Off by "
                         "default: placeholders read like insights and are not ones.")
    args = ap.parse_args()

    if not THEMES.exists():
        raise SystemExit(f"{THEMES} not found — run `python -m engine.pipeline.cluster` first.")

    payload = json.loads(THEMES.read_text())
    themes = [t for t in payload.get("themes", []) if t["prevalence"] >= args.min_prevalence]
    extractions = _load_extractions()
    log.info("synthesising %d themes", len(themes))

    try:
        client = LLMClient()
    except Exception as exc:  # noqa: BLE001
        log.warning("no LLM available (%s) — emitting placeholders", exc)
        client = None

    system = (PROMPTS / "synthesize.txt").read_text()
    written: dict[str, dict] = {}

    failures: list[str] = []
    if client:
        for i in range(0, len(themes), SYNTH_BATCH):
            batch = themes[i : i + SYNTH_BATCH]
            user = json.dumps([_theme_payload(t) for t in batch], indent=2)
            n_batch = i // SYNTH_BATCH + 1
            try:
                result = client.structured(
                    system, user, tier="strong", max_tokens=len(batch) * TOKENS_PER_THEME + 2000
                )
                got, why = _collect(result, batch)
                if got:
                    written.update(got)
                    log.info("  batch %d: %d/%d themes synthesised", n_batch, len(got), len(batch))
                else:
                    # A response that parsed but yielded nothing usable is a failure. Previously
                    # this path raised nothing, logged nothing and left `written` empty — the call
                    # cost money, the loop "succeeded", and placeholders were written.
                    failures.append(f"unusable response: {why}")
                    log.warning("  batch %d returned nothing usable — %s", n_batch, why)
            except Exception as exc:  # noqa: BLE001
                # Type as well as message. "Expecting value: line 1 column 1" is a truncated
                # response; an LLMError naming block types is a budget spent entirely on thinking.
                # The bare message alone told us neither.
                detail = f"{type(exc).__name__}: {exc}"
                failures.append(detail)
                log.warning("  batch %d failed — %s", n_batch, detail)

    # The whole point of this stage is the LLM pass. If a client was available and *nothing* came
    # back, the placeholders below are not a graceful degradation — they are 25 restatements of
    # theme labels with confidence 0.0, and every one of them would flow into the case study
    # looking like an insight.
    #
    # This is exactly how it failed: every batch died on a truncated response, each failure logged
    # as a warning, the process exited 0, the workflow went green, and insights.json was committed
    # full of "Cluster of 72 statements characterised by: receives / expiry / spoiled / milk."
    #
    # `enrich.py` already learned this lesson and has TooManyFailures. This stage had no equivalent.
    if client and not written and not args.allow_placeholders:
        raise SystemExit(
            f"Synthesis produced nothing from {len(themes)} themes — every one of "
            f"{len(failures)} batches failed, so insights.json would contain only placeholders.\n"
            f"First failure: {failures[0] if failures else '(none recorded)'}\n"
            f"Run with --allow-placeholders to write them anyway."
        )
    if client and failures:
        log.warning(
            "%d of %d batches failed; %d themes carry placeholders rather than synthesis",
            len(failures), (len(themes) + SYNTH_BATCH - 1) // SYNTH_BATCH, len(themes) - len(written),
        )

    insights = []
    for n, theme in enumerate(themes, 1):
        model_out = written.get(theme["theme_id"]) or fallback_insight(theme)
        against = contradicting_docs(theme, extractions)

        # Segment skew, recomputed from members rather than trusted from the model.
        segments = Counter(
            s for d in theme.get("member_doc_ids", [])
            for s in (extractions.get(d, {}).get("segment_signal") or [])
        )

        insights.append(
            {
                "insight_id": f"INS-{n:02d}",
                "theme_id": theme["theme_id"],
                "statement": model_out.get("statement", ""),
                "mechanism": model_out.get("mechanism", ""),
                "so_what": model_out.get("so_what", ""),
                # Numbers come from the data, never from the model.
                "prevalence": theme["prevalence"],
                "n": theme["doc_count"],
                "source_spread": theme["source_spread"],
                "single_source": theme["single_source"],
                "segment_skew": [s for s, _ in segments.most_common(3)],
                "research_questions_answered": model_out.get("research_questions_answered", []),
                "evidence_doc_ids": [q["doc_id"] for q in theme.get("representative_quotes", [])],
                "evidence_quotes": [q["quote"] for q in theme.get("representative_quotes", [])][:3],
                "contradicting_evidence": against,
                "contradiction_rate": round(len(against) / theme["doc_count"], 4) if theme["doc_count"] else 0.0,
                "confidence": model_out.get("confidence", 0.0),
                "caveat": model_out.get("caveat", ""),
            }
        )

    # Sort by prevalence so the strongest evidence leads.
    insights.sort(key=lambda i: i["prevalence"], reverse=True)
    for n, ins in enumerate(insights, 1):
        ins["insight_id"] = f"INS-{n:02d}"

    covered = sorted({q for i in insights for q in i["research_questions_answered"]})
    INSIGHTS.write_text(json.dumps({
        "n_insights": len(insights),
        "research_questions_covered": covered,
        "research_questions_uncovered": [q for q in range(1, 9) if q not in covered],
        "insights": insights,
    }, indent=2))

    log.info("insights -> %s", INSIGHTS)
    for i in insights:
        flags = []
        if i["single_source"]:
            flags.append("SINGLE-SOURCE")
        if i["contradiction_rate"] > 0.25:
            flags.append(f"CONTRADICTED {i['contradiction_rate']:.0%}")
        if i["confidence"] < 0.4:
            flags.append("LOW-CONFIDENCE")
        log.info("  %s n=%-4d %5.1f%%  %s%s", i["insight_id"], i["n"], i["prevalence"] * 100,
                 i["statement"][:80], "  [" + ", ".join(flags) + "]" if flags else "")
    log.info("research questions covered: %s", covered)
    if not covered:
        log.warning("no research questions mapped — insights are not tied to the brief")


if __name__ == "__main__":
    main()
