# Part 2 — Primary Research

## What was actually collected

| Instrument | n | Status |
|---|---|---|
| Screener-matched survey (Google Forms) | **40** | Collected 28–29 Jul 2026. Real respondents. |
| Depth interviews (async, text) | **5** | Collected 1–2 Aug 2026. Real respondents. Meets the brief's minimum of 5–6 — see §8. |
| AI-synthesized personas | 5 | Generated from survey rows. **Not interviews.** See §6. |

Everything in §1–§4 is derived from the 40 real survey responses. Nothing there is reconstructed,
voiced, or inferred dialogue.

> ### On the interviews
>
> The brief asks for 5–6 depth interviews. **Five** were conducted — all real, all async over text,
> all recorded verbatim in `research/transcripts/` as P01–P05, across three platforms (Blinkit,
> Zepto, Flipkart Minutes).
>
> **The fourth interview was recruited to test a stated weakness, and it did.** At n=3 this document
> named its own confound: every respondent was a non-parent, two had named baby care as a category
> that did not apply to them, and the finding might have been a property of who was available to ask.
> P04 is a parent of a newborn. Baby care is not irrelevant to them — they buy it, on a
> quick-commerce app. The earlier finding survives in the right way (irrelevance tracks *life
> stage*, not the question's wording) and narrows in the right way: the pattern is **3 of 5**, not
> the 3 of 3 the n=3 write-up reported. See §8.1.
>
> **What five conversations produced that no other instrument could.** Three respondents named a
> never-bought category and explained it as *irrelevance* rather than obstruction, which no
> `barrier[]` value can encode. Three described using the app only because nothing else was open,
> which no `HabitDriver` value can encode. One described organising their basket around a
> free-delivery threshold — and that one the engine **did** collect, 133 documents of it, with
> nowhere to put a single one. Two described barriers that **no information can close at all**,
> which is a challenge to Part 3's root cause rather than to the vocabulary (§8.4).
>
> §6 and §7 test the obvious substitute for interviews — personas generated from the survey — and
> find that of five hypotheses they produced, one was testable and it was **wrong**. Read against
> §8, that is the whole argument: the synthetic method produced fluent claims that failed under
> test, while five real conversations produced findings the survey, the personas, and 3,372 mined
> documents could not. The brief's *"AI-generated insights are only a starting point"*, demonstrated
> on this project's own data rather than asserted.

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

1. **5 depth interviews, meeting the brief's minimum but no more.** §1–§4 rest entirely on the
   survey, which can confirm *what* and *how many* but cannot explain *why* in the respondent's own
   words. §8 is bounded by n=5 and is written as pattern-noticing, not measurement — a finding
   appearing in four of five is recorded as worth checking, never as a rate. Recruitment is
   convenience-sampled; §8.7 states what that leaves unresolved, and what P04 resolved.

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

## 8. Depth interviews (n=5) — what real conversations added

Five async text interviews, 1–2 Aug 2026, five open questions each
(`research/async-interview-kit.md`). Verbatim transcripts with coding and analyst notes in
`research/transcripts/`, P01–P05. No names. Three platforms: Blinkit, Zepto, Flipkart Minutes.

Async text rather than calls is a deliberate tradeoff and a stated weakness: answers are short and
there is no live probe (§8.6 gives the case where that cost something concrete). What it buys is
that the questions are **open**, so an answer can land outside the vocabulary of the instrument.
That is what happened three times.

**Two headlines, and the second only became visible at n=5.**

**One — the vocabulary is incomplete.** Three gaps, described in §8.1–§8.3. Two of them the engine
is structurally blind to; the third it collected 133 documents of and has no field to store.

**Two — for some users no vocabulary would help, because the barrier is not informational at all.**
P04's grocery block lifts only if they move house or the kirana next door shuts. P05 abandoned
vegetables permanently after one bad delivery and says *"I will never buy."* Neither is short of
information. This is a challenge to Part 3's root cause rather than to the schema, it is 2 of 5, and
it did not appear in the first three interviews at all (§8.4).

### 8.1 First gap — no code for "this category is not for me"

Three of five respondents, unprompted, across two different apps, named a never-bought category and
explained it as an **absence of need** rather than an obstruction.

> **P01:** *"Pet supplies, baby care never bought. I don't have kids and pets so never bought it and
> also if I have in future I would love to try."*
>
> **P02:** *"Baby care never bought because I don't have kids and in future I can try."*
>
> **P03:** *"Home appliance, because I live alone and I live in full furnished so nothing to do with
> it."*

None of the three answered the second half of the question — *where do you buy that instead?* —
because the premise doesn't hold. Nobody is buying it anywhere.

**This finding was explicitly at risk of being an artifact, and the risk was tested.** At n=3 every
respondent was a non-parent and two had named baby care, so the obvious objection was that the
pattern described the sample rather than the instrument. P04 is a parent of a newborn. Baby care is
not irrelevant to them at all — Pampers appears in both their last order and their last new-category
purchase.

That is the right result in both directions. The finding **survives**: "this category does not apply
to me" tracks the respondent's *life stage*, exactly as claimed, and a parent asked the same question
gives a different answer. And it **narrows**: at 3 of 5 rather than 3 of 3, it is no longer every
respondent, and any claim resting on universality has come down accordingly. P04 and P05 both gave
genuine barriers — `channel_loyalty` and `trust_quality` respectively — which the enum holds
cleanly.

The engine's `barrier[]` enum has eight values (`awareness`, `trust_quality`, `price_risk`,
`choice_overload`, `no_trigger`, `size_uncertainty`, `return_anxiety`, `channel_loyalty`) and the
survey's blocker options were written from that same list (§5, limitation 2). **Every one of them
presumes latent demand that something is obstructing.** There is no code for a category that is
simply irrelevant. Forced onto the closed list, those three respondents would have been recorded as
blocked, and the resulting number would overstate addressable demand.

