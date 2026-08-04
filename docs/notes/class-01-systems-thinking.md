# Class 1 — Systems Thinking

**Speaker:** Arindam Mukherjee · Product Manager Fellowship (NextLeap) · 26 slides

> Session goals, as stated on the deck:
> - Understand how systems thinking plays a role in strengthening your product & business sense
> - Understand how to understand products & businesses **as systems**

---

## 1. What a system is

Three defining characteristics, each with its product parallel — the deck pairs them deliberately:

| A system… | A product… |
|---|---|
| Is a group of interacting parts | Has interconnected components |
| Whose parts form a unified whole serving a **specific goal** | Is built to achieve a desired outcome |
| Where a small change to one part can have an **outsized and sometimes unpredictable** impact on other parts | Where changing one part can impact others |

That third property is the whole reason the discipline exists. If effects stayed local, you could
optimise each part on its own and be done.

**The claim:** to build strong product/business sense, embrace systems thinking.

---

## 2. The two jobs of a PM

As a PM / Designer / Analyst you are always doing one of two things:

```
UNDERSTANDING the system   ←→   CHANGING the system
```

Most bad product decisions come from attempting the second without having done the first.

---

## 3. The four lenses on any system

The deck walks these one slide at a time. Together they are the scope of "the system" you are
responsible for.

| Lens | What to look at |
|---|---|
| **Company** | Mission / Vision · Performance · Strategy · Targets |
| **Customers** | Segments · Motivations · Needs · Pain points |
| **Market** | Trends / Climate · Competitors |
| **Ecosystem** | Collaborators · Partners · Regulators |

**Ecosystem includes the technical stack you don't own** but that constrains you regardless — the
deck lists: Device · OS · Application · Payment · Cloud infra · Network · Browser / App Store.

---

## 4. Where strategy comes from

The causal chain the deck states plainly:

```
Data  ──►  Insights  ──►  Strategy
```

**Strategy is based on insights. Insights come from data.** The three data sources, mapped back to
the four lenses:

| Source | Type |
|---|---|
| **User Research** | Qualitative · Quantitative |
| **Company Performance** | Metrics |
| **Market Research** | Trends · Competitive research |

---

## 5. Analysing a product — the three-part frame

> When analysing a product/business, look at: **Business Model · Actors · Flows**

The deck states this twice (slides 14 and 19), which is the tell that it's the load-bearing idea of
the session.

### 5.1 Business Model — the six predominant types

1. Selling a product/service
2. Renting a product
3. Commission-based sales
4. Charge a subscription fee
5. Charge based on usage
6. Advertising-based

*(Deck notes this gets covered in more detail in the next session.)*

### 5.2 Actors

**Actors are different types of customers, performing different roles.** A product usually has
several, and they want different things — which is why "the user" is almost always too coarse.

Examples given:

| Product type | Actors |
|---|---|
| Ed-tech | Learners · Instructors · Mentors · Recruiters |
| Content platform | Creators · Viewers · Advertisers |
| Food delivery | Consumer · Restaurants · Delivery Partners |

### 5.3 Flows — the three to focus on

| Flow | What moves |
|---|---|
| **Information Flow** | Search, listings, prices, confirmations, notifications, reviews |
| **Material Flow** | The physical goods — supplier → warehouse → picker → rider → customer |
| **Cash Flow** | Customer payments, commissions, payouts, fees, refunds |

*In-class exercise (slide 17): "What are the steps you go through when buying items at a grocery
store?" — the point is to make you trace all three flows through a familiar system.*

---

## 6. The three tools

### 6.1 Behaviour Over Time (BOT) graph

Plot the metric over time instead of quoting a single number. The example on the slide is
**"Android vs Msite Conversion trend"** — two series over the same period, Android consistently above
Msite, both roughly flat with occasional sharp spikes.

What the shape tells you that a snapshot cannot:
- the **gap** between the two is persistent, not noise → structural, not incidental
- the **spikes** are events worth explaining (campaign? release? outage?)
- the **flatness** says the underlying system is in equilibrium — nothing you've done has moved it

### 6.2 Causal diagram

Draw the variables and the arrows between them until you find the **loops**. The slide's example is
Uber (credit: David Sacks):

```
                    ┌──────────────► MORE DEMAND ──────────► MORE DRIVERS
                    │                    ▲                        │
              LOWER PRICES          FASTER PICKUPS                │
                    ▲                    ▲                        ▼
                    │                    └──── MORE GEOGRAPHIC COVERAGE /
              LESS DRIVER  ◄───────────────────      SATURATION
               DOWNTIME
```

Two reinforcing loops sharing a spine:

1. More demand → more drivers → more geographic coverage → **faster pickups** → more demand
2. More demand → more drivers → more coverage → **less driver downtime** → lower prices → more demand

This is the flywheel: each loop feeds the other, so the system compounds rather than adds. Reading it
also tells you where to intervene — anything that raises driver downtime breaks loop 2 at its weakest
joint.

### 6.3 Iceberg model — the most useful one

Four levels, each with its own response. The deeper you go, the more leverage you have and the harder
the work.

