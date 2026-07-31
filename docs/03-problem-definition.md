# Part 3 — Problem Definition

> **Status of evidence.** Everything below rests on the 40-response survey (real) and the discovery
> engine's corpus of 3,372 documents. Where a claim depends on engine output still being processed,
> it is marked `[pending engine]` rather than asserted. Depth interviews were not conducted — see
> `docs/02-user-research.md` §5.

---

## 1. Target segment

**Habitual Narrow Repeaters** — users who order frequently, have used the platform long enough to
have settled into a routine, and buy from very few categories.

| Criterion | Threshold | Survey support |
|---|---|---|
| Order frequency | ≥3 orders/month | 27 of 40 respondents |
| Tenure | ≥6 months | majority |
| Category concentration | ≤2 categories carrying most spend | the modal pattern |

**Why this segment and not "users who don't explore" generally.** They are already acquired, already
transacting, already trusting the platform with money several times a month. Whatever stops them is
therefore *behavioural*, not a marketing, pricing or trust-in-platform problem. That is the only
kind of blocker a software feature can plausibly move inside one product cycle. A segment whose
barrier is "has never heard of Blinkit" cannot be fixed by a card in the cart.

**Size.** Left as a stated assumption rather than a fabricated number: the survey is a convenience
sample of 40 and cannot support a population estimate. The sizing model in §5 is expressed in terms
of segment share so it can be recomputed against real platform data.

---

## 2. Root cause

### The symptom is not the problem

"Users don't explore new categories" is a symptom. The survey rules out the three explanations most
people reach for first:

| Popular explanation | Survey verdict |
|---|---|
| They don't *want* to try new things | **Rejected.** 39 of 40 have wanted to and didn't. Exactly one said "never". |
| They don't *know* other categories exist | **Rejected.** Nobody's leading blocker is awareness. Their first stop for something new is the app itself (Blinkit 16, Zepto 12, Instamart 8 — versus Amazon 3). |
| They don't *trust the platform* | **Rejected.** They trust it enough to order 3+ times a month. The distrust is product-level, not platform-level. |

So: motivation exists, awareness exists, platform trust exists — and the behaviour still doesn't
happen. The cause has to be somewhere else.

### Five whys

1. **Why don't they buy from new categories?** Because they arrive already knowing what they want —
   38 of 40 say "always" or "mostly" know before opening the app. Only 2 browse.
2. **Why do they arrive pre-decided?** Because the app is used as a *fetch tool* under time
   pressure. Fast delivery is the top reason 25 of 40 chose their app. The session has a job and a
   budget of about two minutes.
3. **Why does being in fetch mode block a new category?** Because trying something unfamiliar
   requires an *evaluation* — is this right for me, is this price fair, can I trust it — and that
   evaluation isn't in the session's time budget. 13 of 40 named "took too long to explore/compare"
   directly.
4. **Why does the evaluation take so long?** Because the information needed to make it quickly isn't
   present. Users must supply it themselves: recall what they pay elsewhere, judge an unknown
   brand, guess whether the size fits. 14 cite quality/taste uncertainty, 14 "not sure it'd suit my
   need", 14 want reviews first, 12 don't trust the brand, 8 say it's priced above their usual.
5. **Why isn't that information present?** Because the interface treats an unfamiliar category
   exactly like a familiar one. A product page shows a price. For a category you already buy, price
   is sufficient — you hold the reference point in your head. For one you've never bought, price
   without a reference point is uninterpretable.

### Root cause

> **The app presents unfamiliar categories with the same information as familiar ones. For a
> familiar category that is enough, because the user supplies the missing context from memory. For
> an unfamiliar one it is not — so evaluating it costs time the user has not budgeted, and the
> rational move inside a two-minute fetch session is to skip it.**

Every skip is individually correct. The aggregate outcome is a user who has bought the same things
for two years.

### In behavioural terms

Using Fogg (B = Motivation × Ability × Prompt):

- **Motivation** — present. 39/40.
- **Prompt** — present. They see the categories; the app is their first stop for new things.
- **Ability** — **the binding constraint.** Not "can they afford it" but *can they decide fast
  enough*.

This matters because it dictates what will and won't work. Interventions that add motivation
(discounts, "explore now" banners) or add prompts (push notifications, homepage rails) push on
variables that are already non-zero. Only interventions that raise *evaluation speed* touch the
constraint.

---

## 3. Existing workarounds

Workarounds are the strongest available evidence that a need is real — people only build them for
problems they actually have. The survey shows four:

