// The suggestion agent.
//
// Structure follows docs/04-mvp-spec.md: eligibility and the price anchor are deterministic, the
// LLM is used only for adjacency inference and phrasing. Crucially there is a rule-based fallback
// for both, so the demo works with no API key and no quota at all — degraded phrasing, identical
// decisions. A demo that dies because a free-tier quota reset hasn't happened yet is not a demo.

import { CATALOGUE, CATEGORIES, PRODUCTS_BY_ID } from '../data/seed.js';
import {
  decideMode,
  priceAnchor,
  trialPack,
  mostReordered,
  purchaseCadenceDays,
  categoryHistory,
  countsTowardCER,
} from './eligibility.js';

// Which categories plausibly follow from which. Used by the fallback, and as a candidate filter for
// the LLM so it can't wander to something absurd.
const ADJACENCY = {
  'Dairy & Bread': ['Tea & Coffee', 'Frozen Food', 'Fruits & Vegetables'],
  'Snacks & Beverages': ['Frozen Food', 'Tea & Coffee'],
  'Fruits & Vegetables': ['Dairy & Bread', 'Frozen Food', 'Health & Pharma'],
  'Household Essentials': ['Cleaning Supplies', 'Home & Kitchen'],
  'Cleaning Supplies': ['Household Essentials', 'Home & Kitchen'],
  'Personal Care': ['Health & Pharma', 'Home & Kitchen'],
  'Baby Care': ['Health & Pharma', 'Personal Care'],
  'Pet Supplies': ['Cleaning Supplies', 'Health & Pharma'],
  'Home & Kitchen': ['Cleaning Supplies', 'Household Essentials'],
  'Health & Pharma': ['Personal Care', 'Fruits & Vegetables'],
  'Frozen Food': ['Snacks & Beverages', 'Dairy & Bread'],
  'Tea & Coffee': ['Dairy & Bread', 'Snacks & Beverages'],
};

// Life-stage and lifestyle signals are far stronger evidence than generic adjacency: a stated pet
// owner who has never bought pet supplies is a much better bet than any category-graph neighbour.
//
// This map is also how the brief's three named goals are actually reached:
//
//   "a user who buys groceries starts buying pet supplies"      -> pet_owner
//   "a user who buys snacks starts buying personal care"        -> skincare_routine
//   "a user who buys household essentials starts buying baby"   -> parent_young_child
//
// It would have been easier to add those as adjacency edges — grocery buyers get pet food, snack
// buyers get shampoo — and it would have been wrong. That produces "most people who buy dairy also
// keep pet supplies stocked", which is a true sentence about a population and a meaningless one
// about this shopper. 13 of 40 survey respondents named comparison time as their blocker and the
// research is explicit that generic "customers like you" copy is the noise they already ignore.
// A declared fact about the person is the only reason worth putting on the card.
//
// The lifestyle keys below extend beyond `engine/schema.py`'s SegmentSignal enum, which carries
// only the eight the corpus could evidence. They are demo-side profile attributes, not research
// findings, and are marked as such here so the two never get confused.
const SIGNAL_CATEGORIES = {
  pet_owner: 'Pet Supplies',
  parent_young_child: 'Baby Care',
  cooks_daily: 'Home & Kitchen',
  gym_goer: 'Health & Pharma',
  skincare_routine: 'Personal Care',
  tea_ritual: 'Tea & Coffee',
  new_home: 'Home & Kitchen',
  hosts_often: 'Frozen Food',
  deep_cleans: 'Cleaning Supplies',
  fresh_cook: 'Fruits & Vegetables',
};

function unownedCategories(owned) {
  return CATEGORIES.filter((c) => !owned.includes(c));
}

