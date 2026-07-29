# Blinkit Category Exploration — Project Architecture

**Goal metric:** % of Monthly Active Customers (MAC) who purchase from **≥1 new category** in a
calendar month. Referred to throughout as **CER — Category Expansion Rate**.

**Definition (lock this before writing any code):**

```
CER(month M) = distinct_users(purchased category C in M, where C ∉ categories purchased in M-1..M-6)
               ────────────────────────────────────────────────────────────────────────────────────
                                    distinct_users(≥1 order in M)
```

The 6-month lookback matters. Without it, seasonal repurchases (mosquito repellent, holi colours)
count as "exploration" and the metric lies. State the lookback explicitly in the case study —
graders notice metric hygiene.

---

## 0. The through-line

The four parts are graded as a **chain**, not as four projects. Each artifact must be traceable to
the one before it:

```
Public feedback corpus
   └─► [Part 1] Discovery Engine ──► Themes ──► Insights (evidence-linked, quality-scored)
                                                   │
                                                   ├─► picks the SEGMENT + top 3 hypotheses
                                                   ▼
                                     [Part 2] 6 interviews (segment-screened)
                                                   │
                                                   ├─► CONFIRM / CHALLENGE / NEW matrix
                                                   ▼
                                     [Part 3] Problem definition (root cause, not symptom)
                                                   │
                                                   ├─► "the MVP must kill THIS root cause"
                                                   ▼
                                     [Part 4] AI-native MVP, deployed, instrumented for CER
```

Every insight carries an ID (`INS-07`). Every interview finding cites the insight IDs it confirms or
challenges. The problem statement cites both. The MVP spec cites the problem statement. That
citation trail *is* the case study.