| Workaround | Evidence | What it reveals |
|---|---|---|
| **Buy new categories somewhere else** | For something totally new: D-Mart 8, Kirana 6, Amazon 3 | They still buy the category — just not here. This is displaced revenue, not absent demand. |
| **Wait for a price signal** | "Found it cheaper elsewhere" 12, "too expensive" 8 as reasons for backing out | Price is being used as a *proxy for risk*, not just cost. Cheap enough means safe enough to test. |
| **Seek validation outside the app** | 14 want reviews/comparison before trying | The evaluation happens — it just happens on Instagram, YouTube, or in a shop, and by then the purchase happens there too. |
| **Defer indefinitely** | "Forgot about it once I started adding my regular items" 3; "got distracted" 6 | Intent exists but evaporates on contact with the reorder flow. The habit loop actively crowds it out. |

The first is the most commercially significant: **the demand isn't missing, it's leaking.**

---

## 4. Why solving this creates user value

Not "users get more choice" — they already have choice and don't use it. The value is narrower:

1. **It removes a decision cost, not adds an option.** The user wanted to try the thing (39/40).
   What they lacked was a way to decide quickly enough to act. Supplying the price anchor and trust
   signal converts a deferred intention into a completed one.
2. **It reduces the risk of a bad purchase.** "Didn't really need it" is the single most common
   reason for backing out (13/40). A suggestion grounded in the user's own history and consumption
   rate is more likely to be something they actually need than anything they'd have found browsing.
3. **It saves a trip.** Users currently satisfy these needs at D-Mart, a kirana store, or Amazon.
   Consolidating removes a separate errand.

The honest limit: this is a *convenience* gain, not a transformative one. It should be argued as
such rather than oversold.

---

## 5. Why solving this makes business sense

### The metric

Blinkit's stated goal is % of MAC purchasing from ≥1 new category per month — a **recurrence**
measure, per `docs/00-foundation.md`.

### The finding that reframes the target

The survey splits **20/20** on "bought from a new category in the last 3 months". That looks like
half the base are already explorers. They are not.

Cross-referencing the crossers' stated reasons for not trying *more* against the non-crossers'
reasons for not trying *at all* shows they are near-identical — habit, fit uncertainty, wanting
reviews. **Crossing over once did not reduce the barrier.** If it had, those reasons should have
softened.

> **Therefore crossover is event-triggered and non-repeating.** Something external forces it (ran
> out, a discount, a life event), the user buys once, and reverts to their list.

This changes what to build. A *monthly* metric is not moved by one-off trial — it is moved by
repeat. So the highest-value moment is not first trial at all; it is the window **immediately after
a first cross-category purchase, before the user reverts**. That is a moment the platform can detect
precisely, and it is why the MVP prioritises Mode B over Mode A (`docs/04-mvp-spec.md`).

### Sizing

Expressed as a formula rather than a fabricated number, so it can be run against real data:

```
Incremental monthly GMV
  = MAC
  × segment_share                      (Habitual Narrow Repeaters)
  × Δ(second-purchase rate)            (the Mode B conversion)
  × avg_basket_in_that_category
  × retention_multiplier
```

### The strategic argument, which is stronger than the arithmetic

Category breadth is among the best-known predictors of retention and LTV in quick commerce. A user
buying from one category is trivially substitutable — a competitor needs to win one habit. A user
buying from five has five habits to dislodge and a basket that is inconvenient to rebuild elsewhere.

**Framed correctly, this is a moat investment, not a GMV tactic.** The GMV from a ₹99 pet-food pack
is negligible. The value is that the user now has two reasons to open Blinkit instead of one.

### Guardrails, pre-registered

Committed in advance so the result isn't relitigated afterwards:

- No AOV degradation
- No drop in core-category order frequency (>3% = kill)
- No rise in refund/return rate
- Card dismissal rate below 60%

---

## 6. How primary research met the AI findings

The brief asks specifically whether primary research **validated or challenged** the engine's
insights. Honest reporting of that comparison, including its limits:

| | |
|---|---|
| **Confirmed** | `[pending engine]` — filled once theme prevalences are computed. |
| **Challenged** | `[pending engine]` |
| **Challenged, already known** | The survey cannot strongly challenge the engine *by construction* — its barrier options were written from the engine's own `barrier[]` vocabulary so the two datasets would compare directly. It can confirm prevalence; it is structurally poor at surfacing a barrier nobody thought to ask about. |

**The most important methodological finding of this project is that last row.** AI-synthesized
personas were also generated from the survey (`docs/02-user-research.md` §6) and produced fluent,
plausible narratives — but a persona generated *from* survey data cannot contain information the
survey did not capture. It can rephrase; it cannot surprise.

That is the concrete demonstration of the brief's own premise that *"AI-generated insights are only
a starting point."* Not asserted — observed, and reported as a limitation of this project's own
method rather than a general claim about AI.
