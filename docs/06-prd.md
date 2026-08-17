# PRD — Category Spark

**Product:** Blinkit · Growth · Category Exploration  
**Author:** Ayush Bisht  
**Status:** Prototype deployed, not experimented. No lift figure exists and none is claimed.  
**Last updated:** 4 August 2026

| | |
|---|---|
| Live prototype | https://ayushbisht-source.github.io/Blinkit/ |
| Review analysis workflow | https://ayushbisht-source.github.io/Blinkit/workflow/ |
| Repository | https://github.com/ayushbisht-source/Blinkit |

> **A note on what this document is.** It was written *after* the prototype shipped, from the
> research, the spec and the code that exist. It is a consolidation, not a forward plan, and where
> the build corrected an earlier assumption the correction is recorded here rather than smoothed
> over. §14 lists those corrections explicitly.

---

## 1. Summary

Blinkit wants a higher share of Monthly Active Customers buying from at least one **new** category
each month. The obvious reading — that users need more encouragement — is wrong: **39 of 40 surveyed
have wanted to try something new and didn't.** Desire is not the missing input.

The binding constraint is **evaluation speed**. The app shows an unfamiliar category exactly what it
shows a familiar one: a price. For a category you already buy that is sufficient, because you hold
the reference point in your head. For one you have never bought, a price with no reference point is
uninterpretable — so evaluating it costs time a two-minute fetch session has not budgeted, and
skipping is the rational move.

**Category Spark** supplies the missing reference point at cart review: up to five suggestions, each
opening a *different* never-bought category, each carrying a reason drawn from the shopper's own
history, a **price anchor** expressed as ₹/week against their own comparable spend, and a trust
signal. It shows nothing at all when the data cannot substantiate a reason.

---

## 2. Strategic context

The company goal, verbatim from the brief:

> Increase the percentage of Monthly Active Customers who purchase products from at least one new
> category every month. *Examples: a user who buys groceries starts buying pet supplies; a user who
> buys snacks starts buying personal care; a user who buys household essentials starts buying baby
> products.*

Formalised as **CER (Category Expansion Rate)** in `docs/00-foundation.md`:

```
CER(month M) = distinct users who purchased from category C in M,
               where C ∉ any category that user purchased in M-1 … M-6
               ──────────────────────────────────────────────────────
                        distinct users with ≥1 order in M
```

**The six-month lookback is load-bearing and shapes the entire product.** Without it, a user rebuying
mosquito repellent each summer registers as exploring. With it, a repeat purchase in a category
tried last month scores **zero** — which is why §7 ranks first crossovers ahead of repeat prompts.

**Why the company should care beyond GMV.** The revenue from a ₹99 pet-food pack is negligible.
Category breadth is a retention property: a user buying from one category is trivially substitutable
— a competitor needs to win one habit. A user buying from five has five habits to dislodge and a
basket that is inconvenient to rebuild elsewhere. **This is a moat investment, not a GMV tactic**,
and it should be argued as such.

---

## 3. Problem

### 3.1 Evidence base

| Instrument | n | What it is |
|---|---|---|
| Public review corpus | 5,898 collected · **3,372 analysed** | Play Store + App Store, 11 apps. 971 judged relevant, 937 extracted, 25 themes |
| Screener-matched survey | **40** | Real respondents, collected 28–29 Jul 2026 |
| Depth interviews | **5** | Real, async over text, anonymised P01–P05 across three platforms |

No interview was fabricated. AI-synthesised personas were generated, tested, and **excluded from the
evidence base** — of five hypotheses they produced, one was testable and it was wrong (`docs/02` §7).

### 3.2 Root cause

Five whys, from `docs/03-problem-definition.md`:

1. **Why don't they buy new categories?** They arrive already decided — 38/40 "always" or "mostly"
   know before opening the app. Two people browse.
2. **Why pre-decided?** The app is a *fetch tool* under time pressure. Fast delivery is why 25/40
   chose it. The session has a job and a ~2-minute budget.