**Non-negotiable early decision:** pick ONE segment at the end of Phase 1 and never widen again.
Recommended default (validate in Phase 1, don't assume):

> **Habitual Narrow Repeaters** — ≥3 orders/month, ≥6 months tenure, ≥70% of spend concentrated in
> ≤2 categories. High-frequency, high-trust, low-exploration. They are already engaged, so the
> barrier is behavioural rather than acquisition — which is exactly the kind of barrier a software
> MVP can move.

---

## Repository layout

```
blinkit-category-discovery/
├── docs/
│   ├── ARCHITECTURE.md              ← this file
│   ├── 01-discovery-engine.md       ← method + validation write-up
│   ├── 02-user-research.md          ← screener, guide, synthesis
│   ├── 03-problem-definition.md     ← the PM narrative
│   ├── 04-mvp-spec.md               ← PRD for the MVP
│   ├── 05-measurement-plan.md       ← events, experiment design, guardrails
│   └── case-study/                  ← final deck + demo assets
│
├── engine/                          ← PART 1
│   ├── collectors/                  ← one module per source
│   │   ├── play_store.py
│   │   ├── app_store.py
│   │   ├── reddit.py
│   │   ├── youtube_comments.py
│   │   └── manual_import.py         ← CSV drop for forums/X exports
│   ├── pipeline/
│   │   ├── normalize.py             ← unified schema + PII scrub
│   │   ├── dedupe.py                ← near-dup via minhash/simhash
│   │   ├── enrich.py                ← LLM structured extraction
│   │   ├── embed.py                 ← vectors for clustering
│   │   ├── cluster.py               ← HDBSCAN + theme labelling
│   │   └── synthesize.py            ← themes → insights
│   ├── validation/
│   │   ├── gold_set.py              ← human-labelled benchmark
│   │   ├── agreement.py             ← κ / F1 vs gold, model-vs-model
│   │   ├── grounding.py             ← verbatim-quote hallucination check
│   │   └── saturation.py            ← theme-discovery curve
│   ├── prompts/                     ← versioned, one file per task
│   └── dashboard/                   ← Streamlit or static HTML report
│
├── mvp/                             ← PART 4
│   ├── app/                         ← Next.js (UI + API routes)
│   ├── agent/                       ← recommendation + explanation agent
│   ├── data/                        ← seeded catalogue + synthetic users
│   └── evals/                       ← offline eval set for agent quality
│
├── data/
│   ├── raw/                         ← immutable JSONL, one file per pull
│   ├── interim/
│   ├── processed/                   ← discovery.db (SQLite/DuckDB)
│   └── gold/                        ← hand-labelled validation set
│
└── research/
    ├── transcripts/                 ← anonymised
    └── notes/
```

---

## Phase 0 — Foundation (Days 1–2)

Small phase, but it prevents rework.

| Deliverable | Detail |
|---|---|
| Metric spec | CER formula above + guardrails: AOV, orders/user/month, refund rate, cart-abandon rate, category-return rate |
| Segment hypothesis | Written down, with the criteria you'll screen interviewees against |
| Research questions → schema map | The 8 questions in the brief become **fields in the extraction schema**. Do this now; it makes Part 1 auditable |
| Repo scaffold + env | `ANTHROPIC_API_KEY`, Reddit app creds, YouTube API key |
| Ethics/ToS note | One paragraph: public data only, usernames hashed, no scraping behind auth, rate limits respected. Graders like seeing this |

**Mapping the brief's 8 questions to extraction fields — do not skip this table:**

| Research question | Extracted field |
|---|---|
| Why do users repeatedly buy the same categories? | `habit_driver[]` (enum: time-pressure, trust, satisficing, list-reuse, price-certainty) |
| What prevents exploring new categories? | `barrier[]` (enum: awareness, trust/quality-doubt, price-risk, choice-overload, no-trigger, size/quantity-uncertainty, return-anxiety) |
| How do users discover products today? | `discovery_channel[]` (enum: search, homepage banner, recommendation-rail, word-of-mouth, social, offline-store, festive-push) |
| Role of habit | `habit_signal` (0–3 scale) + `reorder_mention` (bool) |
| Info needed before trying a category | `information_gap[]` (enum: price-benchmark, brand-familiarity, freshness/expiry, size-guidance, returnability, reviews, usage-guidance) |
| Recurring frustrations | `frustration[]` + `sentiment` |
| Who experiments more? | `segment_signal` (life-stage, city-tier, pet-owner, parent, cook-at-home, etc.) |
| Unmet needs | `unmet_need` (free text, later clustered) |

---

## Phase 1 — AI-Powered Discovery Engine (Days 3–10)

### 1.1 Ingestion

```
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐
│ Play Store   │  │ App Store    │  │ Reddit   │  │ YouTube  │  │ Manual CSV  │
│ (blinkit +   │  │ (RSS reviews │  │ (PRAW,   │  │ comments │  │ forums / X  │
│  competitors)│  │  endpoint)   │  │  subs +  │  │ on q-comm│  │  exports    │
│              │  │              │  │  search) │  │  videos  │  │             │
└──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘
       └─────────────────┴───────────────┴─────────────┴───────────────┘
                                    │
                            data/raw/*.jsonl   (immutable, timestamped, source-tagged)
```

**Pull competitors too** (Zepto, Instamart, BigBasket, Dunzo). Category-exploration behaviour is a
category-level phenomenon, not a Blinkit-app phenomenon, and it doubles your corpus. Target
**8,000–15,000 documents**; that's enough for the saturation curve to plateau convincingly.

Practical notes:
- Play Store scraping is the highest-yield source and the easiest — start there.
- X/Twitter API is effectively paywalled now. Don't burn days on it. Use a manual export path and
  say so honestly in the write-up; a stated limitation beats a fake dataset.
- **Commit a seed corpus** (a few hundred docs) to the repo so the pipeline is reproducible by a
  grader who has no API keys.

### 1.2 Normalize → Dedupe → PII scrub

Unified schema:

```json
{
  "doc_id": "ps_in_8f3a…",
  "source": "play_store|app_store|reddit|youtube|manual",
  "source_url": "…",
  "app_or_community": "blinkit",
  "author_hash": "sha256(salt+username)",
  "created_at": "2026-03-14T09:22:00Z",
  "text": "…",
  "rating": 2,
  "engagement": {"upvotes": 41, "replies": 7},
  "lang": "en|hi|hinglish"
}
```

Hinglish is real in this corpus. Add a `lang` tag and instruct the extraction model to handle it —
don't machine-translate first, you'll lose the signal.

Dedupe with simhash at ~0.9 threshold; bot/spam reviews cluster hard and will skew frequencies.

### 1.3 Enrichment (the LLM layer)

Per-document structured extraction using Claude with a strict JSON schema (the field map from
Phase 0). Design notes that matter:

- **Two-stage, cost-shaped.** Stage A: cheap relevance gate (Haiku) — "is this about shopping
  behaviour, discovery, or category choice?" Roughly 60–70% of app-store reviews are about delivery
  time and rider behaviour; gate them out (but keep them tagged — "delivery anxiety crowds out
  browsing" may itself be a finding).
- **Stage B:** full extraction on survivors with a stronger model.
- **Prompt-cache the system prompt + schema + few-shot examples.** It's identical across thousands
  of calls; caching cuts cost substantially.
- **Force a verbatim `evidence_quote`** — a literal substring of the source text. This is the hook
  that makes Section 1.6 possible.
- **Emit `confidence`** and let the model return `insufficient_signal` rather than guessing. Models
  that must answer will invent barriers.
- Batch, checkpoint to disk after every batch, make it resumable. You *will* hit a rate limit at
  document 4,000.

### 1.4 Theme identification

```
enriched docs
   │
   ├─ embed the extracted pain/need statements (not raw text — statements cluster far cleaner)
   │
   ├─ UMAP → HDBSCAN  (density clustering; allows noise, unlike k-means)
   │
   ├─ per cluster → LLM labels: {theme_name, description, 5 representative quotes,
   │                             doc_count, source_spread, sentiment, severity}
   │
   └─ merge near-duplicate themes (cosine on theme centroids > 0.85 → LLM adjudicates merge)
```

Report each theme with **prevalence** (% of relevant docs), **source spread** (does it appear across
all 5 sources or only Reddit?), and **segment skew**. A theme present in one source only is a
source artifact, not an insight — call that out explicitly; it shows methodological maturity.

### 1.5 Insight synthesis

Theme ≠ insight. A theme is "users mention not knowing pet food quantities." An insight is:

> **INS-07.** Habitual grocery buyers who own pets don't cross into pet supplies because they can't
> judge *quantity-per-price* against their offline store's known pack sizes — the app shows price
> but not the comparison anchor they use offline. Prevalence 8.2% of relevant docs (n=412), present
> in 4/5 sources, skews to tier-1 metro, dog-owner. *So what:* the blocker is a missing comparison
> anchor at the point of consideration, not missing awareness.

Each insight object: `id, statement, so_what, prevalence, n, source_spread, segment_skew,
research_questions_answered[], evidence_doc_ids[], confidence, contradicting_evidence[]`.

**Force a `contradicting_evidence` field.** An engine that only finds supporting evidence is a
confirmation-bias machine, and saying that out loud in the write-up earns more than a clean result.

### 1.6 Validation — the section that decides your grade

Five checks. Do all five; they're each cheap.

| # | Check | Method | Target |
|---|---|---|---|
| 1 | **Human agreement** | Hand-label 100 randomly sampled docs on `barrier[]` and `relevance`. Compare to engine output | Cohen's κ ≥ 0.65 |
| 2 | **Quote grounding** | Assert every `evidence_quote` is a verbatim substring of its source doc. Automated | 100% pass, 0 hallucinated quotes |
| 3 | **Model/prompt agreement** | Re-run extraction on a 300-doc sample with a second model and a reworded prompt. Measure label overlap | ≥80% agreement; investigate the disagreements — they're usually genuinely ambiguous docs and worth a paragraph |
| 4 | **Theme saturation** | Plot cumulative distinct themes vs docs processed, in shuffled order | Curve visibly plateaus → coverage argument |
| 5 | **Hold-out** | Withhold 20% of corpus from clustering; run themes against it | No major new theme (>3% prevalence) appears |

Plus check 6, which lands in Phase 2: **triangulation against interviews.** Report engine insights
that interviews *challenged*, not just confirmed. That is the single most credible thing in the
whole submission.

**Output of Phase 1:** `insights.json`, a dashboard, and a written method + validation doc. Plus the
decision: the chosen segment and the top 3 hypotheses to interrogate in interviews.

---

## Phase 2 — Primary Research (Days 11–15)

Runs partly in parallel with Phase 1 — start recruiting while the pipeline processes.

**Screener** (must operationalise the segment): orders ≥3/month on any q-commerce app, ≥6 months
usage, and — the key one — "which categories did you buy from in the last month?" Recruit people
naming ≤2. Screen *out* people who work in q-commerce/product/design.

**Discussion guide structure** (60 min, 6 participants):
1. Warm-up + last-order walkthrough — *behaviour before opinion*
2. Reconstruct the last 3 orders from their actual order history (ask them to open the app). Memory
   is unreliable; the screen is not.
3. Probe a category they've never bought from: "walk me through what would have to be true for you
   to buy pet food here." Watch for the barriers from Phase 1 — but **do not name them**.
4. Discovery: "the last time you bought something new on this app, how did that happen?"
5. Workarounds: what do they do *today* instead (offline store, Amazon, asking family)
6. Reaction to 2–3 rough concepts — last, so it doesn't contaminate 1–5

**Anti-bias rules:** never say your hypothesis out loud; ask about the last time, not "usually";
count silence to three.

**Synthesis:** run transcripts through the *same* enrichment schema as Phase 1. This is a strong
move — it makes the comparison apples-to-apples and shows the engine generalises. Then build:

| Insight ID | Engine prevalence | Interviews confirming | Verdict | Note |
|---|---|---|---|---|
| INS-07 | 8.2% | 5/6 | **CONFIRMED — stronger than engine suggested** | Under-represented online because it's not complaint-shaped |
| INS-12 | 14.1% | 1/6 | **CHALLENGED** | Online complaints skew to an angrier tail |

That "under-represented online because it's not complaint-shaped" observation — public feedback
over-indexes on anger, while silent friction never gets written down — is worth stating explicitly
as a limitation of AI-driven discovery. It's the honest answer to "why bother with interviews."

---

## Phase 3 — Problem Definition (Days 16–17)

Five required components. Keep it to two pages; density beats volume.

1. **Target segment** — with size estimate. Even rough: if Blinkit has ~X MAC and this segment is
   ~Y%, state the arithmetic and your assumptions.
2. **Root cause** — push past the symptom. "Users don't explore" is a symptom. Run 5-whys and land
   on a mechanism. Use a behavioural frame (Fogg: B = Motivation × Ability × Prompt) to argue
   *which* variable is actually binding. Most likely finding: motivation isn't the constraint —
   ability (can't evaluate an unfamiliar category quickly) and prompt (no trigger at the moment of
   need) are. That distinction dictates the MVP.
3. **Existing workarounds** — what they do instead. Workarounds are the strongest evidence a need is
   real: people only build workarounds for problems they actually have.
4. **Why it creates user value** — in their words, from transcripts.
5. **Why it's good business** — a sizing model:

```
Incremental monthly GMV
  = MAC × segment_share × ΔCER × avg_first_basket_in_new_category × repeat_rate_after_trial
```

Then the strategic argument, which is stronger than the arithmetic: **category breadth is the
best-known predictor of retention and of LTV in q-commerce.** A user buying from 4 categories is
structurally harder for a competitor to unbundle than a user buying from 1. Frame exploration as a
*moat* investment, not a GMV tactic. Add guardrails you'd hold yourself to: no AOV degradation, no
rise in returns, no drop in core-category frequency.

---

## Phase 4 — AI-Native MVP (Days 18–26)

### Recommended concept

**"Category Concierge"** — an agent that reads a user's own order history, infers an *adjacent unmet
need*, and delivers a single, justified, low-risk trial nudge that supplies exactly the information
the research said was missing.

Why this concept: if Phase 3 lands on **ability + prompt** (not motivation), the fix is *not* more
recommendations — Blinkit already has rails and users ignore them. The fix is (a) a *reason* tied to
the user's own behaviour, (b) the *specific missing information* that blocks evaluation, and (c) a
*de-risked first purchase*. Generic recommendation rails do none of the three. Adjust the concept if
your actual findings differ — but keep this shape: attack the named root cause, nothing else.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js app (Vercel)  — Blinkit-like storefront                │
│                                                                 │
│  Surfaces:                                                      │
│   1. Post-order "complete your routine" card                    │
│   2. Cart-time "you buy X weekly — you've never tried Y"        │
│   3. Chat: "Ask Blinkit" conversational discovery agent         │
└───────────────┬─────────────────────────────────────────────────┘
                │  /api/recommend   /api/chat   /api/events
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Agent layer  (Claude + tools)                                  │
│                                                                 │
│  ① Profile builder    order history → purchased categories,     │
│                       cadence, basket signals (pet food? →      │
│                       pet owner; diapers → parent)              │
│  ② Adjacency reasoner infer unmet need, propose 3 candidate     │
│                       NEW categories with a stated rationale    │
│  ③ Ranker            relevance × barrier-fit × margin ×         │
│                       inventory-availability                    │
│  ④ Justification     generate the nudge carrying the exact      │
│     generator        info_gap the research identified:          │
│                       price anchor, size guidance, returnability│
│  ⑤ Trial-basket      assemble a small, cheap, 2–3 SKU starter   │
│     builder          bundle to minimise first-purchase risk     │
│                                                                 │
│  Tools: get_order_history, search_catalogue, get_category_meta,  │
│         get_price_benchmark, check_availability                  │
└───────────────┬─────────────────────────────────────────────────┘
                ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│ Seeded catalogue + users │   │ Event log → CER dashboard         │
│ (Postgres / SQLite)      │   │ + A/B holdout assignment          │
└──────────────────────────┘   └──────────────────────────────────┘
```

**Hard constraint on the agent: it may only name SKUs returned by `search_catalogue`.** An agent
that hallucinates a product is a demo that dies live in front of a grader. Validate every SKU in the
response against the catalogue before rendering, and fail closed.

**Stack recommendation:** single Next.js app on Vercel (UI + API routes + Claude SDK), Postgres via
Neon/Supabase free tier, seeded with a synthetic catalogue (~300 SKUs across 12 categories) and
~50 synthetic users with 6 months of plausible order history. One deployable unit, one URL, no CORS,
free hosting — the least that can go wrong on demo day.

**Scope discipline — build in this order, stop when time runs out:**
1. Storefront + seeded data + one surface (post-order card) + agent ①–④ ← *this alone is a passing MVP*
2. Event instrumentation + CER dashboard
3. Chat agent
4. Trial-basket builder
5. A/B holdout

### Agent evaluation (`mvp/evals/`)

Reviewers will ask "how do you know the agent is any good?" Have an answer:

- **Eval set:** 30 synthetic user profiles with hand-written "reasonable / unreasonable" category
  recommendations. Score precision@1.
- **Grounding:** 100% of recommended SKUs exist in catalogue and are in stock.
- **Novelty:** 100% of recommendations are from categories the user has genuinely never bought —
  assert it in code, it's the whole point of the product.
- **Justification quality:** LLM-as-judge on whether the nudge references the user's actual history
  and supplies a concrete info-gap-closing fact.
- **Latency + cost** per recommendation.

---

## Phase 5 — Measurement Plan (Days 27–28)

Ship this as a doc; it's what separates a PM submission from an engineering one.

- **Event schema:** `nudge_shown`, `nudge_clicked`, `new_category_item_added`,
  `new_category_purchased`, `repeat_purchase_in_new_category` (the one that actually matters —
  trial without repeat is a discount, not exploration)
- **Primary metric:** CER, per the Phase 0 definition
- **Secondary:** new-category trial rate, 30-day repeat rate within newly tried category, categories/user
- **Guardrails:** AOV, core-category order frequency, refund/return rate, nudge-dismissal rate
- **Experiment:** 90/10 holdout, MDE and sample-size calculation, minimum 4-week run (CER is a
  monthly metric — anything shorter can't measure it)
- **Failure criteria stated in advance:** what result would make you kill this. Pre-registering a
  kill criterion is a strong PM signal.

---

## Phase 6 — Packaging (Days 29–30)

- Case study deck (~15 slides) following the chain in Section 0
- 3-minute demo video of the deployed MVP
- README with a live URL, quickstart, and honest limitations
- **A limitations section**: synthetic data in the MVP, public-feedback selection bias, n=6
  qualitative sample. Naming your own weaknesses pre-empts the tough questions and reads as
  confidence, not hedging.

---

## Timeline

| Phase | Days | Runs parallel with |
|---|---|---|
| 0 — Foundation | 1–2 | — |
| 1 — Discovery engine | 3–10 | recruiting for Phase 2 |
| 2 — Interviews | 11–15 | engine validation write-up |
| 3 — Problem definition | 16–17 | MVP scaffolding |
| 4 — MVP build + deploy | 18–26 | — |
| 5 — Measurement plan | 27–28 | MVP polish |
| 6 — Packaging | 29–30 | — |

Compressible to ~3 weeks by cutting corpus size to ~4k docs and shipping only MVP scope items 1–2.

---

## Top risks

| Risk | Mitigation |
|---|---|
| Social API access (X especially) | Lean on Play Store + Reddit + YouTube; manual CSV path; state the limitation |
| LLM cost blowout on 15k docs | Cheap relevance gate first, prompt caching, batch + checkpoint |
| Interview recruitment slips | Start recruiting on Day 1, over-recruit to 8, expect 2 no-shows |
| MVP scope creep | The build order above; surfaces 2–4 are explicitly optional |
| Agent hallucinates SKUs live | Catalogue-validate every response, fail closed |
| Insights stay generic ("users want better recommendations") | Force `so_what` + `contradicting_evidence` fields; reject any insight not tied to a mechanism |

---

## The trap to avoid

The most common failure in this brief is building a **very good recommendation engine** and calling
it done. Blinkit already has recommendations. The interesting question is not *what to recommend* —
it's **why a user who has seen a category on the homepage 200 times has never once tapped it.** Your
discovery engine exists to answer that, and your MVP exists to remove that specific blocker. If the
MVP could be described as "personalised product suggestions," it hasn't engaged with the brief.
