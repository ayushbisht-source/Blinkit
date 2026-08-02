# Part 1 — What the Discovery Engine Found

Answers to the brief's eight research questions, computed from the corpus. Every percentage
has a stated denominator; every claim is traceable to `data/processed/`.

| | |
|---|---|
| Documents collected | 3,372 |
| Relevance verdicts | 3,373 |
| Judged relevant | 971 |
| Extracted with usable signal | **832** |
| Themes discovered | 25 |

Unless stated otherwise, percentages are shares of the **extracted** documents (n = 832), not of the full corpus.

---

## Q1 — Why do users repeatedly buy from the same categories?

**Field:** `habit_driver[]`

| Habit driver | Documents | Share of relevant |
|---|---:|---:|
| `price_certainty` | 148 | 17.8% |
| `trust` | 96 | 11.5% |
| `time_pressure` | 66 | 7.9% |
| `household_routine` | 29 | 3.5% |
| `satisficing` | 12 | 1.4% |
| `list_reuse` | 8 | 1.0% |

**Evidence for `price_certainty`:**

> best experience low price in very nice product I buy guitar from blinkit

> ULTIMATE PRODUCT & ULTIMATE DISCOUNT PRICE

> కొంచెం మంచి కూరగాయలు పంపించండి ఫ్రూట్స్ గాని ఇలా కూరగాయలు గాని కొంచెం క్వాలిటీ ఉండట్లేదు నెక్స్ట్ వచ్చేసి ఒకదాంట్లో రేటు పెంచుతున్నారు తగ్గిస్తున్నారు

## Q2 — What prevents users from exploring new categories?

**Field:** `barrier[]`

| Barrier | Documents | Share of relevant |
|---|---:|---:|
| `trust_quality` | 381 | 45.8% |
| `price_risk` | 191 | 23.0% |
| `return_anxiety` | 155 | 18.6% |
| `awareness` | 40 | 4.8% |
| `size_uncertainty` | 30 | 3.6% |
| `channel_loyalty` | 22 | 2.6% |
| `choice_overload` | 13 | 1.6% |
| `no_trigger` | 9 | 1.1% |

**Evidence for `trust_quality`:**

> MULTIGRAIN BREAD is packed dated 23.07.2026 , not satisfied, I will avoid blinkit

> I ordered Fortune Rozana Gold Basmati Rice expecting good-quality, full-length grains, but I received rice with a large number of broken grains.

> This platform always provides lesser quantity than stated in its app.

## Q3 — How do users discover products today?

**Field:** `discovery_channel[]`

| Channel | Documents | Share of relevant |
|---|---:|---:|
| `search` | 6 | 0.7% |
| `word_of_mouth` | 5 | 0.6% |
| `homepage_banner` | 4 | 0.5% |
| `accidental` | 3 | 0.4% |
| `festive_push` | 2 | 0.2% |
| `offline_store` | 2 | 0.2% |
| `social` | 1 | 0.1% |
| `recommendation_rail` | 1 | 0.1% |

**Caveat.** Reviews describe discovery only when a user volunteers it, so absence here is
weak evidence of absence. Treat the *ranking* as informative and the absolute shares as a
floor rather than an estimate.

## Q4 — What role do habits play in shopping behaviour?

**Field:** `habit_signal` (0 = no routine language, 3 = explicit reorder/routine language)

| Habit signal | Documents | Share |
|---|---:|---:|
| 0 | 709 | 85.2% |
| 1 | 87 | 10.5% |
| 2 | 33 | 4.0% |
| 3 | 3 | 0.4% |

**36 documents (4.3%) carry moderate-to-explicit routine language.**

## Q5 — What information do users need before trying a new category?

**Field:** `information_gap[]`

| Information gap | Documents | Share of relevant |
|---|---:|---:|
| `freshness_expiry` | 198 | 23.8% |
| `returnability` | 164 | 19.7% |
| `price_benchmark` | 161 | 19.4% |
| `size_guidance` | 31 | 3.7% |
| `reviews` | 21 | 2.5% |
| `brand_familiarity` | 14 | 1.7% |
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
| no refund given | 4 |
| poor quality product | 4 |
| melted ice cream | 4 |
| poor customer service | 4 |
| late delivery | 4 |
| no return policy | 4 |
| high prices | 3 |
| poor customer support | 3 |
| return refused | 3 |
| unhelpful support | 3 |
| price too high | 3 |

Sentiment across extracted documents: **negative** 540 (65%), **positive** 197 (24%), **mixed** 87 (10%), **neutral** 8 (1%)

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
| `cooks_daily` | 17 | `trust_quality` (10) |
| `working_professional` | 12 | `price_risk` (3) |
| `tier2_plus` | 12 | `trust_quality` (3) |
| `tier1_metro` | 8 | `price_risk` (3) |
| `parent_young_child` | 4 | `trust_quality` (3) |
| `pet_owner` | 4 | `trust_quality` (3) |
| `lives_alone` | 4 | `trust_quality` (1) |
| `student` | 3 | — |

Read this as *which barriers matter most to whom*, not as a propensity ranking.

## Q8 — What unmet needs emerge consistently across discussions?

**Field:** `pain_statement` → clustered into themes