3. **Why does fetch mode block a new category?** Trying something unfamiliar requires an
   *evaluation* — fit, price, trust — and that isn't in the budget. 13/40 named comparison time
   directly.
4. **Why does evaluation take so long?** The information needed isn't present. Users must supply it
   themselves.
5. **Why isn't it present?** The interface treats an unfamiliar category exactly like a familiar one.

> **Root cause.** The app presents unfamiliar categories with the same information as familiar ones.
> For a familiar category that is enough, because the user supplies the missing context from memory.
> For an unfamiliar one it is not — so evaluating it costs time the user has not budgeted, and the
> rational move inside a two-minute fetch session is to skip it.

**Every skip is individually correct. The aggregate outcome is a user who has bought the same things
for two years.**

In Fogg terms (B = Motivation × Ability × Prompt): motivation is present (39/40), prompt is present,
**ability is the binding constraint** — not affordability, but *can they decide fast enough*. This
dictates what will not work: discounts and "explore now" banners push on variables that are already
non-zero.

### 3.3 Existing workarounds

Workarounds are the strongest evidence a need is real — people only build them for problems they have.

| Workaround | Evidence | What it reveals |
|---|---|---|
| Buy the category elsewhere | D-Mart 8 · Kirana 6 · Amazon 3 | **The demand isn't missing, it's leaking.** Displaced revenue |
| Wait for a price signal | "cheaper elsewhere" 12 · "too expensive" 8 | Price is a proxy for *risk*. Cheap enough = safe enough to test |
| Validate outside the app | 14 want reviews first | The evaluation happens — on Instagram or in a shop. So does the purchase |
| Defer indefinitely | "forgot once cart-filling" 3 · distracted 6 | Intent evaporates on contact with the reorder flow |

### 3.4 Where the model stops

Two of five interviewees have barriers **no information closes**:

- **P04** — an incumbent kirana used *"like from ages"*, unblocked only by moving house or the shop
  closing.
- **P05** — a settled belief after one bad delivery: *"I will never buy from blinkit my trust issues
  for vegetables is still there."*

A third pattern, **category irrelevance** (3 of 5), has no latent demand at all. The addressable
population is therefore **smaller than 39/40 implies** — that number counts everyone who ever wanted
to try something, not everyone whose barrier a faster evaluation removes. This bounds the sizing in
§5, not the design: the agent already declines to show a card in all three cases.

---

## 4. Target user

**Habitual Narrow Repeaters.**

| Criterion | Threshold | Support |
|---|---|---|
| Order frequency | ≥3 orders/month | 27 of 40 |
| Tenure | ≥6 months | majority |
| Category concentration | ≤2 categories carry most spend | the modal pattern |

**Why this segment.** Already acquired, already transacting, already trusting the platform with money
several times a month. Whatever stops them is *behavioural* — the only kind of blocker a software
feature can plausibly move inside one product cycle. A segment whose barrier is "has never heard of
Blinkit" cannot be fixed by a card in the cart.

**Explicitly not the target:** users who already cross categories monthly. They are already counted
in the numerator; there is no lift to win there.

---

## 5. Goals and non-goals

### Goals

1. **Raise CER** among Habitual Narrow Repeaters — the share buying from ≥1 new category per month.
2. **Reduce evaluation cost** at the point of consideration, without adding session time.
3. **Never show an unsubstantiated suggestion.** Silence is a first-class outcome.

### Non-goals

| Not doing | Why |
|---|---|
| A discovery/browse tab | 38/40 arrive knowing what they want. There is no audience |
| An "explore new categories" banner | 39/40 already want to. Desire isn't missing |
| Push notification campaigns | Intent already arrives in-app (Blinkit 16 vs Amazon 3). Nothing to recapture |
| Discounts on new categories | Moves first trial, already at 50%. Doesn't move monthly recurrence |
| Changing supply, pricing or logistics | Out of scope; this is an information-flow intervention only |

---

## 6. Success metrics

### Primary

**CER**, treatment vs holdout, quoted always with its six-month lookback.

### Secondary

