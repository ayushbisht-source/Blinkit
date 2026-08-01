# Part 2 — Primary Research

## What was actually collected

| Instrument | n | Status |
|---|---|---|
| Screener-matched survey (Google Forms) | **40** | Collected 28–29 Jul 2026. Real respondents. |
| Depth interviews (async, text) | **2** | Collected 1 Aug 2026. Real respondents. Target is 5–6 — see §5 and §8. |
| AI-synthesized personas | 5 | Generated from survey rows. **Not interviews.** See §6. |

Everything in §1–§4 is derived from the 40 real survey responses. Nothing there is reconstructed,
voiced, or inferred dialogue.

> ### On the interviews
>
> The brief asks for 5–6 depth interviews. **Two** have been conducted at the time of writing, both
> real, both async over text, both recorded verbatim in `research/transcripts/`. That is short of
> the brief and this document does not present it as anything else.
>
> Two things follow, and they point in opposite directions.
>
> **First, the shortfall is real.** n=2 supports quoting and pattern-noticing. It does not support
> generalisation, and §8 makes no claim that requires it.
>
> **Second, the two interviews already did the one thing the survey and the personas structurally
> could not: they surfaced a barrier that was not on the form.** Both respondents named a category
> they had never bought and gave the same reason — the category does not apply to them. There is no
> code for that in the engine's `barrier[]` enum, and no option for it on the survey. Two of two
> hit it. See §8.
>
> §6 and §7 then test the obvious substitute for interviews — personas generated from the survey —
> and find that of five hypotheses they produced, one was testable and it was **wrong**. Read
> together with §8, the comparison is the point: the synthetic method produced fluent claims that
> failed under test, and two real conversations produced a finding neither the survey nor the
> engine could have reached. That is the brief's *"AI-generated insights are only a starting point"*
> demonstrated on this project's own data rather than asserted.

---

## 1. Headline findings (n=40)

| Dimension | Result |
|---|---|
| App used most | Blinkit 21 · Zepto 13 · Instamart 4 · Flipkart Minutes 2 |
| Why that app | Fast delivery 25 · Wide range 7 · Offers 7 |
| Categories bought | Snacks 36 · Groceries 33 · Personal care 17 · Fruit & veg 15 · Household 15 · **Baby 3 · Pet 2** |
| Browse vs. know | Always know exactly 22 · Mostly know 16 · Depends 2 |
| Wanted to try something new but didn't | Sometimes 23 · Yes/often 12 · Rarely 4 · Never 1 |
| What held them back | Quality/taste uncertainty 14 · Took too long to compare 13 · Priced higher than usual 8 · Forgot once cart-filling 3 |
| Bought a new category in last 3 months | **Yes 20 · No 20** |
| If no — what stopped them | Habit 15 · Not sure it'd suit need 14 · Want reviews/comparison first 14 · Don't trust brand 12 · Price feels risky 7 |
| Where they go for something new | Blinkit 16 · Zepto 12 · Instamart 8 · D-Mart 8 · Kirana 6 · **Amazon 3** |
| Last near-miss — why they backed out | Didn't really need it 13 · Found cheaper elsewhere 12 · Too expensive 8 · Got distracted 6 |

---

## 2. The four findings that actually constrain the MVP

Not everything above matters equally. These four change what gets built.

### F1 — Willingness is not the constraint. **39/40 have felt the pull and not acted.**
Only one respondent said "never." The other 39 have wanted to try something new at least sometimes
and didn't. Any solution premised on *creating desire* is solving a problem the data says isn't
there. The gap is between intent and action, not before intent.

### F2 — **38/40 arrive knowing what they want.** The app is a fetch tool, not a browse tool.
"Always know exactly" (22) plus "mostly know" (16) is 95% of the sample. Two people browse. This
kills the obvious solution: a better discovery/browse surface has almost no audience, because
almost nobody is in a browsing mode when the app is open. Whatever the MVP does, it has to work
*inside* a fetch-mode session lasting a couple of minutes.

### F3 — The blockers are **information gaps at the moment of consideration**, not awareness gaps.
Ranked: quality/taste uncertainty (14), comparison takes too long (13), price higher than usual (8).
And among non-crossers: not sure it'd suit their need (14), want reviews first (14), don't trust the
brand (12). Nobody's top answer is "I didn't know they sold it." They know. They can't *evaluate*
it fast enough to justify the risk. That is an ability problem (Fogg), not a motivation or
awareness problem — and it names exactly which information has to be supplied: fitness-for-need,
a price anchor, and a trust signal.