Why none of the other three methods could find it:

| Method | Why it misses it |
|---|---|
| Discovery engine (3,372 reviews) | Nobody writes a review about a product they have no reason to buy. Absence of need leaves no text. |
| Survey (n=40) | Closed options, all drawn from the same enum. A respondent in this position has no honest box to tick. |
| Synthetic personas | Vocabulary is the survey's vocabulary (§7). Cannot produce a category that isn't in its input. |

Note the tail of all three answers: *"in future I would love to try"* (P01), *"in future I can try"*
(P02), *"when i have my own house I would love to buy"* (P03). The category is not rejected, it is
**dormant pending a life event** — and P05 is that life event happening. P03 never bought home
appliances because they live alone in furnished accommodation; P05 bought home appliances *"as we
shifted to our new home."* Same category, opposite outcomes, and the difference is entirely life
stage rather than anything the app controls. For the MVP that is a suppression rule, not a conversion
opportunity — such a card is a wasted impression, and dismissal rate is a pre-registered guardrail
(`docs/03-problem-definition.md` §5).

### 8.2 Second gap — access of last resort

Three of five respondents' stated reason for opening the app at all was the **absence of an
alternative**:

> **P01:** *"I'm at my hometown and only Blinkit is available there as of now."*
>
> **P02:** *"it's late night and it is available on zepto"* · *"no shop around me that time"*
>
> **P04:** *"it's midnight all shops closed and we need that urgent for our baby"*

The `HabitDriver` enum's six values all describe a *preference between available options*
(`time_pressure`, `trust`, `satisficing`, `list_reuse`, `price_certainty`, `household_routine`).
Access-of-last-resort is not among them. If common, it describes a session where the user has no
alternative and no browsing intent — the worst moment to surface a new category and, plausibly, a
frequent one. P03 does **not** replicate it (their trigger was a price advantage), so this stands at
3 of 5 and is recorded as a hypothesis to check against extraction output, not as a finding.

P04's is the strongest instance: midnight, every shop shut, and an infant's need that cannot be
deferred to morning. It is also the case where the app is most obviously doing something valuable —
and simultaneously the worst possible moment to ask someone to consider an unfamiliar category.