/** Rule-based candidate ranking. Also constrains what the LLM is allowed to choose from. */
export function candidateCategories(user, owned) {
  const unowned = unownedCategories(owned);
  const scored = [];

  // Categories the user has effectively closed. Added because the interviews found two barrier
  // types the rest of this agent cannot represent, and both of them make a suggestion actively
  // wrong rather than merely unhelpful (docs/02 §8.4, docs/03 §2):
  //
  //   incumbent  — an offline supplier they are satisfied with. P04: "there is one kirana store
  //                near me and we are buying from there like from ages." Unblocks only if they
  //                move house or the shop closes; no in-app information touches it.
  //   distrust   — a settled negative belief from direct experience. P05: "I will never buy from
  //                blinkit my trust issues for vegetables is still there", after one bad delivery.
  //
  // Before this existed the agent would happily suggest groceries to the kirana loyalist. The card
  // would have been *technically* valid — never-purchased category, real adjacency — and wrong in
  // the way that matters, because the user has already decided and the reason ignores it.
  const avoided = new Set((user.avoid ?? []).map((a) => a.category));

  for (const category of unowned) {
    if (avoided.has(category)) continue;
    let score = 0;
    const reasons = [];

    let driver = null; // the single strongest true reason, for the user-facing copy

    for (const signal of user.signals ?? []) {
      if (SIGNAL_CATEGORIES[signal] === category) {
        score += 100;
        reasons.push(`stated ${signal.replace(/_/g, ' ')}`);
        driver = { kind: 'signal', signal };
      }
    }

    for (const ownedCat of owned) {
      if ((ADJACENCY[ownedCat] ?? []).includes(category)) {
        score += 10;
        reasons.push(`adjacent to ${ownedCat}`);
        // Only becomes the headline reason if no stronger signal claimed it.
        driver ??= { kind: 'adjacency', ownedCategory: ownedCat };
      }
    }

    // Only categories with an in-stock trial pack are viable at all (hard rule 3).
    const trial = trialPack(CATALOGUE, category);
    if (!trial) continue;

    // Cheaper trial packs lower the risk the survey said blocks people (8 "too expensive",
    // 12 "found cheaper elsewhere"), so nudge them up slightly.
    score += Math.max(0, 5 - trial.price / 100);

    scored.push({ category, score, reasons, trial, driver });
  }

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Deterministic phrasing. Used as the fallback and as the format the LLM is asked to match.
 *
 * The reason must name the *actual* driver behind the pick. Substituting a different
 * plausible-sounding reason would violate hard rule 4 — and a reason the user can tell is generic
 * is exactly the noise they already ignore.
 */
export const SIGNAL_PHRASE = {
  pet_owner: 'You have a pet',
  parent_young_child: 'You buy for a little one',
  cooks_daily: 'You cook most days',
  gym_goer: 'You train regularly',
  skincare_routine: 'You keep a skincare routine',
  tea_ritual: 'You are a daily tea drinker',
  new_home: 'You have just moved in',
  hosts_often: 'You host people often',
  deep_cleans: 'You do a proper clean every week',
  fresh_cook: 'You cook fresh rather than packaged',
};

function composeFallback({ mode, user, category, product, lapsedDays, cadence, driver }) {
  if (mode === 'B') {
    const when = lapsedDays >= 30 ? `${Math.round(lapsedDays / 7)} weeks ago` : `${lapsedDays} days ago`;
    return {
      reason: `You tried ${category.toLowerCase()} ${when} — running low?`,
      trust: `${product.name} is the most reordered ${category.toLowerCase()} item`,
    };
  }

  const trust = `${product.name} is the most reordered starter pick here`;

  if (driver?.kind === 'signal') {
    const phrase = SIGNAL_PHRASE[driver.signal] ?? 'Based on what you buy';
    return { reason: `${phrase} — ${category.toLowerCase()} is the usual next thing people add`, trust };
  }

  if (driver?.kind === 'adjacency') {
    const cadenceText = cadence
      ? ` every ${cadence > 10 ? Math.round(cadence / 7) + ' weeks' : cadence + ' days'}`
      : '';
    // The old line read "most people who do also keep X stocked" — a true statement about a crowd,
    // worn as if it were a statement about this shopper. F3 is explicit that generic
    // recommendations supply none of fit, price or trust, and the row made it worse by scaling that
    // phrasing from one card to most of five (29 of 36 before this change).
    //
    // So the claim now owns being a pattern rather than impersonating personalisation, and the
    // sentence ends on a fact that is checkable and answers a blocker the survey ranked: `product`
    // is the lowest-priced in-stock item in the category by construction (trialPack), which speaks
    // to "too expensive" (8) and "found cheaper elsewhere" (12) — 20 of 40 combined.
    return {
      reason: `You buy ${driver.ownedCategory.toLowerCase()}${cadenceText} — ${category.toLowerCase()} is the common pairing, and ${product.name} is the lowest-priced one we stock`,
      trust,
    };
  }

  // No substantiated driver: say nothing rather than invent one.
  return null;
}

/**
 * Assemble one card from an already-chosen (mode, category, product), or return null with a reason.
 *
 * Shared by the single-card and the five-card paths so both inherit the same hard rules. When this
 * was inlined in `suggest`, adding a second caller would have meant a second copy of the stock check
 * and the substantiation check — and a rule enforced in two places is a rule that will eventually
 * only be enforced in one.
 */
function buildCard({ user, mode, category, product, lapsedDays = null, driver = null, now = new Date() }) {
  // Hard rule 3: fail closed rather than surface something unbuyable.
  if (!product || product.stock <= 0) return { card: null, why: 'no_in_stock_product' };

  const anchor = priceAnchor(user, product);
  const cadence =
    driver?.kind === 'adjacency' ? purchaseCadenceDays(user, driver.ownedCategory) : null;

  const copy = composeFallback({ mode, user, category, product, lapsedDays, cadence, driver });

  // Hard rule 4: no substantiated reason means no card.
  if (!copy) return { card: null, why: 'no_substantiated_reason' };

  return {
    card: {
      mode,
      category,
      // Whether accepting this would register in CER, per the six-month lookback. Carried on the
      // card so the claim is a computed property of the suggestion rather than an assertion in a
      // document that can drift away from the code.
      countsTowardCER: countsTowardCER(user, category, now),
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        pack: product.pack,
      },
      reason: copy.reason,
      trust: copy.trust,
      // The anchor line is the feature. Rendered only when it can be computed honestly.
      anchorLine: anchor
        ? `~₹${anchor.candidatePerWeek}/week · your usual runs ~₹${anchor.theirTypicalPerWeek}/week`
        : null,
      anchorFavourable: anchor?.cheaper ?? null,
    },
  };
}

