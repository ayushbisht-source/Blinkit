# Part 1 — What the Discovery Engine Found

Answers to the brief's eight research questions, computed from the corpus. Every percentage
has a stated denominator; every claim is traceable to `data/processed/`.

| | |
|---|---|
| Documents collected | 3,372 |
| Relevance verdicts | 3,373 |
| Judged relevant | 971 |
| Extracted with usable signal | **719** |
| Themes discovered | 24 |

Unless stated otherwise, percentages are shares of the **extracted** documents (n = 719), not of the full corpus.

---

## Q1 — Why do users repeatedly buy from the same categories?

**Field:** `habit_driver[]`

| Habit driver | Documents | Share of relevant |
|---|---:|---:|
| `price_certainty` | 132 | 18.4% |
| `trust` | 84 | 11.7% |
| `time_pressure` | 59 | 8.2% |
| `household_routine` | 27 | 3.8% |
| `satisficing` | 12 | 1.7% |
| `list_reuse` | 6 | 0.8% |

**Evidence for `price_certainty`:**

> best experience low price in very nice product I buy guitar from blinkit

> ULTIMATE PRODUCT & ULTIMATE DISCOUNT PRICE

> కొంచెం మంచి కూరగాయలు పంపించండి ఫ్రూట్స్ గాని ఇలా కూరగాయలు గాని కొంచెం క్వాలిటీ ఉండట్లేదు నెక్స్ట్ వచ్చేసి ఒకదాంట్లో రేటు పెంచుతున్నారు తగ్గిస్తున్నారు

## Q2 — What prevents users from exploring new categories?

**Field:** `barrier[]`

| Barrier | Documents | Share of relevant |
|---|---:|---:|
| `trust_quality` | 326 | 45.3% |
| `price_risk` | 151 | 21.0% |
| `return_anxiety` | 133 | 18.5% |
| `awareness` | 39 | 5.4% |
| `size_uncertainty` | 25 | 3.5% |
| `channel_loyalty` | 17 | 2.4% |
| `choice_overload` | 12 | 1.7% |
| `no_trigger` | 8 | 1.1% |

**Evidence for `trust_quality`:**

> MULTIGRAIN BREAD is packed dated 23.07.2026 , not satisfied, I will avoid blinkit

> I ordered Fortune Rozana Gold Basmati Rice expecting good-quality, full-length grains, but I received rice with a large number of broken grains.

> This platform always provides lesser quantity than stated in its app.

## Q3 — How do users discover products today?

**Field:** `discovery_channel[]`

| Channel | Documents | Share of relevant |
|---|---:|---:|
| `word_of_mouth` | 5 | 0.7% |
| `search` | 5 | 0.7% |
| `accidental` | 3 | 0.4% |
| `homepage_banner` | 3 | 0.4% |
| `festive_push` | 2 | 0.3% |
| `social` | 1 | 0.1% |

**Caveat.** Reviews describe discovery only when a user volunteers it, so absence here is
weak evidence of absence. Treat the *ranking* as informative and the absolute shares as a
floor rather than an estimate.

## Q4 — What role do habits play in shopping behaviour?

**Field:** `habit_signal` (0 = no routine language, 3 = explicit reorder/routine language)

| Habit signal | Documents | Share |
|---|---:|---:|
| 0 | 614 | 85.4% |
| 1 | 74 | 10.3% |
| 2 | 30 | 4.2% |
| 3 | 1 | 0.1% |

**31 documents (4.3%) carry moderate-to-explicit routine language.**

## Q5 — What information do users need before trying a new category?

**Field:** `information_gap[]`

| Information gap | Documents | Share of relevant |
|---|---:|---:|
| `freshness_expiry` | 178 | 24.8% |
| `returnability` | 141 | 19.6% |
| `price_benchmark` | 137 | 19.1% |
| `size_guidance` | 25 | 3.5% |
| `reviews` | 19 | 2.6% |
| `brand_familiarity` | 13 | 1.8% |
| `usage_guidance` | 1 | 0.1% |

This is the question that most directly shapes the MVP: each gap here is something the
interface could supply at the point of consideration. See `docs/04-mvp-spec.md`.

## Q6 — What frustrations emerge repeatedly?

**Fields:** `frustration[]`, `sentiment`

| Frustration (free text, normalised) | Documents |
|---|---:|
| poor product quality | 7 |
| no refund | 7 |
| expired products | 6 |
| unresponsive support | 6 |
| poor quality product | 4 |
| melted ice cream | 4 |
| no return policy | 4 |
| high prices | 3 |
| poor customer support | 3 |
| no refund given | 3 |
| return refused | 3 |
| no response from support | 3 |
| prices too high | 3 |
| curdled milk | 3 |
| less quantity | 3 |