| Level | Above/below water | The question | Your response |
|---|---|---|---|
| **Events** | Above | Observable behaviours — what has happened | **React** |
| **Patterns of Behaviour** | Below | The trends — what has been happening over time | **Anticipate** |
| **Underlying Systematic Structure** | Below | What structural forces contribute to these patterns? *(reinforcing **R** and balancing **B** loops)* | **Design** |
| **Mental Model** | Deepest | What is it about our **thinking** that creates these systems and keeps them in place? | **Transform** |

> Slide caption, verbatim: *"Delving below the surface of events helps us see a bigger picture of how
> a system actually works. With this understanding we can make choices about how best to intervene to
> effect change such as modifying our mental models."*

**The practical use:** when someone reports a problem, ask which level it's stated at. Almost all
complaints arrive as *events*. Almost all durable fixes live at *structure* or *mental model*.

---

## 7. Summary (slide 24, as given)

1. To be a good PM/Designer/Analyst, you need a systems thinking mindset
   - Understanding the system
   - Changing the system
2. When analysing a product, look at
   - Business Model
   - Actors
   - Flows
3. Three tools to embrace systems thinking
   - Behaviour Over Time graphs
   - Causal Diagrams
   - Iceberg Model

---

## 8. In-class prompts (worth answering for yourself)

- *Slide 3:* When you think about a system, what questions come to mind?
- *Slide 17:* What steps do you go through when buying items at a grocery store?
- *Slide 25:* What have been your key takeaways from this session?

*Slides 4 and 26 are filler images (a reaction GIF and a "Questions?" slide) with no content.*

---

---

# Applying this to the Blinkit project

Not from the deck — this is the mapping onto our own case study, since these are the frameworks the
presentation is meant to use.

## The three-part frame, for Blinkit

**Business model:** primarily **commission-based sales** (margin on goods), plus **charge based on
usage** (the delivery fee — and note our research found that fee actively shapes basket composition,
`docs/02` §8.3), plus **advertising-based** (brand placement in the catalogue). Three of the six.

**Actors:** Consumer · Dark-store pickers · Delivery partners · Brands/sellers · The platform. Our
project only intervenes on the Consumer, which is worth saying out loud as a scope statement.

**Flows, and where our MVP sits:**

| Flow | In Blinkit | Does our MVP touch it? |
|---|---|---|
| Information | Search → catalogue → cart → ETA → confirmation | **Yes — this is the entire intervention.** The Category Spark card adds one thing to the information flow: a price *anchor*, at cart review |
| Material | Brand → dark store → picker → rider → consumer | No |
| Cash | Consumer → platform → commission → brand; fee → rider | No — but the free-delivery threshold changes consumer behaviour upstream |

**This is a strong framing for the deck:** the problem looks like a behaviour problem, but the
intervention is purely an *information-flow* change. No new material or cash flow, no new screen.

## The Iceberg model, applied — the strongest fit

| Level | Our project |
|---|---|
| **Events** | "This user has bought the same two categories for six months." A shopper ignores a suggestion. |
| **Patterns** | 38/40 arrive knowing exactly what they want. 20/40 crossed a category in 3 months — **and their barriers didn't soften afterwards**. Crossover is event-triggered and non-repeating. |
| **Structure** | The app shows an unfamiliar category exactly what it shows a familiar one — **a price with no reference point**. Evaluation costs time a 2-minute fetch session hasn't budgeted, so skipping is rational. The free-delivery threshold further constrains what enters the basket. |
| **Mental model** | *User's:* "quick commerce is a fetch tool, not a browse tool." *Company's:* "more recommendations produce more discovery" — the assumption our MVP explicitly rejects by shipping evidence-carrying cards instead of a feed. |

Most category-exploration solutions intervene at **Events** (a banner) or **Patterns** (a campaign).
Ours intervenes at **Structure** — supplying the missing reference point — which is exactly why the
deck's "deeper = more leverage" claim is the argument for our design.

## Causal diagram — the loop we're trying to break

```
   NARROW BASKET ──► FASTER, EASIER SESSION ──► "THE APP IS A FETCH TOOL"
        ▲                                                  │
        │                                                  ▼
   LESS EXPLORATION ◄───── NO REFERENCE POINT FOR ◄─── SHORTER SESSION
                            AN UNFAMILIAR PRICE          BUDGET
```

A reinforcing loop, and a vicious one: every efficient session makes the next exploration less
likely. The intervention point is the single weakest link — *no reference point for an unfamiliar
price* — which is what the ₹/week anchor supplies.

## BOT graph — what to plot in the deck

**CER (Category Expansion Rate) by month, with the 6-month lookback stated on the axis.** Two things
the shape would show that a single number hides:

- whether crossovers *repeat* month over month, or spike and revert — which is the survey's central
  finding and the reason Mode A leads the row
- the guardrails alongside it (AOV, core-category order frequency, dismissal rate), because a CER
  line that rises while AOV falls is not a win

*(We have no live traffic, so this is the measurement plan's shape — `docs/05-measurement-plan.md` —
not a result. Label it as such on the slide.)*