### 8.3 Third gap — basket economics, and the one the engine can actually see

P03 volunteered something no other respondent, the survey, or the corpus vocabulary has:

> *"the problem is we need to buy atleast minimum rs product like 150 or 200 rs of products for not
> to charge delivery fees too so I never bought home appliance"*

**The stated mechanism is ambiguous** — a minimum-order threshold should push a basket *up*, and a
home appliance clears ₹200 easily. The reading recorded in `research/transcripts/P03.md` §2 is
**basket-shape mismatch**: the user has internalised what the app is *for* — assembling ₹150–200 of
small top-up items — and a category outside that shape never enters consideration. That is
explicitly flagged as interpretation, not as something P03 said.

What is *not* ambiguous is that the concept has no home in the schema. And unlike the first two
gaps, this one **leaves text**, so it can be checked against the corpus rather than argued.
Recomputed by `research/check_basket_economics.py`:

| | n |
|---|---:|
| Documents using minimum-order / delivery-fee / free-delivery-threshold language | **133** of 3,372 |
| — kept as relevant by the gate | 69 |
| — rejected by the gate | 64 (38 `delivery`, 10 `unrelated`, 9 `support`, 5 `technical`, 2 `contentless`) |
| Narrower: language describing a **threshold shaping the basket** | **63** |
| — kept as relevant | 39 |

Two separate problems:

**(a) The relevance gate discarded some of it.** Its instruction excludes "pure delivery-speed…
complaints," and a fee complaint reads like one:

> *"the app is good but there is one problem that it is not free delivery tell me not at the items
> still 199 but there should be rs 100 that would be more suitable"* — rejected as `delivery`

**(b) The ones it kept have nowhere to land — and this was checked, not assumed.** No `barrier[]`
value describes basket economics. `price_risk` means *"unsure if the price is fair"* — a different
claim; these users know exactly what the fee is and are organising their basket around it.

The prediction written into `research/transcripts/P03.md` before extraction finished was that the
signal would be forced into `price_risk` or lost. **Extraction has since completed on all 971
relevant documents, and it did both.** The threshold statements formed a theme of their own —
**THM-05, 34 statements, 5.4%**, labelled `free / minimum / threshold / value` — whose dominant
barrier code is `price_risk`. Its representative quotes leave no doubt what these users are actually
describing:

> *"Before it serves free delivery on 100₹ , And now 😡😡 400₹"* ·
> *"sudden increase in free delivery from ₹99 to ₹399 is unreasonable"* ·
> *"delivery charge threshold should be at 100 rs not 130"*

Nobody there is unsure whether a price is fair. They are re-planning a basket around a line that
moved. The engine found the theme and then mislabelled it, because the label it needed does not
exist — a prediction from one interview, tested against 631 machine-extracted statements, and held.

The clearest instance the gate correctly kept:

> *"this scammer app.. when I adding 20/- item showing free delivery on above 150rs when I adding
> 180/- more item it's showing free delivery above 299/- and showing fake line"*

A user watching the threshold move as the basket grows, and adjusting to it. Nothing in
`engine/schema.py` can represent that.

**This gap differs in kind from the first two, and that difference is the methodological point.**
Irrelevance and access-of-last-resort leave no text at all — the engine is structurally blind to
them. Basket economics leaves plenty; the engine ingested 133 documents of it. The failure there is
not collection, it is **taxonomy**: the vocabulary was written before anyone asked a user an open
question, and scale cannot repair a category scheme that is missing a category.

### 8.4 The finding that only appeared at n=5 — barriers no information can close

The first three interviews all described barriers that were, in principle, *addressable*: tell me
about quality, show me a price benchmark, help me judge quantity. Part 3's root cause is built on
that — the binding constraint is Fogg **ability**, the user cannot evaluate an unfamiliar category
fast enough, so supplying the missing reference point unlocks it.

**Two of the last two respondents describe barriers where that is simply not true.**