/**
 * Up to `limit` suggestions in one go, each from a *different* category the shopper has never
 * bought from.
 *
 * The distinct-category rule is the whole point rather than a nicety. The strategic goal counts
 * customers who buy from at least one new category in a month, so five products from one new
 * category would move the metric exactly as much as one product does — five shots at the same
 * target. Five different new categories is five separate chances to score, which is why the list is
 * deduplicated by category rather than by SKU.
 *
 * Ranking is unchanged from the single-card path, so the brief's three named crossovers still come
 * out on top where they apply: a declared signal scores 100 (groceries → pet supplies, snacks →
 * personal care, household essentials → baby care) and generic category adjacency scores 10.
 *
 * The list is frequently shorter than `limit`, and that is correct. A candidate with no
 * substantiated driver produces no copy, and hard rule 4 drops it rather than padding the row with
 * an invented reason. Returning three honest cards beats returning five where two are decoration.
 */
export async function suggestMany(user, { limit = 5, now = new Date() } = {}) {
  const decision = decideMode(user, now);
  if (decision.mode === 'none') return { cards: [], mode: 'none', why: decision.why };

  const cards = [];
  const usedCategories = new Set();

  // First-crossover candidates lead, best-scoring first. candidateCategories already excludes owned
  // categories and anything the shopper has closed, so novelty and the avoid rule hold for every
  // row entry, not just the first.
  //
  // These lead rather than Mode B because they are the entries that can actually register in CER.
  // The metric counts a purchase in month M from a category absent in M-1 … M-6, so a category the
  // shopper tried 14-45 days ago is inside the lookback and its repeat scores zero. Sustained CER
  // comes from a stream of *different* first crossovers, not from deepening one.
  for (const candidate of candidateCategories(user, decision.owned)) {
    if (cards.length >= limit) break;
    if (usedCategories.has(candidate.category)) continue;

    const built = buildCard({
      user,
      mode: 'A',
      category: candidate.category,
      product: candidate.trial,
      driver: candidate.driver,
      now,
    });
    if (!built.card) continue;

    cards.push(built.card);
    usedCategories.add(candidate.category);
  }

  // Mode B keeps a place in the row, at the end, and it is not decoration. docs/00-foundation.md
  // names "30-day repeat rate within a newly tried category" as a secondary metric and says why:
  // trial without repeat is a discount, not exploration. Mode B is what stops the primary metric
  // being gamed by one-off trials that never come back. It simply is not itself a CER event, and
  // the row now ranks by what the goal actually counts rather than by which card converts best.
  if (decision.mode === 'B' && !(user.avoid ?? []).some((a) => a.category === decision.category)) {
    const tried = (decision.triedProductIds ?? [])
      .map((id) => PRODUCTS_BY_ID[id])
      .filter((p) => p && p.stock > 0);
    const built = buildCard({
      user,
      mode: 'B',
      category: decision.category,
      product: tried[0] ?? mostReordered(CATALOGUE, decision.category),
      lapsedDays: decision.lapsedDays,
      now,
    });
    if (built.card && !usedCategories.has(decision.category)) {
      // Takes the last slot, displacing the weakest first crossover rather than extending the row.
      if (cards.length >= limit) cards.pop();
      cards.push(built.card);
      usedCategories.add(decision.category);
    }
  }

  return {
    cards,
    mode: decision.mode,
    why: cards.length === 0 ? 'no_substantiated_reason' : null,
  };
}