| Metric | Why |
|---|---|
| New-category trial rate | Mode A's direct output; expected to move first |
| **30-day repeat within a newly-tried category** | The honest success criterion. Trial without repeat is a discount, not exploration |
| Distinct categories per user per month | Slower proxy for breadth-as-moat |
| Card → add-to-cart conversion | Whether the *card* works, separable from whether the *idea* works |

### Guardrails — pre-registered, with kill thresholds

| Guardrail | Kill threshold |
|---|---|
| AOV | any sustained decline |
| Core-category order frequency | **>3% drop** |
| Refund / return rate | any material rise |
| Card dismissal rate | **>60%** |
| Session length at cart review | any material rise |

**If any threshold trips, the feature is removed regardless of CER movement.** Stated in advance
because a metric that only ever justifies shipping is not a measurement plan.

---

## 7. Solution

### 7.1 Where it fires

**Cart review — after the last item is added, before checkout.** The only natural pause in a
fetch-mode session: the task is done, attention is free for a few seconds, and the cart is the
richest available signal about who this shopper is today. Firing earlier competes with the task;
firing at checkout competes with payment.

### 7.2 Two modes

| Mode | Trigger | Serves |
|---|---|---|
| **A — First crossover** | Never bought from category C | **CER** (primary) |
| **B — Second purchase** | Bought C for the first time 14–45 days ago, hasn't returned | **Secondary metric** (30-day repeat) |

**Mode A leads; Mode B takes the last slot.** A Mode B repeat fires inside the six-month lookback by
construction, so it contributes **zero to CER** however well it converts. Mode B stays in the product
because it defends the primary metric's *meaning* — it is what stops CER being satisfied by one-off
trials that never come back — but it is not itself a CER event.

Measured against the seeded shoppers: **35 of 36 row entries would register in CER**, and the single
one that would not is the Mode B card (`mvp/evals/cer-audit.mjs`).

### 7.3 The row

Up to **five** suggestions, each opening a **different** never-bought category.

Deduplicating by *category* rather than by SKU is the entire point: CER counts customers buying from
≥1 new category, so five products from one category is five shots at one target while five categories
is five targets.

**The trade this makes.** The spec originally argued for exactly one option, because comparison time
is the #2 blocker (13/40) and one option leaves nothing to compare. Five reopens that. The blocker is
now **not closed by the layout**; it is mitigated only by each entry carrying its own price anchor,
so the comparison is pre-computed per option. Whether that mitigation suffices is an open empirical
question (§13).

Rows are routinely shorter than five — mean 3.6 across ten seeded shoppers — because a candidate with
no substantiated reason is dropped rather than padded.

---

## 8. Functional requirements

### Hard rules — each asserted in the eval suite, not just in prose

| # | Rule | Enforcement |
|---|---|---|
| R1 | One impression per session; max one per 72 hours | Cadence rule; the row is one impression, not five |
| R2 | Never a category the user already buys (Mode A) | Eval 1 + eval 8 |
| R3 | Only in-stock SKUs from the live catalogue; fail closed to no card | Eval 2 + eval 8 |
| R4 | The reason must be true — no substantiated reason means **no card** | Eval 3 |
| R5 | Never a category the user has **closed** (incumbent supplier, settled distrust) | Eval 7 + eval 10 |
| R6 | Every entry in the row opens a distinct new category | Eval 9 |
| R7 | The row leads with a CER-eligible suggestion | Eval 12 |
| R8 | No new screen; no navigation | Design constraint |

**Every check is mutation-tested** — a rule whose check cannot fail is not evidence. Current state:
**11 pass, 1 reports NOT RUN** (no seeded shopper has thin enough history to exercise it).

### Card anatomy — each line closes a named blocker

| Element | Blocker closed | Survey n |
|---|---|---|
| Reason from the shopper's own history | "not sure it'll suit my need" | 14/40 |
| **Price anchor** — ₹/week vs *their own* comparable spend | "priced higher than usual" / "price feels risky" | 15/40 |
| Trust signal from similar buyers | "don't trust the brand" / "want reviews first" | 26/40 |
| Smallest available pack | "too expensive" / "found cheaper elsewhere" | 20/40 |

