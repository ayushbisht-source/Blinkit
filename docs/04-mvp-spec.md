# Part 4 — MVP Spec

## The concept: **One Thing**

A single adjacent-category suggestion, fired at cart review, carrying its own evidence.

Not a discovery feed. Not a recommendation rail. Not a browse surface. **One item, one tap, one
screen, with the three pieces of information the research says are missing.**

---

## Why this shape and not something else

Every obvious version of this feature is ruled out by the survey data. Worth stating explicitly,
because the discipline is the design:

| Tempting build | Why the data kills it |
|---|---|
| Better browse/discovery tab | 38/40 arrive knowing exactly what they want. Two people browse. There is no audience. |
| "Explore new categories" banner | 39/40 already *want* to try something new and don't. Desire isn't the missing input. |
| Recommendation carousel | Adds comparison time — the #2 blocker (13/40). More options makes it worse, not better. |
| Push notification campaign | Intent already arrives in-app (Blinkit 16 / Zepto 12 vs Amazon 3). Nothing to recapture. |
| Discount on new categories | Moves first trial, which is already at 50%. Doesn't move monthly recurrence, which is the actual metric. |

What survives: something that appears **inside** an existing 2-minute fetch session, presents
**one** option so there is nothing to compare, and answers *fit / price / trust* before being asked.

---

## Where it fires

**Cart review — after the last item is added, before checkout.**

This is the only natural pause in a fetch-mode session. The user has finished the task they came
for; attention is free for a few seconds; the cart itself is the richest available signal about who
they are today. Firing earlier competes with the task. Firing at checkout competes with payment.

---

## Two modes — and which one serves which metric

### Mode A — First crossover *(the CER mode)*
User has never bought from category C. Show one item from C.

### Mode B — Second purchase *(the secondary-metric mode)*
User bought from category C for the first time in the last 14–45 days and hasn't returned. Show a
replenishment prompt for C.

> **Correction.** An earlier version of this spec called Mode B "the metric-moving mode" and gave it
> priority whenever both were eligible, on the reasoning that the goal measures *monthly recurrence*
> so a repeat is what counts. That is wrong against this project's own metric definition, and the
> error is recorded rather than silently edited out.
>
> CER, from `docs/00-foundation.md`, counts a purchase in month M from a category the user bought
> from in **none of M-1 … M-6**. Mode B fires 14–45 days after a first purchase — squarely inside
> that six-month lookback. **A Mode B repeat therefore scores exactly zero against CER.** For a user
> to count in two consecutive months they need a *different* new category each month, so sustained
> CER comes from a stream of first crossovers, which is Mode A repeated, not Mode A converted.
>
> `mvp/evals/cer-audit.mjs` measures this against the seeded shoppers: 35 of 36 row entries would
> register in CER, and the single one that would not is the Mode B card.

**Mode B is still in the product, and not as a consolation.** `docs/00-foundation.md` lists "30-day
repeat rate within a newly tried category" as a secondary metric with the note *trial without repeat
is a discount, not exploration*. Mode B is what stops CER being satisfied by one-off trials that
never come back — it defends the primary metric's meaning without contributing to its numerator.

**Priority when both are eligible: A wins.** Mode B takes the last slot in the row rather than the
first. The row is ranked by what the goal counts, not by which card converts best — those are
different orderings, and the difference is the whole point of writing the metric down.

---

## The card — and the three facts it must carry

```
┌────────────────────────────────────────────┐
│  You buy dog treats every 2 weeks           │  ← reason, from their own history
│                                             │
│  🐕  Pedigree Chicken Chunks · 400g         │
│      ₹185                                   │
│      ~₹46/week · your treats run ~₹52/week  │  ← price ANCHOR, not just price
│      Most reordered by dog owners near you  │  ← trust signal
│                                             │
│      [ Add ]        [ Not now ]             │
└────────────────────────────────────────────┘
```

Each line maps to a blocker the survey named, in rank order:

| Line | Blocker it closes | Survey evidence |
|---|---|---|
| Reason from own history | "Not sure it'll suit my need" | 14/40 |
| Price anchor vs. their own spend | "Priced higher than my usual" / "price feels risky untested" | 8 + 7 |
| Social proof from similar buyers | "Don't trust the brand/quality" / "want reviews first" | 12 + 14 |
| One option only, no compare view | "Took too long to explore/compare" | 13/40 |
| Smallest available pack | "Too expensive" / "found cheaper elsewhere" | 8 + 12 |

**The price anchor is the non-obvious part.** Showing ₹185 is a price. Showing *"~₹46/week vs. your
usual ₹52/week"* is an anchor — it answers "is this fair?" using the user's own spending as the
reference, which is the comparison they said they don't have time to do manually. Doing that
computation *for* them is the feature.

---

## Amendment — the row of five

The deployed prototype now shows **up to five suggestions in one go**, each opening a *different*
category the shopper has never bought from. This is a deliberate departure from the spec above and
it is recorded here rather than quietly absorbed, because it trades directly against the survey.

**What it buys.** The goal metric counts customers who purchase from at least one new category in a
month. One card is one attempt per session at a binary outcome; five categories are five independent
attempts at the same outcome. Under any per-card acceptance rate the row strictly dominates on the
metric the project is actually judged on. It also makes the brief's three named crossovers reachable
in a single view rather than across five separate sessions.

