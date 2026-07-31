# Part 5 — Measurement Plan

How you would know whether One Thing worked, decided **before** seeing any results.

---

## 1. Primary metric

**CER — Category Expansion Rate**, per `docs/00-foundation.md`:

```
CER(month M) = distinct users who purchased from category C in M,
               where C ∉ any category that user purchased in M-1 … M-6
               ──────────────────────────────────────────────────────
                        distinct users with ≥1 order in M
```

The 6-month lookback is load-bearing. Without it, a user rebuying mosquito repellent each summer
registers as "exploring" and the metric flatters itself. Quote the lookback every time the number is
quoted.

---

## 2. Secondary metrics

| Metric | Why it's here |
|---|---|
| New-category **trial** rate | Mode A's direct output. Expected to move first. |
| **30-day repeat rate within a newly-tried category** | The one that actually matters. Trial without repeat is a discount, not exploration — and CER counts recurrence. |
| Distinct categories per user per month | Slower-moving proxy for the strategic goal (breadth as a retention moat). |
| Card → add-to-cart conversion | Whether the *card* works, separable from whether the *idea* works. |

The second row is the honest success criterion. If trial rises and repeat doesn't, the feature
manufactured one-off purchases and the underlying problem — crossover being event-triggered rather
than habit-forming — is untouched.

---

## 3. Guardrails, with kill thresholds

Pre-registered so they can't be renegotiated after seeing the result.

| Guardrail | Kill threshold | Rationale |
|---|---|---|
| AOV | any sustained decline | Trial packs are cheap by design; if they *replace* rather than *add*, the feature is cannibalising |
| Core-category order frequency | **>3% drop** | Attention spent exploring is attention not spent restocking. This is the expensive failure mode |
| Refund / return rate | any material rise | Users buying unfamiliar things return more; a spike means we pushed poor fits |
| **Card dismissal rate** | **>60%** | The fastest signal that the feature reads as noise. 38/40 surveyed arrive knowing what they want — they will not tolerate friction |
| Session length at cart review | any material rise | The card must not re-introduce the comparison cost it exists to remove |

**If any threshold trips, the feature is removed regardless of CER movement.** Stating this in
advance is the point: a metric that only ever justifies shipping is not a measurement plan.

---

## 4. Experiment design

| | |
|---|---|
| Design | 90/10 holdout, randomised at user level |
| Unit | User (not session — CER is a per-user monthly measure) |
| Duration | **Minimum 4 weeks.** CER is a monthly metric; nothing shorter can measure it |
| Segment | Habitual Narrow Repeaters (per `docs/00-foundation.md`) |
| Primary comparison | CER, treatment vs holdout |

**Why user-level and not session-level:** the metric asks whether a *person* bought a new category
this month. Session randomisation would let the same user see the card sometimes and not others,
contaminating both arms.

**Why 4 weeks minimum:** Mode B fires 14–45 days after a first crossover. A two-week test would
measure Mode A only and miss the mechanism the feature is actually built around.

---

## 5. Event schema

```
nudge_shown            { user_id, mode: A|B, category, product_id, anchor_favourable, ts }
nudge_dismissed        { user_id, mode, category, ts }
nudge_add_to_cart      { user_id, mode, category, product_id, ts }
new_category_purchased { user_id, category, order_id, first_ever_in_category: bool, ts }
category_repeat        { user_id, category, days_since_first, ts }
nudge_suppressed       { user_id, reason, ts }     # why NO card was shown
```

`nudge_suppressed` matters more than it looks. The agent declines to show a card whenever it can't
substantiate a reason. Logging the reason tells you whether suppression is working as designed or
silently swallowing most of the audience — a feature that never fires can't fail, and can't succeed
either.

`anchor_favourable` is logged because the price anchor is the feature's central claim. If cards
convert only when the anchor is favourable, the anchor is doing the work. If conversion is flat
across both, it isn't — and that would falsify the core hypothesis.

---

## 6. What would falsify the hypothesis

Named in advance, because a hypothesis that can't be wrong isn't one.

| Observation | What it would mean |
|---|---|
| Trial rises, 30-day repeat flat | The feature creates one-offs. Root-cause diagnosis (crossover is event-triggered) is right, but this intervention doesn't convert it into habit |
| Conversion identical whether the anchor is favourable or not | The price anchor isn't the active ingredient. The whole §2 argument in `docs/03-problem-definition.md` is wrong |
| Mode B underperforms Mode A | The post-crossover window isn't the high-value moment; recency doesn't beat novelty |
| Dismissal >60% within a week | Users in fetch mode reject *any* interruption — an ability-side fix isn't enough on its own |
| CER moves, but core order frequency drops >3% | Exploration was bought with retention. Net negative |

---

## 7. Analysis, decided up front

- **One primary metric.** CER. No fishing across secondaries for something significant.
- **Secondaries are directional only** and are not used to declare success on their own.
- **Guardrails are evaluated first.** A tripped guardrail ends the analysis regardless of CER.
- **No mid-flight stopping** for a favourable early read. Four weeks is four weeks.
- Segment cuts (pet owners, parents) are **exploratory only** — the survey's n for those groups is
  far too small to power them, and they are stated as hypothesis-generating, not conclusive.

---

## 8. Honest limitation

None of this has been run. The MVP operates on synthetic order histories, so there is no lift figure
to report and none is claimed. What this document establishes is that the feature was designed with
a falsifiable hypothesis, a defined primary metric, and kill criteria fixed in advance — which is
the part that has to be decided before results exist, not after.