Sentiment across extracted documents: **negative** 451 (63%), **positive** 183 (25%), **mixed** 77 (11%), **neutral** 8 (1%)

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

**Proxy — segment presence and dominant barrier:**

| Segment signal | Documents | Most-cited barrier within segment |
|---|---:|---|
| `cooks_daily` | 16 | `trust_quality` (10) |
| `working_professional` | 10 | `price_risk` (2) |
| `tier2_plus` | 10 | `trust_quality` (3) |
| `tier1_metro` | 7 | `trust_quality` (2) |
| `parent_young_child` | 4 | `trust_quality` (3) |
| `pet_owner` | 4 | `trust_quality` (3) |
| `lives_alone` | 4 | `trust_quality` (1) |
| `student` | 3 | — |

Read this as *which barriers matter most to whom*, not as a propensity ranking.

## Q8 — What unmet needs emerge consistently across discussions?

**Field:** `pain_statement` → clustered into themes

| Theme | n | Prevalence | Dominant barrier | Sources |
|---|---:|---:|---|---|
| **THM-01** support / receives / return / refund | 122 | 22.7% | `trust_quality` | play_store:119, app_store:3 |
| **THM-02** food / expiry / freshness / trust ⚠️ single-source | 43 | 8.0% | `trust_quality` | play_store:43 |
| **THM-03** free / making / charges / feel | 41 | 7.6% | `price_risk` | play_store:40, app_store:1 |
| **THM-04** fresh / trust / arrive / vegetables | 40 | 7.4% | `trust_quality` | play_store:39, app_store:1 |
| **THM-05** prices / fair / high / unsure | 38 | 7.1% | `price_risk` | play_store:37, app_store:1 |
| **THM-06** available / actually / limiting / range ⚠️ single-source | 32 | 6.0% | `awareness` | play_store:32 |
| **THM-07** cancelled / payment / store / time | 28 | 5.2% | `trust_quality` | play_store:27, app_store:1 |
| **THM-08** routine / unavailable / grocery / milk ⚠️ single-source | 22 | 4.1% | `awareness` | play_store:22 |
| **THM-09** charge / feels / extra / 30 ⚠️ single-source | 18 | 3.4% | `price_risk` | play_store:18 |
| **THM-10** expired / eroding / received expired / eroding trust | 17 | 3.2% | `trust_quality` | play_store:16, app_store:1 |
| **THM-11** quantity / expected / matches / weight ⚠️ single-source | 17 | 3.2% | `trust_quality` | play_store:17 |
| **THM-12** price / leading / distrust / confidence | 15 | 2.8% | `trust_quality` | play_store:13, app_store:2 |
| **THM-13** low / low quality / quality / making hard | 13 | 2.4% | `trust_quality` | play_store:12, app_store:1 |
| **THM-14** ice cream / ice / cream / melted ⚠️ single-source | 12 | 2.2% | `trust_quality` | play_store:12 |
| **THM-15** brand / specific / substituted / trust exact ⚠️ single-source | 12 | 2.2% | `trust_quality` | play_store:12 |
| **THM-16** switching / competitor / switch / pushing switch ⚠️ single-source | 10 | 1.9% | `trust_quality` | play_store:10 |
| **THM-17** non / slow / non returnable / returnable ⚠️ single-source | 10 | 1.9% | `choice_overload` | play_store:10 |
| **THM-18** missing / arrive missing / cheaper / refunded ⚠️ single-source | 8 | 1.5% | `trust_quality` | play_store:8 |
| **THM-19** offers / cashback / justify / promotional ⚠️ single-source | 8 | 1.5% | `price_risk` | play_store:8 |
| **THM-20** proof / processed / refunds / photo ⚠️ single-source | 7 | 1.3% | `trust_quality` | play_store:7 |
| **THM-21** serve / 10 / minute / 10 minute ⚠️ single-source | 7 | 1.3% | `trust_quality` | play_store:7 |
| **THM-22** use / daily / repeat use / habit ⚠️ single-source | 7 | 1.3% | `price_risk` | play_store:7 |
| **THM-23** genuine / duplicate / counterfeit / goods ⚠️ single-source | 6 | 1.1% | `trust_quality` | play_store:6 |
| **THM-24** coupons / shops / coupons removed / removed ⚠️ single-source | 4 | 0.7% | `price_risk` | play_store:4 |

Themes flagged `single-source` appear in only one platform's reviews and are more likely
artifacts of that platform's review culture than genuine user needs.

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
