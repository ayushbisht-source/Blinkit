# Part 2 — Primary Research

## What was actually collected

| Instrument | n | Status |
|---|---|---|
| Screener-matched survey (Google Forms) | **40** | Collected 28–29 Jul 2026. Real respondents. |
| Depth interviews | 0 | **Not conducted.** See "Limitations". |

Everything below is derived from the 40 real survey responses. Nothing in this document is
reconstructed, voiced, or inferred dialogue.

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

1. **No depth interviews were conducted.** The brief asks for 5–6. This was not achieved.
   Consequence: the survey can confirm *what* and *how many*, but cannot explain *why* in the
   respondent's own words, and cannot surface a barrier that wasn't already an option on the form.
   Every finding above is bounded by the questions asked.

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

## 6. Honest note on research artifacts

Two files of interview-style transcripts were produced with AI assistance during this project. They
are **not** records of conducted interviews — both carry explicit headers to that effect
("illustrative, constructed interviews, not real transcripts"; "I could not conduct literal
follow-up interviews with the actual people"). They are excluded from this project's evidence base
and are not cited in Part 3.

The analysis in §1–§4 above is drawn from the 40 real survey responses only.