### F4 — **The consideration set is already the app.** Blinkit 16 / Zepto 12 / Instamart 8 vs Amazon 3.
When they want something new, they think of quick commerce first. They just don't complete. This is
the most encouraging number in the dataset: the intervention doesn't have to win attention away
from a competitor, it has to convert an intent that is already landing in the right place.

---

## 3. The reframe that follows

The 20/20 split on "bought a new category in the last 3 months" is the number the whole strategy
turns on. Half the sample **already crossed over** — so the goal is not "get people to try a new
category once."

Cross-referencing the crossers against their own stated barriers shows their reasons for not trying
*more* are near-identical to the non-crossers' reasons for not trying at all (habit, fit
uncertainty, wanting reviews). If crossing over had built confidence, those reasons should have
softened. They didn't.

**Therefore: crossover is event-triggered and non-repeating.** Something external creates a need
(ran out, a discount, a life event), the user buys once, and reverts to their list. The category
doesn't get added to the routine.

This reframes the goal metric. Blinkit's target is % of MAC buying a new category **every month** —
a recurrence metric. One-off trial doesn't move it. Two implications:

1. Targeting non-crossers with "try something new" is the harder half of the problem *and* the
   lower-value half. The 20 who already crossed are warmer, and the metric rewards their repeat.
2. The window that matters is **immediately after a first cross-category purchase**, before the
   user reverts. That's a moment the platform can detect precisely.

---

## 4. What this means for the MVP (design constraints, not features)

| From | Constraint |
|---|---|
| F2 | Must work in a ~2-minute fetch-mode session. Cannot require browsing, scrolling a new surface, or a separate discovery journey. |
| F3 | Must supply three specific things at the point of consideration: *will this suit my need*, *is this price fair vs. what I normally pay*, *can I trust it*. Generic recommendations supply none of these. |
| F3 | Must not add comparison time — 13/40 named that as the blocker. If the nudge makes the session longer, it fails on its own terms. |
| F4 | Does not need to fight for attention. Intent already arrives in-app. |
| §3 | Should prioritise **second purchase in a newly-tried category** over first trial. That's what the monthly metric actually measures. |
| Backing-out data | "Didn't really need it" (13) is the top reason people abandon — so relevance-to-actual-need beats novelty. Price sensitivity (20 combined across "cheaper elsewhere" + "too expensive") means trial must be low-stakes in rupees. |

---

## 5. Limitations — stated plainly

1. **Only 2 depth interviews were conducted, against a target of 5–6.** Consequence: §1–§4 rest
   entirely on the survey, which can confirm *what* and *how many* but cannot explain *why* in the
   respondent's own words. Every finding in §1–§4 is bounded by the questions asked. §8 is bounded
   by n=2 and is written as pattern-noticing, not measurement — the same finding appearing in both
   interviews is recorded as worth checking, never as a rate.

2. **The survey shares the discovery engine's vocabulary by design.** Barrier options were written
   from the engine's `barrier[]` enum so the two datasets compare directly. The cost is that the
   survey is structurally poor at *challenging* the engine — it can only confirm categories that
   were already hypothesised. A genuine challenge to the AI findings would require open-ended
   primary research.

3. **n=40, convenience sample**, skewed to the researcher's network: young, metro, English-literate.
   Baby (3) and pet (2) owners are too thin to support any claim about those segments.

4. **Q9 free-text was optional** and lightly answered, so the one channel that could have surfaced
   an unanticipated barrier is under-powered.

5. **Conditional-logic leakage:** a few respondents answered the "if no, what stopped you" branch
   despite answering "yes". Those rows were re-derived from the Yes/No column rather than the branch
   answer.

---

## 6. AI-synthesized personas — a labeled method, not a substitute for interviews

Alongside the survey, six **AI-synthesized respondent personas** were generated. Each is anchored to
one real survey row — that respondent's app, order mix, stated blockers, household type and
near-miss reason are taken directly from their answers — with an LLM writing first-person narrative
around those fixed data points.