**The price anchor is the non-obvious part.** Showing ₹99 is a price. Showing *"~₹65/week · your usual
runs ~₹68/week"* is an anchor — it answers "is this fair?" using the user's own spending as the
reference, which is the comparison they said they don't have time to do manually. **Doing that
computation for them is the feature.**

### Suppression cases — showing nothing is a designed outcome

- Thin history (<2 orders) → no card
- No never-bought category with a substantiated driver → no card
- Category closed by the user → no card, reason logged as `category_closed_by_user:<category>`
- No in-stock trial pack → no card

---

## 9. User flow

```
1  Fetch-mode session      shopper opens the app knowing what they want (38/40)
2  Basket fills            their usual list — the agent does not interrupt the task
3  Cart review             the only natural pause: task done, payment not started
4  Row appears             up to 5, each opening a different never-bought category
5  Add, or dismiss         dismissal is logged as a guardrail, not hidden
```

---

## 10. Technical design

### 10.1 Pipeline — decisions deterministic, model confined to wording

| Step | What it does | Model? |
|---|---|---|
| 1 Eligibility | Mode A / Mode B / neither | **No** — rules, fails closed |
| 2 Profile | Order history → owned categories, cadence, declared signals | **No** |
| 3 Candidates | Never-bought categories, minus any closed | **No** — and this is the only list an LLM may choose from |
| 4 Price anchor | ₹/week for candidate vs their comparable spend | **No** — division |
| 5 Compose | One reason line + one trust line | **Yes** — the only step |

**Mode, category, product and anchor are identical with or without an LLM; only the wording differs.**
Copy is pre-generated in CI where the key lives, and discarded at render if the agent picked
differently than it did at build time — a stored line about a different product would be a false
statement about this shopper.

**A demo that a quota reset can break is not a demo.**

### 10.2 Ranking

| Signal | Weight | Rationale |
|---|---|---|
| Declared lifestyle signal (pet owner, parent, skincare) | 100 | A fact about *this person* |
| Category adjacency | 10 | A fact about a *population* |
| Cheaper trial pack | 0–5 | Lowers the risk 20/40 named |

The brief's three named crossovers are reached by declared signals, not by the adjacency graph, and
eval 12 asserts this **on rank, not membership** — with five slots the goal category still appears
even when signal scoring is gutted.

### 10.3 Known weakness

Measured on the seeded shoppers: **7 of 36 reasons rest on a declared fact about the person; 29 rest
on a population pattern.** The row made this worse — with one card the lead pick was usually the
declared signal; scaling to five filled the extra slots with adjacency, the weakest evidence
available. Copy was rewritten to stop the weak case impersonating the strong one, but that is
mitigation, not a fix. **A shopper who declares no signal has nothing but adjacency.** This is the
ceiling without a richer profile, and it is the next thing to fix — *better signals, not more slots*.

---

## 11. Instrumentation

```
nudge_shown            { user_id, mode: A|B, category, product_id, anchor_favourable, ts }
nudge_dismissed        { user_id, mode, category, ts }
nudge_add_to_cart      { user_id, mode, category, product_id, ts }
new_category_purchased { user_id, category, order_id, first_ever_in_category: bool, ts }
category_repeat        { user_id, category, days_since_first, ts }
nudge_suppressed       { user_id, reason, ts }
```

Two of these carry more weight than they look:

- **`nudge_suppressed`** — the agent declines whenever it can't substantiate a reason. Logging *why*
  tells you whether suppression is working as designed or silently swallowing the audience. **A
  feature that never fires can't fail, and can't succeed either.**
- **`anchor_favourable`** — the price anchor is the central claim. If cards convert only when the
  anchor is favourable, the anchor is doing the work. If conversion is flat across both, it isn't —
  and the core hypothesis is falsified.

---

## 12. Rollout and experiment

