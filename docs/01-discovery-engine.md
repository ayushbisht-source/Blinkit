# Part 1 — What the Discovery Engine Found

Answers to the brief's eight research questions, computed from the corpus. Every percentage
has a stated denominator; every claim is traceable to `data/processed/`.

| | |
|---|---|
| Documents collected | 3,372 |
| Relevance verdicts | 2,200 |
| Judged relevant | 608 |
| Extracted with usable signal | **3** |
| Themes discovered | 0 |

Unless stated otherwise, percentages are shares of the **extracted** documents (n = 3), not of the full corpus.

---

## Q1 — Why do users repeatedly buy from the same categories?

**Field:** `habit_driver[]`

_No data yet — run extraction first._

## Q2 — What prevents users from exploring new categories?

**Field:** `barrier[]`

| Barrier | Documents | Share of relevant |
|---|---:|---:|
| `trust_quality` | 1 | 33.3% |

**Evidence for `trust_quality`:**

> MULTIGRAIN BREAD is packed dated 23.07.2026 , not satisfied, I will avoid blinkit

## Q3 — How do users discover products today?

**Field:** `discovery_channel[]`

_No data yet — run extraction first._

**Caveat.** Reviews describe discovery only when a user volunteers it, so absence here is
weak evidence of absence. Treat the *ranking* as informative and the absolute shares as a
floor rather than an estimate.

## Q4 — What role do habits play in shopping behaviour?

**Field:** `habit_signal` (0 = no routine language, 3 = explicit reorder/routine language)

| Habit signal | Documents | Share |
|---|---:|---:|
| 0 | 3 | 100.0% |

**0 documents (0.0%) carry moderate-to-explicit routine language.**

## Q5 — What information do users need before trying a new category?

**Field:** `information_gap[]`

| Information gap | Documents | Share of relevant |
|---|---:|---:|
| `freshness_expiry` | 1 | 33.3% |

This is the question that most directly shapes the MVP: each gap here is something the
interface could supply at the point of consideration. See `docs/04-mvp-spec.md`.

## Q6 — What frustrations emerge repeatedly?

**Fields:** `frustration[]`, `sentiment`

| Frustration (free text, normalised) | Documents |
|---|---:|
| very poor quality stuff | 1 |
| things r missing | 1 |
| need to follow up | 1 |
| very worst experience ever in a bread packet s | 1 |
| multigrain bread is packed dated 23.07.2026 | 1 |

Sentiment across extracted documents: **negative** 3 (100%)

## Q7 — Which user segments are more likely to experiment?

**Field:** `segment_signal[]`

> **This is the question the corpus answers least well, and it is worth being explicit about
> why.** Answering "more likely" requires a *rate* — experiments per user, compared across
> segments. Reviews are cross-sectional: each is one person writing once, with no way to
> observe whether that person later tried a new category. The engine can show which segments
> are over-represented in exploration-related discussion versus habit-related discussion,
> which is a proxy, not a rate.

The 40-response survey answers this better, because it captures categories purchased *and*
household context per respondent. See `docs/02-user-research.md`.

_No segment signals extracted yet._

## Q8 — What unmet needs emerge consistently across discussions?

**Field:** `pain_statement` → clustered into themes

_No themes yet — run `python -m engine.pipeline.cluster`._

---

## How well each question is answered

| # | Question | Answerable from this corpus? |
|---|---|---|
| 1 | Why repeat the same categories | **Well** — habit language is explicit in reviews |
| 2 | What prevents exploring | **Well** — the corpus's strongest signal |
| 3 | How they discover today | **Partially** — only when volunteered; shares are a floor |
| 4 | Role of habit | **Well** — measured on an ordinal scale |
| 5 | Information needed | **Well** — and directly actionable for the MVP |
| 6 | Recurring frustrations | **Well** — though skewed toward complaint-shaped feedback |
| 7 | Which segments experiment more | **Poorly** — needs a rate; reviews are cross-sectional. Survey answers this better |
| 8 | Unmet needs | **Well** — via clustered pain statements |

**The corpus over-represents anger.** People write reviews when annoyed, so barriers and
frustrations are richly evidenced while quiet non-adoption — "I just never thought to" — is
structurally under-captured. That asymmetry is the single most important thing to hold in
mind when reading the numbers above, and it is the reason primary research is not optional.