**This is stated openly because the distinction decides whether the artifact is useful or
disqualifying.** These are not interviews. No person said these words. They are a probe for
generating hypotheses from structured data, and they are reported as such.

### Why include them at all

The project's premise is an AI-native research workflow. Synthetic personas are a real and current
technique in that space, and testing where they help and where they mislead is itself a finding
worth reporting — arguably more interesting than the personas' content.

### Rules applied

1. No persona is quoted as evidence for any claim in Part 3.
2. No persona-derived hypothesis is treated as validated unless independently checkable against the
   40 real responses.
3. Personas are never described as interviews, participants, or respondents in any deliverable.
4. The files are retained as method artifacts with their "not interviews" headers intact
   (`research/synthetic-personas.md`).

---

## 7. Testing the personas — the finding

Generating personas is not interesting. **Testing them is.** Each of the five produced a hypothesis;
each was assessed for whether the real data could check it.

| # | Hypothesis generated | Testable? | Result |
|---|---|---|---|
| P1 | Category breadth reflects **order consolidation** — infrequent users bundle, so low-frequency users should show *more* categories | **Yes** | **WRONG** (below) |
| P2 | Barriers are **category-specific, not user-specific** — one person carries different blockers for different categories | No | Survey records barriers per respondent, not per category. Unfalsifiable with this instrument. |
| P3 | Users don't *experience* need-driven purchases as exploration, so "never explores" and "did cross over" aren't contradictory | No | Requires asking about perception. Not asked. |
| P4 | Intent is lost **during** the session, not before it | Partly | 3/40 selected "forgot once I started adding regular items" — consistent, but far too thin to support the claim. |
| P5 | Quick commerce occupies an **"urgency" mental slot**; considered purchases route elsewhere | No | Would need to know what respondents bought elsewhere and why. Not captured. |

### The one testable hypothesis, tested

P1 predicts a **negative** relationship between order frequency and category count. Computed from
the raw rows (`research/verify_personas.py`):

| Order frequency | n | Mean categories |
|---|---:|---:|
| 1–2 / month | 8 | 2.75 |
| 3–5 / month | 11 | 2.64 |
| 6–10 / month | 9 | 3.22 |
| 10+ / month | 12 | 3.42 |

**Pearson r = +0.25.** The relationship is weakly *positive* — the opposite of the prediction.
Heavier users have slightly broader baskets. At n=40 an r of this size is suggestive at best, so the
honest reading is that consolidation is not what produces breadth here and the effect is too weak to
claim more.

**Score: 1 of 5 hypotheses testable. That one was wrong.**

### Why this is the finding, not an excuse

The personas read convincingly. They produced specific, plausible, mechanism-shaped claims in
confident language. And under test, the only one that could be checked failed.

> **A persona generated from survey responses cannot contain information the survey did not capture.
> It recombines and articulates — fluently enough to feel like insight — but it cannot surprise, and
> it has no mechanism for being right about anything outside its input.**

This is what the brief means by *"AI-generated insights are only a starting point"*, demonstrated
rather than asserted. It is also precisely the capability Part 3 needs and does not have: the ability
to surface a barrier nobody thought to put on the form. A real person answering *"anything I've
completely missed?"* can do that. A persona built from a fixed-option survey structurally cannot —
its entire vocabulary is the survey's vocabulary.

### One more instance, from this project's own workings

The results table above was **wrong when first written.** Its counts and means were generated
alongside the personas rather than computed, and differed materially from the real figures. The
directional conclusion survived; the numbers did not. It was caught by writing a script to recompute
them.

That happened inside a document arguing that plausible-sounding output is not evidence. It is left
in the record rather than quietly corrected, because it is the same failure mode in miniature — and
because a project about validating AI output should show its own validation failing at least once.

---

## 8. Depth interviews (n=2) — what real conversations added

Two async text interviews, 1 Aug 2026, five open questions each
(`research/async-interview-kit.md`). Verbatim transcripts with coding and analyst notes:
`research/transcripts/P01.md`, `P02.md`. No names; P01/P02 only.

Async text rather than calls is a deliberate tradeoff and a stated weakness: answers are short and
there is no live probe. What it buys is that the questions are **open**, so an answer can land
outside the vocabulary of the instrument. That is exactly what happened.

### The finding: the engine has no code for "this category is not for me"