| Theme | n | Prevalence | Dominant barrier | Sources |
|---|---:|---:|---|---|
| **THM-01** receives / expiry / spoiled / milk ⚠️ single-source | 72 | 11.4% | `trust_quality` | play_store:72 |
| **THM-02** quality / poor / poor quality / return | 51 | 8.1% | `trust_quality` | play_store:49, app_store:2 |
| **THM-03** food / trust / undermining / undermining trust | 50 | 7.9% | `trust_quality` | play_store:43, app_store:7 |
| **THM-04** prices / fair / unsure / price | 42 | 6.7% | `price_risk` | play_store:41, app_store:1 |
| **THM-05** free / minimum / threshold / value ⚠️ single-source | 34 | 5.4% | `price_risk` | play_store:34 |
| **THM-06** making / feel / charges / cost | 33 | 5.2% | `price_risk` | play_store:29, app_store:4 |
| **THM-07** available / stock / actually / range ⚠️ single-source | 31 | 4.9% | `awareness` | play_store:31 |
| **THM-08** replacement / wrong / refund / offered | 30 | 4.8% | `trust_quality` | play_store:27, app_store:3 |
| **THM-09** fresh / trust / arrive / trust vegetables | 26 | 4.1% | `trust_quality` | play_store:25, app_store:1 |
| **THM-10** unavailable / routine / daily / disrupting ⚠️ single-source | 26 | 4.1% | `awareness` | play_store:26 |
| **THM-11** quantity / matches / expected / freshness ⚠️ single-source | 25 | 4.0% | `trust_quality` | play_store:25 |
| **THM-12** instead / pushing / resolving / competitor | 22 | 3.5% | `trust_quality` | play_store:18, app_store:4 |
| **THM-13** offers / advertised / discount / checkout | 21 | 3.3% | `price_risk` | play_store:20, app_store:1 |
| **THM-14** charge / feels / 30 / unfair ⚠️ single-source | 20 | 3.2% | `price_risk` | play_store:20 |
| **THM-15** leaving / recourse / exchange / electronics ⚠️ single-source | 19 | 3.0% | `trust_quality` | play_store:19 |
| **THM-16** cancelled / time / wasting / breaking trust ⚠️ single-source | 16 | 2.5% | `trust_quality` | play_store:16 |
| **THM-17** specific / brand / substituted / quality | 16 | 2.5% | `trust_quality` | play_store:15, app_store:1 |
| **THM-18** cream / ice cream / ice / melted | 15 | 2.4% | `trust_quality` | play_store:14, app_store:1 |
| **THM-19** genuine / payment / store / duplicate ⚠️ single-source | 14 | 2.2% | `trust_quality` | play_store:14 |
| **THM-20** missing / leading / leading distrust / loss | 14 | 2.2% | `trust_quality` | play_store:13, app_store:1 |
| **THM-21** promised / extra / minute / 10 | 14 | 2.2% | `price_risk` | play_store:12, app_store:2 |
| **THM-22** eroding trust / eroding / trust / claims | 12 | 1.9% | `trust_quality` | play_store:11, app_store:1 |
| **THM-23** packaging / refuses / competitors / bad ⚠️ single-source | 10 | 1.6% | `trust_quality` | play_store:10 |
| **THM-24** limiting / available limiting / available / late night ⚠️ single-source | 9 | 1.4% | `awareness` | play_store:9 |
| **THM-25** non / grocery / non returnable / returnable | 9 | 1.4% | `return_anxiety` | play_store:7, app_store:2 |

Themes flagged `single-source` appear in only one platform's reviews and are more likely
artifacts of that platform's review culture than genuine user needs.

---

## How well each question is answered

Graded by **evidence coverage**: the share of usable extractions that actually carry the
field the question depends on. These grades were previously written by hand, before the
corpus existed, and six of the eight said "Well" — while real coverage turns out to run
from 2.9% to 74%. They are now computed, so the engine cannot flatter itself.

| Grade | Rule |
|---|---|
| **Well** | ≥50% of extractions carry the field |
| **Moderately** | 20–50% |
| **Poorly** | <20%, or the question needs something reviews structurally cannot supply |

| # | Question | Grade | Evidence |
|---|---|---|---|
| 1 | Why repeat the same categories | **Moderately** | 298/832 (35.8%) carry the field |
| 2 | What prevents exploring | **Well** | 616/832 (74.0%) carry the field |
| 3 | How they discover today | **Poorly** | 24/832 (2.9%) — reviews record outcomes, not journeys; nobody writes down how they found a product |
| 4 | Role of habit | **Poorly** | 123/832 (14.8%) — an ordinal signal fires on a minority; habit is the unremarkable case people do not write about |
| 5 | Information needed | **Well** | 477/832 (57.3%) carry the field |
| 6 | Recurring frustrations | **Well** | 631/832 (75.8%) carry the field |
| 7 | Which segments experiment more | **Poorly** | 62/832 (7.5%) — "more likely" needs a rate per user over time; reviews are cross-sectional |
| 8 | Unmet needs | **Well** | 631/832 (75.8%) carry the field |

### The grades are not eight independent scores

Read the table by which questions score well and which do not, because the split is not
random.

**What the corpus answers well — Q2, Q5, Q6, Q8 — is every question about a purchase that
went wrong.** Barriers, missing information, frustrations, unmet needs: all are things a
person writes down *after* a bad transaction.

**What it answers badly — Q3, Q4, Q7 — is every question about behaviour before or across
purchases.** How you found the product, what your routine is, whether you experiment more
than someone else. Nobody writes a review about a habit, because a habit is the
unremarkable case, and nobody writes a review about a product they never bought.

So this is one limitation appearing three times, not three separate weaknesses: **a review
corpus contains only people who completed a transaction, writing about the transaction.**
Scaling collection past 3,372 documents would sharpen the left column and do nothing for
the right one. That is the structural case for primary research, and it is why the survey
(`docs/02-user-research.md` §1–§4) carries Q3 and Q7 while the engine carries Q2, Q5, Q6.