/**
 * Build the card, or return null.
 *
 * Returning null is a first-class outcome, not a failure: hard rule 4 says show no card rather than
 * one whose reason the data cannot substantiate.
 */
export async function suggest(user, { llm = null, now = new Date() } = {}) {
  const decision = decideMode(user, now);
  if (decision.mode === 'none') {
    return { card: null, mode: 'none', why: decision.why };
  }

  let category;
  let product;
  let rationale = [];
  let chosenDriver = null;

  if (decision.mode === 'B') {
    category = decision.category;

    // Mode B bypasses candidateCategories entirely — it replays a category the user already tried —
    // so the avoidance rule has to be applied here as well or it has a hole exactly where it
    // matters most. A user who tried produce once, had a bad delivery and closed the category is
    // *precisely* a Mode B candidate on the numbers, and precisely the person who must not be
    // asked again.
    if ((user.avoid ?? []).some((a) => a.category === category)) {
      return { card: null, mode: 'B', why: `category_closed_by_user:${category}` };
    }
    // Prefer what they actually bought before — that's the thing they already accepted once.
    const tried = (decision.triedProductIds ?? [])
      .map((id) => PRODUCTS_BY_ID[id])
      .filter((p) => p && p.stock > 0);
    product = tried[0] ?? mostReordered(CATALOGUE, category);
    rationale = [`lapsed ${decision.lapsedDays}d after single purchase`];
  } else {
    const candidates = candidateCategories(user, decision.owned);
    if (candidates.length === 0) return { card: null, mode: 'A', why: 'no_viable_category' };

    let chosen = candidates[0];

    // The LLM's only job in Mode A: pick among pre-vetted candidates and justify it. It cannot
    // invent a category, because it only ever sees this shortlist.
    if (llm) {
      try {
        const picked = await llm.pickCategory({
          ownedCategories: decision.owned,
          signals: user.signals ?? [],
          candidates: candidates.slice(0, 5).map((c) => ({ category: c.category, why: c.reasons })),
        });
        const match = candidates.find((c) => c.category === picked?.category);
        if (match) {
          chosen = match;
          rationale.push('llm-selected');
        }
      } catch {
        rationale.push('llm-unavailable-fallback');
      }
    }

    category = chosen.category;
    product = chosen.trial;
    chosenDriver = chosen.driver;
    rationale.push(...chosen.reasons);
  }

  const built = buildCard({
    user,
    mode: decision.mode,
    category,
    product,
    lapsedDays: decision.lapsedDays,
    driver: decision.mode === 'A' ? chosenDriver : null,
  });
  if (!built.card) return { card: null, mode: decision.mode, why: built.why };

  const card = built.card;
  let copy = { reason: card.reason, trust: card.trust };

  if (llm) {
    try {
      const written = await llm.compose({
        mode: decision.mode,
        category,
        product: { name: product.name, price: product.price, pack: product.pack },
        ownedCategories: decision.owned,
        lapsedDays: decision.lapsedDays ?? null,
        anchor: priceAnchor(user, product),
      });
      if (written?.reason && written?.trust) {
        copy = written;
        rationale.push('llm-phrased');
      }
    } catch {
      rationale.push('llm-compose-fallback');
    }
  }

  // Only the wording is allowed to differ from what buildCard produced. Category, product and the
  // anchor stay exactly as the deterministic path computed them, which is what makes the demo
  // identical with or without an API key.
  return {
    mode: decision.mode,
    card: { ...card, reason: copy.reason, trust: copy.trust },
    rationale,
  };
}
