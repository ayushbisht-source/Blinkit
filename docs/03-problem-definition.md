# Part 3 — Problem Definition

> **Status of evidence.** Everything below rests on the 40-response survey (real), the discovery
> engine's corpus of 3,372 documents, and 5 depth interviews (real, async text, meeting the brief's
> minimum — see `docs/02-user-research.md` §8). Interview evidence is labelled n=5 wherever it
> appears and never carries a quantitative claim on its own.

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

### Two of five interviews describe barriers this model does not cover

The analysis above says the constraint is *evaluation speed*: users would try an unfamiliar category
if judging it were cheaper. Supplying the missing reference point is therefore the intervention.

Two respondents describe barriers where that is not the mechanism at all.

> **P04**, asked what would have to be true to buy groceries on the app: *"Maybe when we shift to our
> new home or maybe when the kirana store which is near to our home will close permanently."*

The question asks for information or evidence; the answer contains none. Both unblocking conditions
are structural changes to their circumstances. P04 has a working supplier used *"like from ages"* —
an incumbent relationship, not an evaluation problem.

> **P05**, on vegetables: *"I will never buy from blinkit my trust issues for vegetables is still
> there"* — after *"one time I got really bad vegetables."*

P05 is not short of information. They have information: they tried it, it was bad, and they updated.
A belief formed by direct experience is not reopened by a price anchor or a freshness badge.

**A third case, weaker and recorded for completeness.** P03 gave a reason that is not an evaluation
problem either — *"we need to buy atleast minimum rs product like 150 or 200 rs of products for not
to charge delivery fees too so I never bought home appliance"* — read as **basket-shape mismatch**:
the app is internalised as a place for ₹150–200 of small top-up items, and categories outside that
shape never enter consideration. That reading is the analyst's, not the respondent's, and the
mechanism as stated does not parse literally (a minimum should push a basket *up*).
`research/transcripts/P03.md` §2 records it as ambiguous.

**What this changes.** The Fogg analysis above is not wrong, and the survey evidence for it is
strong — 39/40 want to explore, 13/40 name comparison time as the blocker. But it describes **users
who would try if evaluation were cheaper**, and that is not everyone:

| Barrier type | Mechanism | Does the MVP help? |
|---|---|---|
| Evaluation cost (the model above) | Cannot judge fit, price or trust fast enough | **Yes** — this is what it is for |
| Incumbent supplier (P04) | Existing offline relationship, no dissatisfaction | **No** — resolves only on a life change |
| Settled negative belief (P05) | Direct bad experience, already updated | **No** — and a card here is a wasted impression |
| Category irrelevance (P01–P03) | No latent demand at all | **No** — suppression case, not a conversion case |

At 2 of 5 for the middle two rows this is not a rate, and the sample is too small and too
convenience-drawn to size any of them. What it does establish is that **the addressable population
is smaller than the survey's 39/40 implies**, because that number counts everyone who has ever
wanted to try something — not everyone whose barrier a faster evaluation would remove.

That is a limitation on the *sizing* in §5, and it is why the model there is expressed as a formula
over segment share rather than a headline number. It is not a limitation on the MVP's design: the
agent already refuses to show a card when the data cannot substantiate a reason, which is the
correct behaviour for all three non-addressable rows.

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

This changes what to build — though not in the direction first written here.

