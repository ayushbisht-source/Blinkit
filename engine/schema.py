"""Single source of truth for the discovery engine's data contracts.

Every enum below traces to one of the eight research questions in the brief. The extraction prompt,
the clustering step, the validation gold set and the case-study write-up all read their vocabulary
from here — so the code and the document can never drift apart.

If you change an enum, re-run extraction. Do not hand-edit labels downstream.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------------------
# Raw corpus
# --------------------------------------------------------------------------------------

class Source(str, Enum):
    PLAY_STORE = "play_store"
    APP_STORE = "app_store"
    REDDIT = "reddit"
    YOUTUBE = "youtube"
    MANUAL = "manual"          # forum / X exports dropped in as CSV


class Document(BaseModel):
    """Normalised unit of feedback. One row per review, comment or post."""

    doc_id: str
    source: Source
    source_url: str | None = None
    app_or_community: str                       # blinkit, zepto, instamart, r/india, ...
    created_at: datetime | None = None
    text: str
    rating: int | None = None                   # 1-5 where the source has one
    upvotes: int | None = None
    replies: int | None = None
    lang: str = "en"                            # en | hi | hinglish
    author_hash: str | None = None              # sha256(salt + username), never the raw handle


# --------------------------------------------------------------------------------------
# Extraction vocabulary — each enum answers one research question
# --------------------------------------------------------------------------------------

class HabitDriver(str, Enum):
    """Q1: why do users repeatedly buy from the same categories?"""

    TIME_PRESSURE = "time_pressure"             # ordering under time stress, no browsing budget
    TRUST = "trust"                             # known SKU is a known outcome
    SATISFICING = "satisficing"                 # good enough, not worth re-deciding
    LIST_REUSE = "list_reuse"                   # reorder button / saved cart
    PRICE_CERTAINTY = "price_certainty"         # knows what it should cost
    HOUSEHOLD_ROUTINE = "household_routine"     # someone else dictates the list


class Barrier(str, Enum):
    """Q2: what prevents users from exploring new categories?"""

    AWARENESS = "awareness"                     # did not know it was sold here
    TRUST_QUALITY = "trust_quality"             # doubts freshness / authenticity
    PRICE_RISK = "price_risk"                   # unsure if the price is fair
    CHOICE_OVERLOAD = "choice_overload"         # too many options, no way to choose
    NO_TRIGGER = "no_trigger"                   # saw it, no reason to act right then
    SIZE_UNCERTAINTY = "size_uncertainty"       # cannot judge quantity / pack size
    RETURN_ANXIETY = "return_anxiety"           # what if it is wrong
    CHANNEL_LOYALTY = "channel_loyalty"         # buys that category elsewhere by habit


class DiscoveryChannel(str, Enum):
    """Q3: how do users discover products today?"""

    SEARCH = "search"
    HOMEPAGE_BANNER = "homepage_banner"
    RECOMMENDATION_RAIL = "recommendation_rail"
    WORD_OF_MOUTH = "word_of_mouth"
    SOCIAL = "social"
    OFFLINE_STORE = "offline_store"
    FESTIVE_PUSH = "festive_push"
    ACCIDENTAL = "accidental"                   # stumbled while looking for something else


class InformationGap(str, Enum):
    """Q5: what information do users need before trying a new category?"""

    PRICE_BENCHMARK = "price_benchmark"         # is this a fair price vs my usual shop
    BRAND_FAMILIARITY = "brand_familiarity"
    FRESHNESS_EXPIRY = "freshness_expiry"
    SIZE_GUIDANCE = "size_guidance"             # how much do I need
    RETURNABILITY = "returnability"
    REVIEWS = "reviews"
    USAGE_GUIDANCE = "usage_guidance"           # how do I use this / which one is right for me


class SegmentSignal(str, Enum):
    """Q7: which user segments are more likely to experiment?"""

    PET_OWNER = "pet_owner"
    PARENT_YOUNG_CHILD = "parent_young_child"
    LIVES_ALONE = "lives_alone"
    COOKS_DAILY = "cooks_daily"
    STUDENT = "student"
    WORKING_PROFESSIONAL = "working_professional"
    TIER1_METRO = "tier1_metro"
    TIER2_PLUS = "tier2_plus"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    MIXED = "mixed"


# --------------------------------------------------------------------------------------
# Stage A — relevance gate (cheap model)
# --------------------------------------------------------------------------------------

class RelevanceVerdict(BaseModel):
    doc_id: str
    is_relevant: bool = Field(
        description="True if the text says anything about shopping behaviour, product discovery, "
        "category choice, or why the person did or did not buy something. False for pure "
        "delivery-speed, rider-conduct, app-crash or refund-logistics complaints."
    )
    off_topic_reason: str | None = None


# --------------------------------------------------------------------------------------
# Stage B — full extraction (strong model)
# --------------------------------------------------------------------------------------

class Extraction(BaseModel):
    """What the LLM returns for one relevant document."""

    doc_id: str

    habit_driver: list[HabitDriver] = []
    barrier: list[Barrier] = []
    discovery_channel: list[DiscoveryChannel] = []
    information_gap: list[InformationGap] = []
    segment_signal: list[SegmentSignal] = []

    categories_mentioned: list[str] = []
    habit_signal: int = Field(0, ge=0, le=3, description="0 none, 3 explicit routine/reorder language")
    sentiment: Sentiment = Sentiment.NEUTRAL
    frustration: list[str] = []

    pain_statement: str | None = Field(
        None,
        description="One sentence, in the user's own framing, of the unmet need. This is what gets "
        "embedded and clustered — not the raw text.",
    )
    evidence_quote: str | None = Field(
        None,
        description="VERBATIM substring of the source text. Must match character-for-character; "
        "the grounding check asserts this and any mismatch counts as a hallucination.",
    )
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    insufficient_signal: bool = Field(
        False,
        description="Set True and leave fields empty rather than guessing. A model forced to answer "
        "will invent barriers, and invented barriers are indistinguishable from real ones "
        "once they are counted.",
    )


# --------------------------------------------------------------------------------------
# Clustering + synthesis
# --------------------------------------------------------------------------------------

class Theme(BaseModel):
    theme_id: str
    name: str
    description: str
    doc_count: int
    prevalence: float                            # share of relevant docs
    source_spread: dict[str, int]                # per-source counts; single-source = artifact, not theme
    dominant_barriers: list[Barrier] = []
    dominant_gaps: list[InformationGap] = []
    representative_quotes: list[str] = []
    sentiment: Sentiment = Sentiment.NEUTRAL


class Insight(BaseModel):
    """A theme becomes an insight only when it names a mechanism and carries a 'so what'."""

    insight_id: str                              # INS-01 …  cited by every downstream artifact
    statement: str
    so_what: str
    mechanism: str = Field(description="Why this happens, not merely that it happens.")

    prevalence: float
    n: int
    source_spread: dict[str, int]
    segment_skew: list[SegmentSignal] = []

    research_questions_answered: list[int] = []  # 1-8, indexes the brief
    evidence_doc_ids: list[str] = []
    contradicting_evidence: list[str] = Field(
        default_factory=list,
        description="Doc ids that cut against this insight. An engine that only finds supporting "
        "evidence is a confirmation-bias machine; leaving this empty is a finding in itself.",
    )
    confidence: float = Field(0.0, ge=0.0, le=1.0)


class Verdict(str, Enum):
    CONFIRMED = "confirmed"
    CONFIRMED_STRONGER = "confirmed_stronger"
    CHALLENGED = "challenged"
    NOT_TESTED = "not_tested"


class Triangulation(BaseModel):
    """Part 2 output: how primary research landed against each engine insight."""

    insight_id: str
    engine_prevalence: float
    interviews_confirming: int
    interviews_total: int
    verdict: Verdict
    note: str
