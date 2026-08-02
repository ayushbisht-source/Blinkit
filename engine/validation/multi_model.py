"""Do independent models agree about what the themes mean?

    python -m engine.validation.multi_model
    python -m engine.validation.multi_model --specs gemini:gemini-flash-latest groq:llama-3.3-70b-versatile

Part 1's weakest claim is the one it cannot make by counting: the themes are computed, the
prevalences are computed, the quotes are verified character-for-character — but the *insights*, the
mechanism behind each theme, come from a single model in a single pass. "An AI wrote our insights"
is not evidence, and no amount of internal consistency fixes that.

This runs synthesis again under one or more additional models and measures how much they agree.
Agreement is not truth: three models can share a bias, and models trained on overlapping data are
not independent in the way two human coders are. But *dis*agreement is decisive — if two models
read the same 631 statements and produce incompatible mechanisms, the single-model version was
never evidence, and this says so with a number.

## What is measured

1. **Research-question agreement** — Jaccard over `research_questions_answered` per theme. Do the
   models think the same theme answers the same questions?

2. **Confidence agreement** — mean absolute difference. A model that says 0.9 where another says
   0.3 is not describing the same evidence.

3. **Mechanism agreement** — TF-IDF cosine between the two models' `mechanism` text for the *same*
   theme, measured against a null: the cosine between mechanisms written for *different* themes.
   This is the one that matters. Any two pieces of text about quick commerce share vocabulary, so
   raw similarity is meaningless on its own; the question is whether same-theme pairs are more
   similar than different-theme pairs, and by how much.

## What it cannot tell you

Whether the agreed-upon mechanism is *correct*. Two models agreeing that users avoid a category
because of price uncertainty is evidence they read the same quotes the same way, not evidence about
users. That is what Part 2's interviews are for — and notably, the interviews found three things no
model found in 3,372 documents, which is the sharper limit on this whole approach.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("multi-model")

PROCESSED = Path("data/processed")
THEMES = PROCESSED / "themes.json"
OUT = PROCESSED / "multi_model_agreement.json"
PROMPTS = Path("engine/prompts")

# Which family produced data/processed/insights.json. Read from the file when possible; this is
# the fallback used to decide whether a comparison is cross-family or same-family.
DEFAULT_BASELINE_FAMILY = os.getenv("BASELINE_FAMILY", "gemini")

# provider:model. Chosen to be different model *families* — two Gemini variants agreeing says much
# less than Gemini and Llama agreeing, because the failure being tested for is shared bias.
DEFAULT_SPECS = [
    "gemini:gemini-flash-latest",
    "groq:llama-3.3-70b-versatile",
]


def _run_one(spec: str, themes: list[dict], system: str,
             failures: list[dict] | None = None) -> dict[str, dict]:
    """Synthesise every theme under one provider:model. Returns {theme_id: insight}.

    Per-batch failures are appended to `failures` and written into the committed output. Diagnosing
    this stage from job logs cost three wrong guesses and four runs: the warnings sat ~150 lines
    into a log the tooling would only tail, so "3 of 25 themes" was all that was visible and the
    reason never was. A failure that is not recorded as data is a failure you debug by guessing.
    """
    from engine.llm import LLMClient
    from engine.pipeline.synthesize import (
        SYNTH_BATCH,
        TOKENS_PER_THEME,
        _collect,
        _theme_payload,
        format_hint,
    )

    provider, _, model = spec.partition(":")
    if not os.getenv(f"{provider.upper()}_API_KEY"):
        raise SystemExit(f"{provider.upper()}_API_KEY not set — cannot run {spec}")

    # Pin the model by env, which is how every model name in this codebase is overridden, so the
    # spec strings above stay honest about exactly what ran.
    if model:
        os.environ[f"{provider.upper()}_MODEL_STRONG"] = model
    import importlib

    import engine.llm as llm_module

    importlib.reload(llm_module)  # constants are read at import time
    client = llm_module.LLMClient(provider=provider)

    # Plumbing only — the analytical instructions stay identical across providers, or the
    # comparison would not be measuring the same task.
    system = system + format_hint(provider)

    out: dict[str, dict] = {}
    for i in range(0, len(themes), SYNTH_BATCH):
        batch = themes[i : i + SYNTH_BATCH]
        user = json.dumps([_theme_payload(t) for t in batch], indent=2)
        try:
            result = client.structured(
                system, user, tier="strong", max_tokens=len(batch) * TOKENS_PER_THEME + 2000
            )
            got, why = _collect(result, batch)
            out.update(got)
            if not got:
                log.warning("  [%s] batch %d unusable: %s", spec, i // SYNTH_BATCH + 1, why)
                if failures is not None:
                    failures.append({
                        "spec": spec, "batch": i // SYNTH_BATCH + 1, "kind": "unusable_response",
                        "reason": why,
                        "response_type": type(result).__name__,
                        "response_preview": str(result)[:400],
                    })
        except Exception as exc:  # noqa: BLE001
            log.warning("  [%s] batch %d failed: %s: %s", spec, i // SYNTH_BATCH + 1,
                        type(exc).__name__, exc)
            if failures is not None:
                failures.append({
                    "spec": spec, "batch": i // SYNTH_BATCH + 1, "kind": "exception",
                    "exception_type": type(exc).__name__, "message": str(exc)[:600],
                })
    log.info("[%s] synthesised %d/%d themes", spec, len(out), len(themes))
    return out


def _jaccard(a: list, b: list) -> float:
    sa, sb = set(a or []), set(b or [])
    if not sa and not sb:
        return 1.0
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _mechanism_agreement(runs: dict[str, dict[str, dict]], shared: list[str]) -> dict:
    """Same-theme mechanism similarity across models, against a different-theme null."""
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    names = sorted(runs)
    if len(names) < 2 or len(shared) < 3:
        return {"note": "needs >=2 models and >=3 shared themes"}

    a_texts = [(runs[names[0]][t].get("mechanism") or "") for t in shared]
    b_texts = [(runs[names[1]][t].get("mechanism") or "") for t in shared]

    # Character n-grams, not words. Two models describing the same mechanism paraphrase each other
    # — "cannot judge freshness before ordering" vs "no way to assess freshness in advance" — and
    # word-level TF-IDF scores that pair almost as low as unrelated text. Measured on ten
    # hand-written paraphrase pairs: word (1,2) gave a lift over null of +0.052, char_wb (3,5) gave
    # +0.148, with both recovering the correct pairing 5/10 times against a 1/10 chance baseline.
    #
    # This is still a lexical measure and it is the weakest link in this check. It cannot recognise
    # agreement expressed in genuinely different vocabulary, so it *understates* agreement and
    # never overstates it — which is the right direction for a validation metric to be wrong in.
    vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)
    matrix = vec.fit_transform(a_texts + b_texts).toarray()
    A, B = matrix[: len(shared)], matrix[len(shared) :]

    sim = cosine_similarity(A, B)
    same = float(np.mean(np.diag(sim)))                      # model1[theme_i] vs model2[theme_i]
    off = sim.copy()
    np.fill_diagonal(off, np.nan)
    different = float(np.nanmean(off))                       # model1[theme_i] vs model2[theme_j]

    # Does the higher-similarity match actually pick out the right theme? A stricter test than the
    # means: for each theme, is its own cross-model pair the closest of all candidates?
    top1 = int(sum(1 for i in range(len(shared)) if int(np.argmax(sim[i])) == i))

    return {
        "models_compared": names[:2],
        "themes_compared": len(shared),
        "method": "char_wb(3,5) TF-IDF cosine; lexical, so it understates paraphrased agreement",
        "mean_same_theme_similarity": round(same, 4),
        "mean_different_theme_similarity": round(different, 4),
        "lift_over_null": round(same - different, 4),
        "correct_theme_is_nearest": top1,
        "correct_theme_is_nearest_rate": round(top1 / len(shared), 4),
        # Without this the hit rate is uninterpretable: 5/25 sounds poor and is 5x chance.
        "chance_rate": round(1 / len(shared), 4),
        "lift_over_chance": round(top1 / len(shared) - 1 / len(shared), 4),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--specs", nargs="*", default=DEFAULT_SPECS,
                    help="provider:model entries to compare, e.g. gemini:gemini-flash-latest")
    ap.add_argument("--baseline", default=str(PROCESSED / "insights.json"),
                    help="existing single-model insights to include in the comparison")
    args = ap.parse_args()

    if not THEMES.exists():
        raise SystemExit(f"{THEMES} not found — run clustering first.")
    themes = json.loads(THEMES.read_text())["themes"]
    system = (PROMPTS / "synthesize.txt").read_text()

    runs: dict[str, dict[str, dict]] = {}
    failures: list[dict] = []

    baseline = Path(args.baseline)
    if baseline.exists():
        rows = json.loads(baseline.read_text()).get("insights", [])
        # Placeholders carry confidence 0.0 and no mechanism worth comparing.
        real = {r["theme_id"]: r for r in rows if r.get("confidence", 0) > 0}
        if real:
            runs["baseline(committed)"] = real
            log.info("baseline: %d synthesised insights from %s", len(real), baseline)

    for spec in args.specs:
        provider = spec.split(":")[0]
        if not os.getenv(f"{provider.upper()}_API_KEY"):
            log.warning("skipping %s — %s_API_KEY not set", spec, provider.upper())
            continue
        runs[spec] = _run_one(spec, themes, system, failures)
        (PROCESSED / f"insights.{provider}.json").write_text(
            json.dumps({"spec": spec, "insights": list(runs[spec].values())}, indent=2)
        )

    if len(runs) < 2:
        raise SystemExit(
            f"Only {len(runs)} model run(s) available — agreement needs at least 2.\n"
            f"Set GROQ_API_KEY (free: console.groq.com) or GEMINI_API_KEY and re-run."
        )

    names = sorted(runs)
    shared = sorted(set.intersection(*(set(r) for r in runs.values())))
    log.info("comparing %s over %d shared themes", names, len(shared))

    per_theme = []
    rq_scores, conf_gaps = [], []
    for theme_id in shared:
        a, b = runs[names[0]][theme_id], runs[names[1]][theme_id]
        rq = _jaccard(a.get("research_questions_answered"), b.get("research_questions_answered"))
        gap = abs(float(a.get("confidence", 0)) - float(b.get("confidence", 0)))
        rq_scores.append(rq)
        conf_gaps.append(gap)
        per_theme.append({
            "theme_id": theme_id,
            "rq_jaccard": round(rq, 3),
            "confidence_gap": round(gap, 3),
            f"{names[0]}_confidence": a.get("confidence"),
            f"{names[1]}_confidence": b.get("confidence"),
        })

    # What kind of comparison was this, really?
    #
    # The first run of this check compared the committed insights against a fresh Gemini run — and
    # the committed insights had themselves been produced by Gemini, because the Anthropic balance
    # was empty. It scored 0.75 RQ Jaccard and matched 20/25 mechanisms, which looks like strong
    # cross-model agreement and is nothing of the kind: it is one model agreeing with itself across
    # two sampling runs. That is worth knowing (the insights are not a fluke of one sample) but it
    # is a far weaker claim, and reporting it unlabelled would have been the most misleading number
    # in the project.
    families = {n.split(":")[0].replace("baseline(committed)", DEFAULT_BASELINE_FAMILY) for n in names}
    if len(families) > 1:
        kind, strength = "cross-family", (
            "Different model families, so agreement is evidence the insights are not one "
            "vendor's idiosyncrasy."
        )
    else:
        kind, strength = "same-family", (
            "Both runs come from the same model family, so this measures run-to-run "
            "REPRODUCIBILITY, not independent agreement. It shows the insights are stable across "
            "sampling, and says nothing about whether a different model would read the quotes the "
            "same way. Set GROQ_API_KEY (free, console.groq.com) for a genuine cross-family test."
        )

    payload = {
        "models": names,
        "comparison_type": kind,
        "what_this_measures": strength,
        "themes_total": len(themes),
        "themes_synthesised_by_all": len(shared),
        "research_question_agreement": {
            "mean_jaccard": round(sum(rq_scores) / len(rq_scores), 4) if rq_scores else None,
            "themes_in_full_agreement": sum(1 for s in rq_scores if s == 1.0),
            "themes_with_no_overlap": sum(1 for s in rq_scores if s == 0.0),
        },
        "confidence_agreement": {
            "mean_absolute_difference": round(sum(conf_gaps) / len(conf_gaps), 4) if conf_gaps else None,
            "themes_differing_by_over_0.3": sum(1 for g in conf_gaps if g > 0.3),
        },
        "mechanism_agreement": _mechanism_agreement(runs, shared),
        "per_theme": per_theme,
        # Committed rather than logged, so a partial run can be diagnosed from the repo.
        "batch_failures": failures,
        "batch_failure_count": len(failures),
        "caveat": (
            "Agreement is not correctness. Models trained on overlapping corpora are not "
            "independent coders, so high agreement bounds how much the single-model insights can "
            "be blamed on one model's idiosyncrasy — it says nothing about whether the mechanism "
            "is true of real users. Disagreement, by contrast, is decisive."
        ),
    }
    OUT.write_text(json.dumps(payload, indent=2))

    print("\n── Multi-model agreement ──\n")
    print(f"  models              {', '.join(names)}")
    print(f"  comparison          {payload['comparison_type'].upper()}")
    print(f"  themes compared     {len(shared)} of {len(themes)}")
    rqa = payload["research_question_agreement"]
    print(f"  RQ jaccard (mean)   {rqa['mean_jaccard']}   "
          f"(full agreement on {rqa['themes_in_full_agreement']}, no overlap on {rqa['themes_with_no_overlap']})")
    ca = payload["confidence_agreement"]
    print(f"  confidence |diff|   {ca['mean_absolute_difference']}   "
          f"({ca['themes_differing_by_over_0.3']} themes differ by >0.3)")
    ma = payload["mechanism_agreement"]
    if "mean_same_theme_similarity" in ma:
        print(f"  mechanism sim       {ma['mean_same_theme_similarity']} same-theme vs "
              f"{ma['mean_different_theme_similarity']} different-theme "
              f"(lift {ma['lift_over_null']})")
        print(f"  nearest-match       {ma['correct_theme_is_nearest']}/{ma['themes_compared']} "
              f"themes matched their own counterpart "
              f"({ma['correct_theme_is_nearest_rate']:.0%} vs {ma['chance_rate']:.0%} chance)")
    print(f"\n  {payload['what_this_measures']}")
    print(f"\n  -> {OUT}")


if __name__ == "__main__":
    main()