> **Correction.** This section originally concluded that the monthly metric is moved by a *repeat
> purchase in the category already tried*, and that the MVP should therefore prioritise Mode B. CER
> counts a purchase in month M from a category the user bought from in **none of M-1 … M-6**
> (`docs/00-foundation.md`), so a repeat 14–45 days after first trial sits inside the lookback and
> contributes nothing to it. Measured against the seeded shoppers, 35 of 36 suggestions in the MVP's
> row would register in CER and the single one that would not is the Mode B card
> (`mvp/evals/cer-audit.mjs`).
>
> The finding above survives intact and is the more important half: **crossing once did not reduce
> the barrier.** What follows is that the intervention must supply fit, price and trust *again, for a
> different category, every month* — there is no one-shot unlock. Mode A therefore leads and Mode B
> takes the last slot, serving the secondary metric it belongs to (30-day repeat within a newly
> tried category), which is what stops CER being satisfied by one-off trials that never return.

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
| **Confirmed by survey** | **The ranking of barriers matches.** Engine, across 832 extractions carrying a barrier code: `trust_quality` **45.3%**, `price_risk` **22.7%**, `awareness` **4.8%**. Survey, n=40: quality/taste uncertainty is the top blocker (14) with brand distrust close behind (12); price second (8 "priced higher than usual" + 7 "price feels risky"); and *nobody's* leading answer is "I didn't know they sold it." Two independently collected datasets — one mined from public reviews, one asked directly — put the same three barriers in the same order. |
| **Challenged by survey** | **The engine almost cannot see the survey's second-biggest blocker.** "Took too long to explore/compare" is 13/40 — **32.5%**, rank 2. The corresponding engine code, `choice_overload`, appears **13 times in 832 extractions: 1.5%**. A twentyfold gap is not sampling noise. The explanation is structural: reviews are written *after* a transaction, by people motivated by an outcome. Nobody writes a review saying "I considered pet food, found comparing too slow, and bought nothing." The non-purchase leaves no text. See below. |
| **Where the engine outruns both** | Its third-largest barrier is `return_anxiety` at **18.4%** — a concern the survey barely probes and no interview raised. 3,372 documents surface a substantial post-purchase barrier that 40 closed-form responses and five conversations all under-weight. The correction runs both ways, and this row is why the engine is worth building rather than replacing with more interviews. |
| **Where the two complete each other** | The engine's largest themes are spoiled produce and quality failure — THM-01 (72 statements), THM-02 (51), THM-04 (42). It established the *prevalence* and could not establish the *consequence*, because reviews are cross-sectional: one moment, one person, no follow-up. P05 supplies it — the category is abandoned **permanently**, from a single incident. 3,372 documents give the size of the problem; one interview gives its mechanism. |
| **Structural limit of the survey** | The survey cannot strongly challenge the engine *by construction* — its barrier options were written from the engine's own `barrier[]` vocabulary so the two datasets would compare directly. It can confirm prevalence; it is structurally poor at surfacing a barrier nobody thought to ask about. |
| **Confirmed by interview** (n=5) | **5 of 5 on event-triggered crossover**, spanning the full trigger set §5 predicts: ran out (P01), urgency with no alternative (P02, P04 — *"it's midnight all shops closed and we need that urgent for our baby"*), and a life event creating a need that did not exist before (P03 joined a gym, P05 moved house). **5 of 5 arrived knowing the item; not one described browsing.** The prediction that a single browsing respondent would overturn the fetch-mode model was written at n=2 and survived three more interviews. |
| **Challenged by interview** (n=5) | **The engine's `barrier[]` enum has no code for "this category does not apply to me."** Three of five named a never-bought category and explained it as irrelevance, not obstruction — *"I don't have kids and pets"* (P01), *"I don't have kids"* (P02), *"I live alone and I live in full furnished so nothing to do with it"* (P03) — and none named a competing channel, because no purchase is happening anywhere. All eight enum values presume latent demand being blocked, so all three would have been miscoded as blocked, overstating addressable demand. **The obvious objection was tested:** at n=3 every respondent was a non-parent, so P04 was recruited as a parent of a newborn — and buys baby care, on an app. Irrelevance tracks life stage, as claimed; the pattern narrows to 3 of 5. See `docs/02-user-research.md` §8.1. |
| **Challenged by interview, structurally** (n=2 of 5) | **Two respondents have barriers no information can close** — P04's incumbent kirana (*"we are buying from there like from ages"*, unblocked only by moving house or the shop closing) and P05's settled belief after one bad delivery (*"I will never buy… my trust issues for vegetables is still there"*). Neither is an evaluation-speed problem, so neither is addressed by the root cause above or by the MVP. §2 now carries this explicitly. |
| **Challenged by interview, with corpus evidence** | **A barrier that is neither informational nor in the schema: basket economics.** P03 — *"we need to buy atleast minimum rs product like 150 or 200 rs of products for not to charge delivery fees too so I never bought home appliance."* Unlike the other gaps this one leaves text, so it is checkable: **133 of 3,372 documents** use minimum-order / delivery-fee / threshold language (`research/check_basket_economics.py`). The gate rejected 64 of them as delivery or support complaints. The rest reached extraction and clustered into a theme of their own — **THM-05, 34 statements, 5.4%** — which the pipeline then coded `price_risk`, meaning *"unsure if the price is fair"*, when its quotes are people re-planning a basket around a threshold that moved (*"Before it serves free delivery on 100₹ , And now 400₹"*). The theme is real; no `barrier[]` value fits it — `price_risk` means *"unsure if the price is fair"*, and these users know exactly what the fee is. The engine collected the signal at scale and has nowhere to store it. See `docs/02-user-research.md` §8.3. |
| **Also challenged** (n=2 of 3, weaker) | P01 and P02 opened the app because of the **absence of an alternative** — *"only Blinkit is available there"*, *"late night… no shop around me"*. No `HabitDriver` value covers access-of-last-resort; all six describe choosing between available options. P03 does not replicate it. Recorded as a hypothesis to check against extraction output, not a finding. |
| **Unsettled by interview** | **Whether price triggers a crossover or merely confirms one.** P02 named it third, after urgency and absence of alternatives; P03's last order was triggered by price alone with no urgency, after deliberate cross-platform comparison (*"200 rs discount apart from other platforms"*). Three interviews cannot say which is typical, and this is left open rather than resolved in whichever direction suits the MVP. |
| **Challenged by testing AI output against data** | **A synthetic-persona hypothesis was falsified.** Personas generated from the survey claimed category breadth reflects order consolidation, predicting that infrequent users would show *more* categories. Computed against the real rows: r = **+0.25**, the opposite direction. One of five generated hypotheses was testable; it was wrong. See `docs/02-user-research.md` §7. |

