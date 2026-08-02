# Part 2 — Primary Research

## What was actually collected

| Instrument | n | Status |
|---|---|---|
| Screener-matched survey (Google Forms) | **40** | Collected 28–29 Jul 2026. Real respondents. |
| Depth interviews (async, text) | **3** | Collected 1 Aug 2026. Real respondents. Fieldwork closed at 3 against a target of 5–6 — see §5 and §8.7. |
| AI-synthesized personas | 5 | Generated from survey rows. **Not interviews.** See §6. |

Everything in §1–§4 is derived from the 40 real survey responses. Nothing there is reconstructed,
voiced, or inferred dialogue.

> ### On the interviews
>
> The brief asks for 5–6 depth interviews. **Three** were conducted — all real, all async over
> text, all recorded verbatim in `research/transcripts/`. Fieldwork closed there for time. That is
> short of the brief and this document does not present it as anything else; §8.7 sets out exactly
> which claims survive the shortfall and which do not.
>
> Two things follow, and they point in opposite directions.
>
> **First, the shortfall is real.** n=3 supports quoting and pattern-noticing. It does not support
> generalisation, and §8 makes no claim that requires it.
>
> **Second, three conversations found three things this project's vocabulary cannot express** — the
> one job neither the survey nor the personas could do, because both are built out of that same
> vocabulary. All three respondents named a never-bought category and explained it as *irrelevance*
> rather than obstruction, which no `barrier[]` value can encode. Two described using the app
> because nothing else was open, which no `HabitDriver` value can encode. One described organising
> their basket around a free-delivery threshold — and that one the engine **did** collect, 133
> documents of it, with nowhere to put a single one. See §8.
>
> §6 and §7 test the obvious substitute for interviews — personas generated from the survey — and
> find that of five hypotheses they produced, one was testable and it was **wrong**. Read against
> §8, that is the whole argument: the synthetic method produced fluent claims that failed under
> test, while three real conversations produced findings the survey, the personas, and 3,372 mined
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

1. **Only 3 depth interviews were conducted, against a target of 5–6.** Consequence: §1–§4 rest
   entirely on the survey, which can confirm *what* and *how many* but cannot explain *why* in the
   respondent's own words. Every finding in §1–§4 is bounded by the questions asked. §8 is bounded
   by n=3 and is written as pattern-noticing, not measurement — a finding appearing in all three
   interviews is recorded as worth checking, never as a rate. All three respondents are non-parents
   and two describe single-person households, which is a recruitment confound §8.7 states rather
   than resolves.

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

## 8. Depth interviews (n=3) — what real conversations added

Three async text interviews, 1 Aug 2026, five open questions each
(`research/async-interview-kit.md`). Verbatim transcripts with coding and analyst notes:
`research/transcripts/P01.md`, `P02.md`, `P03.md`. No names; P01–P03 only.

Async text rather than calls is a deliberate tradeoff and a stated weakness: answers are short and
there is no live probe (§8.6 gives the case where that cost something concrete). What it buys is
that the questions are **open**, so an answer can land outside the vocabulary of the instrument.
That is what happened three times.

**Headline: three interviews found three things the engine's vocabulary cannot represent.** Two of
them the engine was structurally blind to. The third it collected 133 documents of and has no field
to store.

### 8.1 First gap — no code for "this category is not for me"

All three respondents, unprompted, across two different apps, named a never-bought category and
explained it as an **absence of need** rather than an obstruction.

> **P01:** *"Pet supplies, baby care never bought. I don't have kids and pets so never bought it and
> also if I have in future I would love to try."*
>
> **P02:** *"Baby care never bought because I don't have kids and in future I can try."*
>
> **P03:** *"Home appliance, because I live alone and I live in full furnished so nothing to do with
> it."*

None answered the second half of the question — *where do you buy that instead?* — because the
premise doesn't hold. Nobody is buying it anywhere.

The engine's `barrier[]` enum has eight values (`awareness`, `trust_quality`, `price_risk`,
`choice_overload`, `no_trigger`, `size_uncertainty`, `return_anxiety`, `channel_loyalty`) and the
survey's blocker options were written from that same list (§5, limitation 2). **Every one of them
presumes latent demand that something is obstructing.** There is no code for a category that is
simply irrelevant. Forced onto the closed list, all three would have been recorded as blocked, and
the resulting number would overstate addressable demand.

Why none of the other three methods could find it:

| Method | Why it misses it |
|---|---|
| Discovery engine (3,372 reviews) | Nobody writes a review about a product they have no reason to buy. Absence of need leaves no text. |
| Survey (n=40) | Closed options, all drawn from the same enum. A respondent in this position has no honest box to tick. |
| Synthetic personas | Vocabulary is the survey's vocabulary (§7). Cannot produce a category that isn't in its input. |

Note the tail of all three answers: *"in future I would love to try"* (P01), *"in future I can try"*
(P02), *"when i have my own house I would love to buy"* (P03). The category is not rejected, it is
**dormant pending a life event**. For the MVP that is a suppression rule, not a conversion
opportunity — such a card is a wasted impression, and dismissal rate is a pre-registered guardrail
(`docs/03-problem-definition.md` §5).

### 8.2 Second gap — access of last resort

P01 and P02's stated reason for opening the app at all was the **absence of an alternative**:

> **P01:** *"I'm at my hometown and only Blinkit is available there as of now."*
>
> **P02:** *"it's late night and it is available on zepto"* · *"no shop around me that time"*

The `HabitDriver` enum's six values all describe a *preference between available options*
(`time_pressure`, `trust`, `satisficing`, `list_reuse`, `price_certainty`, `household_routine`).
Access-of-last-resort is not among them. If common, it describes a session where the user has no
alternative and no browsing intent — the worst moment to surface a new category and, plausibly, a
frequent one. P03 does **not** replicate it (their trigger was a price advantage), so this stands at
2 of 3 and is recorded as a hypothesis to check against extraction output, not as a finding.

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

### 8.4 What the interviews confirmed

| Claim | P01 | P02 | P03 |
|---|---|---|---|
| Users arrive knowing what they want (F2) | Confirmed | Confirmed | Confirmed — though with cross-platform price comparison first |
| Crossover is event-triggered, not curiosity-driven (§3) | Confirmed — refined oil, *"needed that very urgent"* | Confirmed — liquid detergent, *"urgent for me and no shop around me"* | Confirmed — sipper, *"i joined gym… so i bought urgently"* |
| Information needed first is quality and price (F3) | Confirmed — *"quality and quantity also of course pricing"* | Confirmed — *"pricing… and quality as well"* | Confirmed — *"quality matters to me"* |
| Price is what triggers a crossover | — | **Challenged** — price named third, after urgency | **Confirmed** — a ₹200 discount was the trigger, no urgency present |

**3 of 3 on event-triggered crossover, with three different triggers** — ran out (P01), urgent need
with no alternative (P02), and a life event creating a need that did not previously exist (P03,
joining a gym). `docs/03-problem-definition.md` §5 predicted exactly that set.

**3 of 3 named quality unprompted.** None mentioned delivery speed, returns, or brand — the three
things quick-commerce marketing leads with.

### 8.5 What they disagreed about

**Shopping rhythm — the one direct contradiction, now 2 against 1:**

- **P01:** *"I don't shop everyday, I shop when I needed the products."*
- **P02:** *"I shop mostly regularly because it's very easy to shop on app."*
- **P03:** *"I shop regularly from these quick commerce so nothing left."*

This matters because the root cause in `docs/03-problem-definition.md` §2 rests on a two-minute
fetch session. In `research/transcripts/P02.md` the prediction was recorded that a respondent
describing *actual browsing* would put that model in trouble. **P03 did not.** Their two described
purchases are a decided adapter and an urgent sipper — single-item, product known before the app
opened. Two respondents now self-describe as "regular" while describing pure fetch behaviour, so
frequent-and-narrow — the segment definition in `docs/00-foundation.md` — reads as the better
explanation than a contradiction. Nobody has yet described browsing, and the standing prediction is
unchanged: one respondent who does overturns this.

**Price's role — genuinely unsettled at n=3.** P02 named price third, after urgency and absence of
alternatives; P03's last order was triggered by price alone, with no urgency, following deliberate
cross-platform comparison. The honest reading is that price can be either trigger or confirmer, and
three interviews cannot say which is typical.

### 8.6 What the async method cost

P03's basket-economics answer is the concrete case. A live interview would have asked *"what do you
mean the minimum stops you — wouldn't an appliance be over ₹200 anyway?"* and settled the mechanism
in one exchange. Async text could not, so the most novel finding in the study is recorded with its
mechanism ambiguous. That is the tradeoff named at the top of this section, priced.

### 8.7 Why this stops at three, and what that costs

**Three interviews were conducted against a target of 5–6. Fieldwork closed there, for time.** That
is a shortfall, not a design choice, and the honest question is which claims survive it.

**What n=3 does support.** The central finding is that the engine's `barrier[]` enum has no code for
"this category does not apply to me." That is a claim about the *instrument*, not about the
population, and it does not need a representative sample: a single respondent whose honest answer
has no valid code is sufficient to show the vocabulary is incomplete. There are three, independently,
across two apps. The same holds for the basket-economics gap (§8.3), which additionally has 133
corpus documents behind it.

**What n=3 does not support.** Any statement of the form "X% of users" or "this is the main reason."
Nothing in §8 is written that way, and nothing downstream depends on it. The prevalence question —
*how many* users have no latent demand in a category they've never bought — is genuinely open, and
answering it needs a survey instrument that offers the missing option, not more interviews.

**The recruitment confound, stated plainly.** All three respondents are non-parents; two describe
single-person households. Two of the three named the same category (baby care). That pattern may
reflect who was available to ask rather than anything about the user base, and three interviews
cannot separate those. A fourth and fifth respondent — specifically a parent and a pet owner — would
have tested whether "the category is irrelevant" is a property of these respondents or of the
question. That test was not run.

**What was deliberately not done.** Interviews were not fabricated, and no synthetic persona is
counted toward the interview total. §6 and §7 exist precisely because generating plausible
respondents from the survey was the obvious shortcut, and testing that shortcut is what produced
this project's clearest methodological result: of five persona-generated hypotheses, one was
testable and it was wrong. Adding invented transcripts to a document making that argument would
have destroyed the argument along with the evidence base. Three real respondents who said
surprising things are worth more here than five convincing ones who said nothing that was not
already in the input.

---

The analysis in §1–§4 is drawn from the 40 real survey responses only. §8 is drawn from 2 real
interviews and is labelled n=2 throughout.