**What it costs.** The table above rules out a recommendation carousel because comparison time is the
#2 blocker (13/40), and "one option only, no compare view" was the line that closed it. A five-item
row reintroduces exactly that comparison. That blocker is now **not closed by the layout** — it is
mitigated only by each row entry carrying its own price anchor, so the comparison the shopper would
otherwise do manually is still pre-computed for each option. Whether that mitigation is sufficient is
an open empirical question and is not something this project has evidence for either way.

**What did not change.** Every hard rule below applies to every entry in the row, not just the first,
and this is asserted rather than asserted-in-prose: novelty, the closed-category rule, in-stock
grounding, anchor arithmetic and the substantiated-reason rule are each checked across all five
(`mvp/evals/run.mjs`, checks 8–11). Rows are frequently shorter than five — mean 3.6 across the ten
seeded shoppers — because a candidate with no substantiated reason is dropped rather than padded.
Hard rule 4 outranks filling the row.

**The honest summary:** this version optimises harder for the stated metric and gives up part of the
"One Thing" argument to do it. Both halves of that sentence are true.

---

## Hard rules

1. **One card per session. Maximum one per 72 hours.** Dismissal rate is a guardrail metric; this
   feature dies if it becomes noise. *(Amended above: the deployed prototype shows up to five
   distinct new categories in a single row. The 72-hour cadence and the dismissal guardrail are
   unchanged — the row is one impression, not five.)*
2. **Never a category the user has already bought from** (Mode A). Asserted in code and in the eval
   suite — showing a familiar category defeats the entire purpose.
3. **Only in-stock SKUs from the live catalogue.** The agent may not name a product that
   `search_catalogue` didn't return. Validated before render; fails closed to no card.
4. **The reason must be true.** If order history doesn't support a specific reason, show no card
   rather than a generic one. A fabricated reason ("customers like you love this") is exactly the
   noise users already ignore.
5. **No new screen.** If it requires navigation, it has failed constraint F2.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Next.js app (Vercel) — Blinkit-like storefront          │
│  Browse → Cart → [ONE THING card] → Checkout             │
└───────────────┬──────────────────────────────────────────┘
                │ POST /api/suggest  { userId, cartItems }
                ▼
┌──────────────────────────────────────────────────────────┐
│  Suggestion agent (Claude / Gemini)                      │
│                                                          │
│  ① Eligibility     Mode B? Mode A? Neither → no card     │
│                    (deterministic, no LLM — cheap gate)  │
│  ② Profile         order history → owned categories,     │
│                    cadence, life-stage signals           │
│  ③ Adjacency       infer ONE unmet need + candidate      │
│                    category, with a stated rationale     │
│  ④ Rank            relevance × price-fit × in-stock      │
│  ⑤ Anchor          compute ₹/week vs. their comparable   │
│                    basket spend  ← deterministic, not LLM│
│  ⑥ Compose         one sentence reason + trust line      │
│                                                          │
│  Tools: get_order_history · search_catalogue ·           │
│         get_category_meta · get_price_benchmark          │
└───────────────┬──────────────────────────────────────────┘
                ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│ Seeded catalogue + users  │  │ Event log → CER dashboard│
│ (SQLite / Postgres)       │  │ + A/B holdout            │
└───────────────────────────┘  └──────────────────────────┘
```

**Steps ① and ⑤ are deliberately not LLM calls.** Eligibility is a rule, and the price anchor is
arithmetic. Routing them through a model would add latency, cost, and a hallucination surface for
zero benefit. The LLM earns its place only at ③ and ⑥ — inferring the adjacency and phrasing the
reason.

**Stack:** single Next.js app on Vercel (UI + API routes + LLM SDK), SQLite or Neon Postgres, seeded
with ~300 SKUs across 12 categories and ~50 synthetic users carrying 6 months of plausible order
history. One deployable unit, one URL, free tier — least that can go wrong on demo day.

---

## Build order — stop wherever time runs out

1. **Storefront + seeded data + cart + Mode A card** ← minimum viable demo
2. **Mode B (second-purchase prompt)** ← serves the secondary metric, not CER; skip before skipping
   anything above it
3. **Event instrumentation + CER dashboard**
4. **Eval suite**
5. A/B holdout assignment

---

## Evaluation (`mvp/evals/`)

"How do you know the agent is any good?" needs an answer that isn't vibes.

| Check | Target |
|---|---|
| **Novelty** — suggested category is genuinely new to that user | 100%, asserted in code |
| **Grounding** — every SKU exists in catalogue and is in stock | 100%, fails closed |
| **Reason validity** — the stated reason is supported by actual order history | 100%, rule-checked |
| **Anchor accuracy** — ₹/week figures recompute correctly from real data | exact match |
| **Relevance** — precision@1 against 30 hand-labelled user profiles | report honestly |
| Latency / cost per suggestion | report |

The first four are pass/fail correctness, not judgement calls — which is what makes them worth
having. An agent that hallucinates a product or invents a reason is a demo that dies live.

---

## Measurement

- **Primary:** CER (per `docs/00-foundation.md` — 6-month lookback)
- **Secondary:** new-category trial rate · **30-day repeat rate within newly-tried category** ·
  categories per user per month
- **Guardrails:** AOV · core-category order frequency · refund/return rate · **card dismissal rate**
- **Experiment:** 90/10 holdout, minimum 4 weeks (CER is a monthly metric — nothing shorter can
  measure it)
- **Pre-registered kill criterion:** if dismissal rate exceeds 60% or core-category order frequency
  drops more than 3%, the feature is removed regardless of CER movement. Stated in advance so the
  decision isn't relitigated after seeing the result.
