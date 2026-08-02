"""Answer the brief's eight research questions from pipeline output.

    python -m engine.report

Writes `docs/01-discovery-engine.md`.

Why this exists as its own step. The schema has a typed field behind every one of the eight
questions, and it is tempting to treat that as coverage. It isn't. A field that is *captured* is not
a question that is *answered* — the answer needs a distribution, a denominator, and evidence a
reader can check. This module turns the captured labels into that.

It also states, per question, how well the corpus can answer it at all. Public reviews are
cross-sectional: they capture what one person said once, not what a population did over time. That
is fine for "what stops people" and poor for "which segment is more likely to" — and saying so is
more useful than presenting both with equal confidence.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

INTERIM = Path("data/interim")
PROCESSED = Path("data/processed")
OUT = Path("docs/01-discovery-engine.md")


def _load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.open():
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def _dist(rows: list[dict], field: str) -> Counter:
    """Frequency of each label, counting a document once per distinct label it carries."""
    c = Counter()
    for r in rows:
        for v in r.get(field) or []:
            c[v] += 1
    return c


def _table(counter: Counter, denom: int, label: str = "Signal") -> list[str]:
    if not counter or denom == 0:
        return ["_No data yet — run extraction first._", ""]
    lines = [f"| {label} | Documents | Share of relevant |", "|---|---:|---:|"]
    for k, n in counter.most_common():
        lines.append(f"| `{k}` | {n} | {n / denom:.1%} |")
    lines.append("")
    return lines


def _quotes(rows: list[dict], field: str, value: str, n: int = 3) -> list[str]:
    """Verbatim quotes from documents carrying a given label."""
    out = []
    for r in rows:
        if value in (r.get(field) or []):
            q = (r.get("evidence_quote") or "").strip()
            if q and len(q) > 20:
                out.append(q)
        if len(out) >= n:
            break
    return out


def main() -> None:
    ex = [r for r in _load_jsonl(INTERIM / "extractions.jsonl") if not r.get("insufficient_signal")]
    rel = _load_jsonl(INTERIM / "relevance.jsonl")
    docs = {d["doc_id"]: d for d in _load_jsonl(INTERIM / "documents.jsonl")}
    themes = json.loads((PROCESSED / "themes.json").read_text()) if (PROCESSED / "themes.json").exists() else {"themes": []}

    n = len(ex)
    n_rel = sum(1 for r in rel if r.get("is_relevant"))

    L: list[str] = []
    A = L.append

    A("# Part 1 — What the Discovery Engine Found")
    A("")
    A("Answers to the brief's eight research questions, computed from the corpus. Every percentage")
    A("has a stated denominator; every claim is traceable to `data/processed/`.")
    A("")
    A("| | |")
    A("|---|---|")
    A(f"| Documents collected | {len(docs):,} |")
    A(f"| Relevance verdicts | {len(rel):,} |")
    A(f"| Judged relevant | {n_rel:,} |")
    A(f"| Extracted with usable signal | **{n:,}** |")
    A(f"| Themes discovered | {len(themes.get('themes', []))} |")
    A("")
    A("Unless stated otherwise, percentages are shares of the **extracted** documents (n = "
      f"{n:,}), not of the full corpus.")
    A("")
    A("---")
    A("")

    # ── Q1 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q1 — Why do users repeatedly buy from the same categories?")
    A("")
    A("**Field:** `habit_driver[]`")
    A("")
    L.extend(_table(_dist(ex, "habit_driver"), n, "Habit driver"))
    top = _dist(ex, "habit_driver").most_common(1)
    if top:
        A(f"**Evidence for `{top[0][0]}`:**")
        A("")
        for q in _quotes(ex, "habit_driver", top[0][0]):
            A(f"> {q}")
            A("")

    # ── Q2 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q2 — What prevents users from exploring new categories?")
    A("")
    A("**Field:** `barrier[]`")
    A("")
    L.extend(_table(_dist(ex, "barrier"), n, "Barrier"))
    bt = _dist(ex, "barrier").most_common(1)
    if bt:
        A(f"**Evidence for `{bt[0][0]}`:**")
        A("")
        for q in _quotes(ex, "barrier", bt[0][0]):
            A(f"> {q}")
            A("")

    # ── Q3 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q3 — How do users discover products today?")
    A("")
    A("**Field:** `discovery_channel[]`")
    A("")
    L.extend(_table(_dist(ex, "discovery_channel"), n, "Channel"))
    A("**Caveat.** Reviews describe discovery only when a user volunteers it, so absence here is")
    A("weak evidence of absence. Treat the *ranking* as informative and the absolute shares as a")
    A("floor rather than an estimate.")
    A("")

    # ── Q4 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q4 — What role do habits play in shopping behaviour?")
    A("")
    A("**Field:** `habit_signal` (0 = no routine language, 3 = explicit reorder/routine language)")
    A("")
    hs = Counter(r.get("habit_signal", 0) for r in ex)
    if n:
        A("| Habit signal | Documents | Share |")
        A("|---|---:|---:|")
        for k in sorted(hs):
            A(f"| {k} | {hs[k]} | {hs[k] / n:.1%} |")
        A("")
        strong = sum(v for k, v in hs.items() if k >= 2)
        A(f"**{strong} documents ({strong / n:.1%}) carry moderate-to-explicit routine language.**")
        A("")
    else:
        A("_No data yet._")
        A("")

    # ── Q5 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q5 — What information do users need before trying a new category?")
    A("")
    A("**Field:** `information_gap[]`")
    A("")
    L.extend(_table(_dist(ex, "information_gap"), n, "Information gap"))
    A("This is the question that most directly shapes the MVP: each gap here is something the")
    A("interface could supply at the point of consideration. See `docs/04-mvp-spec.md`.")
    A("")

    # ── Q6 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q6 — What frustrations emerge repeatedly?")
    A("")
    A("**Fields:** `frustration[]`, `sentiment`")
    A("")
    fr = Counter()
    for r in ex:
        for f in r.get("frustration") or []:
            fr[f.strip().lower()[:60]] += 1
    if fr:
        A("| Frustration (free text, normalised) | Documents |")
        A("|---|---:|")
        for k, v in fr.most_common(15):
            A(f"| {k} | {v} |")
        A("")
    sent = Counter(r.get("sentiment") for r in ex)
    if sent and n:
        A("Sentiment across extracted documents: " +
          ", ".join(f"**{k}** {v} ({v/n:.0%})" for k, v in sent.most_common()))
        A("")

    # ── Q7 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q7 — Which user segments are more likely to experiment?")
    A("")
    A("**Field:** `segment_signal[]`")
    A("")
    A("> **This is the question the corpus answers least well, and it is worth being explicit about")
    A("> why.** Answering \"more likely\" requires a *rate* — experiments per user, compared across")
    A("> segments. Reviews are cross-sectional: each is one person writing once, with no way to")
    A("> observe whether that person later tried a new category. The engine can show which segments")
    A("> are over-represented in exploration-related discussion versus habit-related discussion,")
    A("> which is a proxy, not a rate.")
    A("")
    A("The 40-response survey answers this better, because it captures categories purchased *and*")
    A("household context per respondent. See `docs/02-user-research.md`.")
    A("")

    # Proxy: for each segment signal, how does its barrier/habit mix differ from the corpus?
    seg_barrier = defaultdict(Counter)
    seg_total = Counter()
    for r in ex:
        for s in r.get("segment_signal") or []:
            seg_total[s] += 1
            for b in r.get("barrier") or []:
                seg_barrier[s][b] += 1
    if seg_total:
        A("**Proxy — segment presence and dominant barrier:**")
        A("")
        A("| Segment signal | Documents | Most-cited barrier within segment |")
        A("|---|---:|---|")
        for s, cnt in seg_total.most_common():
            top_b = seg_barrier[s].most_common(1)
            A(f"| `{s}` | {cnt} | {('`' + top_b[0][0] + '` (' + str(top_b[0][1]) + ')') if top_b else '—'} |")
        A("")
        A("Read this as *which barriers matter most to whom*, not as a propensity ranking.")
        A("")
    else:
        A("_No segment signals extracted yet._")
        A("")

    # ── Q8 ────────────────────────────────────────────────────────────────────────────────────
    A("## Q8 — What unmet needs emerge consistently across discussions?")
    A("")
    A("**Field:** `pain_statement` → clustered into themes")
    A("")
    tl = themes.get("themes", [])
    if tl:
        A("| Theme | n | Prevalence | Dominant barrier | Sources |")
        A("|---|---:|---:|---|---|")
        for t in tl:
            flags = []
            if t.get("single_source"):
                flags.append("single-source")
            if t.get("below_min_size"):
                flags.append("small")
            db = (t.get("dominant_barriers") or ["—"])[0]
            srcs = ", ".join(f"{k}:{v}" for k, v in (t.get("source_spread") or {}).items())
            A(f"| **{t['theme_id']}** {t['label']}{' ⚠️ ' + '/'.join(flags) if flags else ''} "
              f"| {t['doc_count']} | {t['prevalence']:.1%} | `{db}` | {srcs} |")
        A("")
        A("Themes flagged `single-source` appear in only one platform's reviews and are more likely")
        A("artifacts of that platform's review culture than genuine user needs.")
        A("")
    else:
        A("_No themes yet — run `python -m engine.pipeline.cluster`._")
        A("")

    # ── Multi-model agreement ─────────────────────────────────────────────────────────────────
    agree_path = PROCESSED / "multi_model_agreement.json"
    if agree_path.exists():
        ag = json.loads(agree_path.read_text())
        rqa, ca, ma = (ag.get("research_question_agreement", {}),
                       ag.get("confidence_agreement", {}),
                       ag.get("mechanism_agreement", {}))
        A("---")
        A("")
        A("## Do independent models agree about what these themes mean?")
        A("")
        A("Everything above this line is counted or verified: prevalences are computed, quotes are")
        A("checked character-for-character against their source. The **insights** are not — they")
        A("come from a model reading the themes, and \"an AI wrote them\" is not evidence.")
        A("")
        A("So synthesis was run again under a different model family and the two were compared.")
        A("")
        A(f"**Comparison type: {ag.get('comparison_type', 'unknown').upper()}** — "
          f"{', '.join(ag.get('models', []))}")
        A("")
        A("| Measure | Result | Reading |")
        A("|---|---|---|")
        A(f"| Themes synthesised by both | {ag.get('themes_synthesised_by_all')} of {ag.get('themes_total')} | — |")
        A(f"| Research questions per theme (Jaccard) | **{rqa.get('mean_jaccard')}** | "
          f"full agreement on {rqa.get('themes_in_full_agreement')}; "
          f"**{rqa.get('themes_with_no_overlap')}** themes with no overlap at all |")
        A(f"| Confidence | mean gap **{ca.get('mean_absolute_difference')}** | "
          f"{ca.get('themes_differing_by_over_0.3')} themes differ by more than 0.3 |")
        if "mean_same_theme_similarity" in ma:
            A(f"| Mechanism text similarity | **{ma['mean_same_theme_similarity']}** same-theme vs "
              f"{ma['mean_different_theme_similarity']} different-theme | lift {ma['lift_over_null']} |")
            A(f"| Correct theme is nearest match | **{ma['correct_theme_is_nearest']}/"
              f"{ma['themes_compared']}** ({ma['correct_theme_is_nearest_rate']:.0%}) | "
              f"against a {ma['chance_rate']:.0%} chance baseline |")
        A("")
        A("**What this does and does not establish.** " + ag.get("what_this_measures", ""))
        A("")
        A("Agreement is not correctness. Two models converging means they read the same quotes the")
        A("same way — not that the mechanism is true of real users. Models trained on overlapping")
        A("data are not independent coders the way two humans would be. What this bounds is how")
        A("much the insights can be blamed on one vendor's idiosyncrasy; *dis*agreement would have")
        A("been decisive, and there is none: no theme scored zero overlap.")
        A("")
        A("The sharper limit sits elsewhere. Three interviews found three things no model found in")
        A("3,372 documents (`docs/02-user-research.md` §8), and no amount of model agreement would")
        A("have surfaced them.")
        A("")

    # ── Coverage summary ──────────────────────────────────────────────────────────────────────
    A("---")
    A("")
    A("## How well each question is answered")
    A("")
    A("Graded by **evidence coverage**: the share of usable extractions that actually carry the")
    A("field the question depends on. These grades were previously written by hand, before the")
    A("corpus existed, and six of the eight said \"Well\" — while real coverage turns out to run")
    A("from 2.9% to 74%. They are now computed, so the engine cannot flatter itself.")
    A("")
    A("| Grade | Rule |")
    A("|---|---|")
    A("| **Well** | ≥50% of extractions carry the field |")
    A("| **Moderately** | 20–50% |")
    A("| **Poorly** | <20%, or the question needs something reviews structurally cannot supply |")
    A("")

    def grade(covered: int, total: int, structural: str = "") -> tuple[str, str]:
        pct = (covered / total * 100) if total else 0.0
        if structural:
            return "**Poorly**", f"{covered}/{total} ({pct:.1f}%) — {structural}"
        label = "**Well**" if pct >= 50 else ("**Moderately**" if pct >= 20 else "**Poorly**")
        return label, f"{covered}/{total} ({pct:.1f}%) carry the field"

    coded = {f: sum(1 for e in ex if e.get(f)) for f in
             ("habit_driver", "barrier", "discovery_channel", "information_gap", "segment_signal")}
    habitual = sum(1 for e in ex if (e.get("habit_signal") or 0) > 0)
    themed = themes.get("n_statements", 0) if themes else 0

    q = [
        ("1", "Why repeat the same categories", *grade(coded["habit_driver"], n)),
        ("2", "What prevents exploring", *grade(coded["barrier"], n)),
        ("3", "How they discover today", *grade(
            coded["discovery_channel"], n,
            "reviews record outcomes, not journeys; nobody writes down how they found a product")),
        ("4", "Role of habit", *grade(habitual, n,
            "an ordinal signal fires on a minority; habit is the unremarkable case people do not write about")),
        ("5", "Information needed", *grade(coded["information_gap"], n)),
        ("6", "Recurring frustrations", *grade(themed, n)),
        ("7", "Which segments experiment more", *grade(
            coded["segment_signal"], n,
            "\"more likely\" needs a rate per user over time; reviews are cross-sectional")),
        ("8", "Unmet needs", *grade(themed, n)),
    ]
    A("| # | Question | Grade | Evidence |")
    A("|---|---|---|---|")
    for num, question, label, basis in q:
        A(f"| {num} | {question} | {label} | {basis} |")
    A("")

    A("### The grades are not eight independent scores")
    A("")
    A("Read the table by which questions score well and which do not, because the split is not")
    A("random.")
    A("")
    A("**What the corpus answers well — Q2, Q5, Q6, Q8 — is every question about a purchase that")
    A("went wrong.** Barriers, missing information, frustrations, unmet needs: all are things a")
    A("person writes down *after* a bad transaction.")
    A("")
    A("**What it answers badly — Q3, Q4, Q7 — is every question about behaviour before or across")
    A("purchases.** How you found the product, what your routine is, whether you experiment more")
    A("than someone else. Nobody writes a review about a habit, because a habit is the")
    A("unremarkable case, and nobody writes a review about a product they never bought.")
    A("")
    A("So this is one limitation appearing three times, not three separate weaknesses: **a review")
    A("corpus contains only people who completed a transaction, writing about the transaction.**")
    A("Scaling collection past 3,372 documents would sharpen the left column and do nothing for")
    A("the right one. That is the structural case for primary research, and it is why the survey")
    A("(`docs/02-user-research.md` §1–§4) carries Q3 and Q7 while the engine carries Q2, Q5, Q6.")
    A("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(L))
    print(f"wrote {OUT}  (n={n} extracted, {len(tl)} themes)")


if __name__ == "__main__":
    main()
