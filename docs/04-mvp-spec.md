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

## Two modes — and mode B is the one that matters

### Mode A — First crossover
User has never bought from category C. Show one item from C.

### Mode B — Second purchase *(the metric-moving mode)*
User bought from category C for the first time in the last 14–45 days and hasn't returned. Show a
replenishment prompt for C.

**Why B is the priority.** The goal metric is % of MAC buying a new category *every month* — a
recurrence measure. The research found crossover is event-triggered and non-repeating: users cross
once, then revert. Mode A produces the one-off that the metric doesn't reward. Mode B converts it
into the repeat that it does. Mode A exists to create Mode B's inventory.

Priority when both are eligible: **B wins.** Warmer user, higher conversion, direct metric impact.

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

## Hard rules

1. **One card per session. Maximum one per 72 hours.** Dismissal rate is a guardrail metric; this
   feature dies if it becomes noise.
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
2. **Mode B (second-purchase prompt)** ← the metric-moving half; do not skip if avoidable
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