| | |
|---|---|
| Design | 90/10 holdout, randomised at **user** level |
| Unit | User — CER is a per-user monthly measure |
| Duration | **Minimum 4 weeks** |
| Segment | Habitual Narrow Repeaters |
| Primary comparison | CER, treatment vs holdout |

**User-level, not session-level:** the metric asks whether a *person* bought a new category this
month. Session randomisation would contaminate both arms.

**Four weeks minimum:** Mode B fires 14–45 days after a first crossover. A two-week test measures
Mode A only.

**Analysis fixed in advance:** one primary metric, no fishing across secondaries; guardrails
evaluated *first*; no mid-flight stopping on a favourable early read; segment cuts exploratory only.

---

## 13. Risks and open questions

| Risk | Mitigation / status |
|---|---|
| Five options reintroduce the #2 blocker (comparison time) | Each entry carries its own pre-computed anchor. **Unresolved empirically** — session length at cart review is a kill guardrail |
| Most reasons rest on population patterns, which the research says users ignore | Copy no longer impersonates personalisation. Real fix needs richer declared signals |
| Trial rises, repeat doesn't | Named as a falsifier. Would mean the feature manufactures one-offs |
| Addressable population smaller than 39/40 implies | Sizing expressed as a formula over segment share, not a headline number |
| Card reads as noise in a 2-minute session | Dismissal >60% is a kill threshold |

### Open questions

1. **Does the price anchor actually do the work?** Testable via `anchor_favourable` in the first run.
2. **Is five the right number?** Chosen for metric coverage, not tested against one or three.
3. **Can declared signals be obtained at scale** without an intrusive onboarding survey?
4. **Does suppression cover too much?** `nudge_suppressed` volume answers this on day one.

---

## 14. Corrections made during the build

Recorded rather than smoothed over, because each changed the product.

| Correction | What was wrong | What changed |
|---|---|---|
| **Mode B priority** | The spec called Mode B "the metric-moving mode". A repeat 14–45 days after first trial sits *inside* CER's six-month lookback and scores zero | Mode A now leads; Mode B takes the last slot and is attributed to the secondary metric |
| **Validation reporting** | Two checks printed PASS over zero observations — grounding measured on an empty set, hold-out compared training data to itself | Both rewritten; checks that can't run now report **NOT RUN** |
| **Generic copy** | The adjacency reason read "most people who do also keep X stocked" — a population claim worn as personalisation, which F3 says is exactly what fails | Rewritten to own being a pattern and end on a checkable fact |
| **Degenerate clustering** | Clustering collapsed to one theme at 100% prevalence and reported success | Merge threshold recalibrated on homogeneity; non-degeneracy asserted in code |

---

## 15. Out of scope / future

1. **Process the remaining corpus.** 2,526 documents are collected but not gated or extracted;
   enrichment is resumable, so this is a re-run, not a rebuild.
2. **Reddit and forum sources.** The collector is implemented and the authenticated path written; a
   CI run returned HTTP 403 on 117 of 117 requests (Reddit blocks datacenter IPs for anonymous
   reads). Needs credentials only.
3. **Richer declared signals** — the single highest-leverage improvement, per §10.3.
4. **Real order histories.** The prototype runs on synthetic data: it demonstrates the mechanism, not
   real-world lift.
5. **Hand-labelled gold set** (~50 documents) to turn the Cohen's κ check from NOT RUN into a number.

---

## 16. Appendix — what is and isn't established

**Established:** the barrier ranking (two independently collected datasets agree on the same top
three); that crossover is event-triggered and non-repeating; that a review corpus structurally cannot
answer questions about behaviour *before* or *across* purchases (Q3, Q4, Q7 score 2.9%–14.8% coverage
while Q2, Q5, Q6, Q8 score 57%–76%).

**Not established:** any lift figure; any "X% of users" claim from n=5; whether the price anchor is
the active ingredient; whether five options is better than one.

**The honest summary:** this project has a falsifiable hypothesis, a defined primary metric, kill
criteria fixed before results exist, and a prototype whose every decision is asserted by tests. It
does not have evidence that the feature works, and does not claim any.