### The single structural blind spot behind every challenge above

The three challenges are not three separate weaknesses. They are one, showing up three times.

**A corpus of reviews contains only people who completed a transaction.** Every barrier that stops
someone *before* they buy is invisible to it, not because the collection was too small but because
the behaviour generates no text at all.

| What was missed | Found by | Why the corpus cannot hold it |
|---|---|---|
| "Comparing took too long, so I bought nothing" | Survey, 13/40 | The user didn't buy, so there is nothing to review |
| "This category doesn't apply to me" | Interviews, 3/3 | No need means no purchase means no review |
| "I organise my basket around the free-delivery threshold" | Interview + 133 corpus docs | Present in the text, but the gate read it as a delivery complaint and the schema has no code for it |

The first two are invisible by construction. The third is the more instructive one, because it shows
the same blindness arising a second way: the data *was* collected, at scale, and the vocabulary
discarded it.

Note what this does to the engine's own numbers. Two of its three largest information gaps are
post-purchase — `freshness_expiry` **40.6%** and `returnability` **21.7%**, written by people
describing an order that went wrong. The survey's top concerns are pre-purchase: fitness-for-need
(14) and wanting reviews first (14). **Neither instrument is wrong. They sample different moments**, and only reading them together shows the
shape of the problem: the corpus is rich about what disappoints buyers and nearly silent about what
prevents purchases, which is the exact thing this project was commissioned to change.

That asymmetry is why Part 2's primary research is load-bearing rather than decorative, and it is
the concrete answer to why an AI discovery engine at 3,372 documents does not remove the need to
talk to three people.

---

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