> **P04, asked what would have to be true to buy groceries on the app:** *"Maybe when we shift to
> our new home or maybe when the kirana store which is near to our home will close permanently."*

The question asks for information or evidence. The answer contains none — both unblocking conditions
are structural changes to their circumstances. P04 has a working supplier they have used *"like from
ages"*. No price anchor or freshness signal touches that.

> **P05, same question, about vegetables:** *"I will never buy from blinkit my trust issues for
> vegetables is still there."*

P05 rejects the premise outright. The cause is one bad delivery — *"one time I got really bad
vegetables"* — and the belief is now settled. **They are not short of information; they have
information.** They tried it, it was bad, and they updated. No badge reopens that.

**Why this matters more than the vocabulary gaps.** §8.1–§8.3 say the schema is missing labels,
which is fixable by adding labels. This says the *model of the problem* is incomplete: it covers
users who would try if evaluation were cheaper, and says nothing about users with an incumbent
supplier or a settled negative belief. Those users would be shown an MVP card and correctly ignore
it. At 2 of 5 that is not a rate, but it is enough that `docs/03-problem-definition.md` should stop
implying the ability constraint covers everyone — and it now does not.

**P05 also completes a finding the engine could only half-make.** The corpus's largest themes are
exactly this: THM-01 (72 statements, spoiled milk and expiry), THM-02 (51) and THM-04 (42), produce
and quality failures. The engine established that these complaints dominate. It could not establish
what the reviewer *does next*, because reviews are cross-sectional — one moment, one person, no
follow-up. P05 supplies the consequence: **the category is abandoned permanently, from a single
incident.** 3,372 documents give the prevalence; one interview gives the mechanism.

### 8.5 What the interviews confirmed

**5 of 5 on event-triggered crossover**, and the triggers span the full set
`docs/03-problem-definition.md` §5 predicted — ran out, a discount, a life event:

| # | Last new-category purchase | Trigger |
|---|---|---|
| P01 | Refined oil | Ran out — *"I needed that very urgent that time"* |
| P02 | Liquid detergent | Urgency + no shop nearby |
| P03 | Sipper | Life event — *"i joined gym and i don't have sipper"* |
| P04 | Pampers | Urgency + total unavailability — *"it's midnight all shops closed"* |
| P05 | Home appliance | Life event — *"as we shifted to our new home"* |

Not one respondent described trying something because it looked interesting. Five for five, three
platforms, five different triggers.

| Claim | Result across P01–P05 |
|---|---|
| Users arrive knowing what they want (F2) | **5 of 5 confirmed.** Nobody described browsing. |
| Crossover is event-triggered, not curiosity-driven (§3) | **5 of 5 confirmed** (table above) |
| Information needed first is quality and price (F3) | **3 of 5 confirmed** — P01, P02, P03 named quality unprompted. P04 and P05 named *no* information requirement at all, which is §8.4's finding, not a weaker confirmation. |
| Price is what triggers a crossover | **Challenged, 4 of 5.** Price co-occurs with the trigger without being it — P02 named it third, P04's midnight order was need-forced, P05's followed a house move. P03 is the sole exception: a ₹200 discount with no event. |
| `channel_loyalty` describes real behaviour | **Confirmed** — P04's kirana, *"we are buying from there like from ages"*. First clean single-code fit in the study. |
| `trust_quality` is the dominant barrier (engine 45.3%) | **Confirmed with a mechanism** — P05 abandoned vegetables permanently after one bad delivery |

### 8.6 What they disagreed about

**Shopping rhythm — one respondent against three:**

- **P01:** *"I don't shop everyday, I shop when I needed the products."*
- **P02:** *"I shop mostly regularly because it's very easy to shop on app."*
- **P03:** *"I shop regularly from these quick commerce so nothing left."*
- **P05:** *"I shop mostly regularly from these apps."*
- **P04:** *"I shop simply"* — declined to elaborate, coded neither way.