Both respondents, unprompted and on different apps (P01 Blinkit, P02 Zepto), named the same
never-bought category and gave the same reason.

> **P01:** *"Pet supplies, baby care never bought. I don't have kids and pets so never bought it and
> also if I have in future I would love to try."*
>
> **P02:** *"Baby care never bought because I don't have kids and in future I can try."*

Neither answered the second half of the question — *where do you buy that instead?* — because the
premise doesn't hold. Nobody is buying it anywhere.

The engine's `barrier[]` enum has eight values (`awareness`, `trust_quality`, `price_risk`,
`choice_overload`, `no_trigger`, `size_uncertainty`, `return_anxiety`, `channel_loyalty`) and the
survey's blocker options were written from that same list (§5, limitation 2). **Every one of them
presumes latent demand that something is obstructing.** There is no code for a category that is
simply irrelevant to the respondent. Forced to choose, both of these people would have been recorded
as blocked by something, and the resulting number would overstate addressable demand.

Why neither of the other two methods could find this:

| Method | Why it misses it |
|---|---|
| Discovery engine (3,372 reviews) | Nobody writes a review about a product they have no reason to buy. Absence of need leaves no text. |
| Survey (n=40) | Closed options, all drawn from the same enum. A respondent in this position has no honest box to tick. |
| Synthetic personas | Vocabulary is the survey's vocabulary (§7). Cannot produce a category that isn't in its input. |

Note the tail of both answers: *"in future I would love to try"* / *"in future I can try."* The
category is not rejected, it is **dormant pending a life event**. For the MVP that is a suppression
rule, not a conversion opportunity — a baby-care card shown to either respondent is a wasted
impression, and dismissal rate is a pre-registered guardrail (`docs/03-problem-definition.md` §5).

### A second gap, same shape

Both respondents' stated reason for opening the app at all was the **absence of an alternative**:

> **P01:** *"I'm at my hometown and only Blinkit is available there as of now."*
>
> **P02:** *"it's late night and it is available on zepto"* · *"no shop around me that time"*

The `HabitDriver` enum's six values all describe a *preference between available options*
(`time_pressure`, `trust`, `satisficing`, `list_reuse`, `price_certainty`, `household_routine`).
Access-of-last-resort is not among them. If it is common, it describes a session where the user has
no alternative and no browsing intent — the worst moment to surface a new category and, plausibly, a
frequent one. Recorded as a hypothesis to check against extraction output, not as a finding.

### What the interviews confirmed

| Claim | P01 | P02 |
|---|---|---|
| Users arrive knowing what they want (F2) | Confirmed | Confirmed |
| Crossover is event-triggered, not curiosity-driven (§3) | Confirmed — refined oil, *"needed that very urgent"* | Confirmed — liquid detergent, *"urgent for me and no shop around me"* |
| Information needed first is quality and price (F3) | Confirmed — *"quality and quantity also of course pricing"* | Confirmed — *"pricing… and quality as well"* |
| Price is what triggers a crossover | — | **Challenged** — price named third, after urgency and absence of alternatives |

Both named price and quality unprompted; neither mentioned delivery speed, returns, or brand.

### What they disagreed about

The only direct contradiction between the two respondents is shopping rhythm:

- **P01:** *"I don't shop everyday, I shop when I needed the products."*
- **P02:** *"I shop mostly regularly because it's very easy to shop on app."*

This matters because the root cause in `docs/03-problem-definition.md` §2 rests on a two-minute
fetch session. P02's other answers — a single late-night item, one urgent detergent — read as
fetch behaviour at high frequency, which is the segment definition in `docs/00-foundation.md`
(frequent *and* narrow) rather than a counterexample. But that reconciliation is **inference from
their other answers, not something P02 said**, and it is recorded as a partial challenge in
`research/transcripts/P02.md` for that reason. If a later respondent describes actually browsing,
the fetch-mode model is in trouble and Part 3 needs rewriting.

### Status

3 of the target 5–6 interviews remain outstanding. The transcripts are committed as they arrive and
this section is updated with them; the confirm/challenge matrix in
`docs/03-problem-definition.md` §6 is rebuilt at each addition.

---

The analysis in §1–§4 is drawn from the 40 real survey responses only. §8 is drawn from 2 real
interviews and is labelled n=2 throughout.
