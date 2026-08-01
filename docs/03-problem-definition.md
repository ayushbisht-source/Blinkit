# Part 3 — Problem Definition

> **Status of evidence.** Everything below rests on the 40-response survey (real), the discovery
> engine's corpus of 3,372 documents, and 2 depth interviews (real, async text — target is 5–6, see
> `docs/02-user-research.md` §5 and §8). Where a claim depends on engine output still being
> processed, it is marked `[pending engine]` rather than asserted. Interview evidence is labelled
> n=2 wherever it appears and never carries a claim on its own.

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

### One interview suggests a constraint upstream of this one

P03 gave a reason for never buying a category that is not an evaluation problem at all:

> *"we need to buy atleast minimum rs product like 150 or 200 rs of products for not to charge
> delivery fees too so I never bought home appliance"*

Read as **basket-shape mismatch** — the user has internalised what this app is *for*, assembling
₹150–200 of small top-up items, and a category outside that shape never enters consideration — this
sits *before* the ability constraint rather than inside it. P03 isn't failing to evaluate the home
appliance quickly enough; they never open the question.

Three qualifications, all load-bearing:

1. **n=1.** No other respondent raised it.
2. **The mechanism as stated doesn't parse literally** — a minimum-order threshold should push a
   basket up, and an appliance clears ₹200 easily. Basket-shape mismatch is the analyst's reading,
   not the respondent's words (`research/transcripts/P03.md` §2).
3. **Async text couldn't probe it.** A live interview would have resolved this in one follow-up.

It is recorded here rather than in a footnote because if it holds, it bounds this section's claim:
the Fogg analysis would explain why users skip categories they *consider*, and say nothing about
categories that never reach consideration. **The MVP is not changed by it either way** — a single
cross-category suggestion at cart review is, if anything, helped by a threshold the user is trying
to clear. But the root cause above would be one of two, not the only one, and that is worth knowing
before treating it as settled.

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
| **Confirmed by survey** | `[pending engine]` — filled once theme prevalences are computed. |
| **Challenged by survey** | `[pending engine]` |
| **Structural limit of the survey** | The survey cannot strongly challenge the engine *by construction* — its barrier options were written from the engine's own `barrier[]` vocabulary so the two datasets would compare directly. It can confirm prevalence; it is structurally poor at surfacing a barrier nobody thought to ask about. |
| **Confirmed by interview** (n=3) | **3 of 3 on event-triggered crossover**, with the three different triggers §5 predicts: ran out (P01, refined oil), urgent need with no alternative (P02, liquid detergent), and a life event creating a need that did not exist before (P03 — *"i joined gym and i don't have sipper so i bought urgently"*). **3 of 3 arrived knowing the item.** **3 of 3 named quality unprompted** as the precondition for trying a new category, matching F3; none mentioned delivery speed, returns, or brand. |
| **Challenged by interview** (n=3) | **The engine's `barrier[]` enum has no code for "this category does not apply to me."** All three named a never-bought category and explained it as irrelevance, not obstruction — *"I don't have kids and pets"* (P01), *"I don't have kids"* (P02), *"I live alone and I live in full furnished so nothing to do with it"* (P03) — and none named a competing channel, because no purchase is happening anywhere. All eight enum values presume latent demand being blocked. Forced onto the survey's closed list, all three would have been recorded as blocked, overstating addressable demand. See `docs/02-user-research.md` §8.1. |
| **Challenged by interview, with corpus evidence** | **A barrier that is neither informational nor in the schema: basket economics.** P03 — *"we need to buy atleast minimum rs product like 150 or 200 rs of products for not to charge delivery fees too so I never bought home appliance."* Unlike the other gaps this one leaves text, so it is checkable: **133 of 3,372 documents** use minimum-order / delivery-fee / threshold language (`research/check_basket_economics.py`). The gate rejected 64 of them as delivery or support complaints; the **39** threshold-specific ones it kept will reach extraction and find no `barrier[]` value that fits — `price_risk` means *"unsure if the price is fair"*, and these users know exactly what the fee is. The engine collected the signal at scale and has nowhere to store it. See `docs/02-user-research.md` §8.3. |
| **Also challenged** (n=2 of 3, weaker) | P01 and P02 opened the app because of the **absence of an alternative** — *"only Blinkit is available there"*, *"late night… no shop around me"*. No `HabitDriver` value covers access-of-last-resort; all six describe choosing between available options. P03 does not replicate it. Recorded as a hypothesis to check against extraction output, not a finding. |
| **Unsettled by interview** | **Whether price triggers a crossover or merely confirms one.** P02 named it third, after urgency and absence of alternatives; P03's last order was triggered by price alone with no urgency, after deliberate cross-platform comparison (*"200 rs discount apart from other platforms"*). Three interviews cannot say which is typical, and this is left open rather than resolved in whichever direction suits the MVP. |
| **Challenged by testing AI output against data** | **A synthetic-persona hypothesis was falsified.** Personas generated from the survey claimed category breadth reflects order consolidation, predicting that infrequent users would show *more* categories. Computed against the real rows: r = **+0.25**, the opposite direction. One of five generated hypotheses was testable; it was wrong. See `docs/02-user-research.md` §7. |

**Read the persona row and the interview rows together — that pairing is the methodological finding
of this project.**

AI-synthesized personas were generated from the survey (`docs/02-user-research.md` §6) and produced
fluent, plausible, mechanism-shaped narratives. Of the five hypotheses they generated, four could
not be tested with the available instruments and the fifth was falsified. A persona generated *from*
survey data cannot contain information the survey did not capture: it can rephrase, it cannot
surprise.

Three real conversations then produced three things none of the AI-driven or instrument-driven
methods could reach, and the three fail in two distinct ways worth separating:

- **Irrelevance** and **access-of-last-resort** are invisible to the engine *by construction*.
  Nobody writes a review about a product they have no reason to buy. Absence of need generates no
  text, so no amount of additional collection would have surfaced them. More scale does not help.
- **Basket economics** is the opposite case and the more damaging one. The engine collected **133
  documents** of it. The relevance gate binned 64 as delivery complaints; the 39 threshold-specific
  survivors will hit an extraction schema with no field for what they say. Here the data was
  present, at scale, and the **taxonomy** threw it away.

The second failure is the one worth generalising from. A vocabulary written before anyone asked a
user an open question will silently discard whatever it has no name for, and it will do so while
reporting high coverage — 3,372 documents processed, thousands of labels assigned, and a whole class
of barrier reduced to `price_risk` or `delivery`. Scale makes that worse, not better, because it
buries the residue.

That is the concrete demonstration of the brief's own premise that *"AI-generated insights are only
a starting point."* Not asserted — observed, on this project's own data, and reported as a
limitation of this project's own method rather than a general claim about AI.

**What is not claimed:** n=3 cannot establish how common any of this is, and all three respondents
are non-parents with two in single-person households — a recruitment confound stated in
`docs/02-user-research.md` §8.7. The finding is that the **taxonomy is incomplete**, which does not
require a representative sample: one respondent whose answer has no valid code is sufficient, and
there are three. Prevalence needs the remaining interviews and a survey instrument that offers the
missing options.
