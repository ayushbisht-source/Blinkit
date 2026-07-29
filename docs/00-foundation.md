# Phase 0 — Foundation

Decisions locked before any code runs. Changing anything here after Phase 1 starts means re-running
extraction, so it is worth the hour.

---

## 1. Primary metric — Category Expansion Rate (CER)

```
CER(month M) = distinct users who purchased from category C in M,
               where C ∉ any category that user purchased in M-1 … M-6
               ──────────────────────────────────────────────────────
                        distinct users with ≥1 order in M
```

**The 6-month lookback is the point.** Without it, a user rebuying mosquito repellent each summer
registers as "exploring," and the metric flatters itself. State the lookback explicitly whenever the
number is quoted.

### Secondary metrics
- New-category **trial rate** — % of MAC adding a new-category item to cart
- **30-day repeat rate within a newly tried category** — the one that actually matters. Trial without
  repeat is a discount, not exploration
- Mean distinct categories per user per month

### Guardrails
Any intervention must not degrade:

| Guardrail | Why it could break |
|---|---|
| AOV | Trial baskets are small and cheap by design |
| Core-category order frequency | Attention spent exploring is attention not spent restocking |
| Refund / return rate | Users buying unfamiliar things return more |
| Nudge dismissal rate | The fast signal that the feature is annoying |

---

## 2. Target segment — "Habitual Narrow Repeaters"

| Criterion | Threshold |
|---|---|
| Order frequency | ≥3 orders/month |
| Tenure | ≥6 months |
| Category concentration | ≥70% of spend across ≤2 categories |

**Why this segment.** They are already acquired, already trusting, already transacting. Whatever is
stopping them is therefore *behavioural*, not a marketing or acquisition problem — which makes it the
kind of barrier a software MVP can plausibly move within one product cycle. A segment whose blocker
is "has never heard of Blinkit" cannot be fixed by a feature.

**Status: locked for this project's timeline.** The honest alternative is to leave selection until
the engine reports, but with a fixed submission date, recruitment has to start before the engine
finishes. The mitigation is to state the hypothesis up front and report in Part 2 whether the corpus
actually supported it — a pre-registered guess that survives contact with data is stronger evidence
than a segment reverse-engineered from results.

---

## 3. Research questions → extraction fields

The brief's eight questions are implemented as typed fields in `engine/schema.py`. That file is the
single source of truth; this table is a reading aid.

| # | Brief question | Field |
|---|---|---|
| 1 | Why do users repeatedly buy the same categories? | `habit_driver[]`, `habit_signal` |
| 2 | What prevents exploring new categories? | `barrier[]` |
| 3 | How do users discover products today? | `discovery_channel[]` |
| 4 | What role do habits play? | `habit_signal` (0–3), `habit_driver[]` |
| 5 | What information is needed before trying a category? | `information_gap[]` |
| 6 | What frustrations recur? | `frustration[]`, `sentiment` |
| 7 | Which segments experiment more? | `segment_signal[]` |
| 8 | What unmet needs recur? | `pain_statement` → clustered into `Theme` |

Every insight declares which questions it answers (`research_questions_answered`), so coverage of the
brief is checkable rather than asserted.

---

## 4. Data ethics and terms of service

- **Public data only.** No authenticated endpoints, no login-walled content, no private groups.
- **No personal data retained.** Usernames are hashed with a salt at ingestion (`author_hash`); raw
  handles are never written to disk. Emails and phone numbers are stripped in `normalize.py`.
- **Rate limits respected.** Collectors back off rather than parallelising around limits.
- **Interview data** is consent-recorded, anonymised to `P01…P06` on save, and kept out of the public
  corpus. No transcript identifies an employer, address, or family member by name.
- **Attribution.** Insights link to `source_url` so any quote can be traced to its origin.
- **Scope.** This is an academic exercise. The corpus is not redistributed; only aggregate counts and
  short quotations appear in the write-up.

---

## 5. Known limitations — declared up front, not discovered later

1. **Public feedback over-indexes on anger.** Reviews are written by people motivated enough to
   complain. Silent friction — "I just never thought to" — is structurally absent from the corpus.
   This is the principal reason Part 2 exists, and the comparison in Part 2 quantifies it.
2. **n=6 qualitative sample** supports depth and mechanism, not prevalence. No percentage is ever
   quoted from interviews.
3. **X/Twitter is effectively paywalled.** Covered via manual export where possible; the gap is
   stated rather than papered over.
4. **The MVP runs on synthetic order history.** It demonstrates the mechanism, not real-world lift.