This matters because the root cause in `docs/03-problem-definition.md` §2 rests on a two-minute
fetch session. In `research/transcripts/P02.md` the prediction was recorded that a respondent
describing *actual browsing* would put that model in trouble. **P03 did not.** Their two described
purchases are a decided adapter and an urgent sipper — single-item, product known before the app
opened. Three respondents now self-describe as "regular" while describing pure fetch behaviour, so
frequent-and-narrow — the segment definition in `docs/00-foundation.md` — reads as the better
explanation than a contradiction.

**The standing prediction survived all five interviews: nobody described browsing.** It was written
down at n=2, before P03, P04 and P05 existed, and it would have been overturned by a single
respondent describing genuine exploration. None did. That is the strongest support F2 has outside
the survey itself.

**Price's role — settled enough to state.** Four of five respondents mention price as a co-factor
alongside the real trigger, never as the trigger: P02 named it third after urgency; P04's midnight
Pampers order was need-forced (though their *previous* order was discount-led); P05's home
appliances followed a house move. P03 is the sole clean counterexample — a ₹200 cross-platform
discount with no event at all. **The honest reading is that events open categories and price closes
purchases**, with P03 showing a large enough discount can do both.

### 8.7 What the async method cost

P03's basket-economics answer is the concrete case. A live interview would have asked *"what do you
mean the minimum stops you — wouldn't an appliance be over ₹200 anyway?"* and settled the mechanism
in one exchange. Async text could not, so the most novel finding in the study is recorded with its
mechanism ambiguous. That is the tradeoff named at the top of this section, priced.

### 8.8 What n=5 supports, and what it does not

**Five interviews, meeting the brief's minimum of 5–6.** Recruitment was convenience-sampled and
async over text, and both facts bound what follows.

**What n=5 supports.**

- **The taxonomy is incomplete.** This is a claim about the *instrument*, not the population, and it
  does not need a representative sample: one respondent whose honest answer has no valid code is
  sufficient. There are three for irrelevance (§8.1), three for access-of-last-resort (§8.2), and
  one for basket economics (§8.3) with 133 corpus documents behind it.
- **The root-cause model does not cover everyone** (§8.4). Two respondents have barriers no
  information closes. One counterexample would be arguable; two, arriving independently and for
  different reasons, is enough to require the caveat that Part 3 now carries.
- **Direction of the irrelevance finding.** P04 was recruited specifically because every earlier
  respondent was a non-parent, and a parent gives a different answer to the same question. That is a
  test the finding could have failed and didn't.
- **Fetch mode, strongly.** 5 of 5 arrived knowing what they wanted. The prediction that one
  browsing respondent would overturn the model was written at n=2 and survived three more
  interviews.

**What n=5 does not support.** Any statement of the form "X% of users". None is made, and nothing
downstream depends on one. Specifically open:

- *How common* irrelevance is as a reason for non-purchase. Needs a survey instrument that offers
  the option — which the current one does not, by construction (§5, limitation 2).
- *How common* the permanent-abandonment mechanism is. P05 shows it exists; measuring it is a
  platform-data question — repeat-purchase rate in a category following a complaint or refund — not
  an interview question.
- Whether `channel_loyalty` blocks groceries broadly or reflects P04 having a kirana next door,
  which is common in India but not universal.

**Remaining confounds, stated.** Three of five respondents live in households without children;
recruitment was through the researcher's network, so the sample skews young, urban and
English-literate in the same direction as the survey. The interviews correct the survey's *vocabulary*
but inherit its *sampling*.

**What was deliberately not done.** No interview was fabricated, and no synthetic persona is counted
toward the interview total. §6 and §7 exist because generating plausible respondents from the survey
was the obvious shortcut, and testing that shortcut produced the clearest methodological result
here: of five persona-generated hypotheses, one was testable and it was wrong. Adding invented
transcripts to a document making that argument would have destroyed the argument along with the
evidence base.

---

The analysis in §1–§4 is drawn from the 40 real survey responses only. §8 is drawn from 5 real
interviews and is labelled n=5 throughout.
