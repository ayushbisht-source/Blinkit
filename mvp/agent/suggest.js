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

// Life-stage signals are far stronger evidence than generic adjacency: a stated pet owner who has
// never bought pet supplies is a much better bet than any category-graph neighbour.
const SIGNAL_CATEGORIES = {
  pet_owner: 'Pet Supplies',
  parent_young_child: 'Baby Care',
  cooks_daily: 'Home & Kitchen',
};

function unownedCategories(owned) {
  return CATEGORIES.filter((c) => !owned.includes(c));
}

/** Rule-based candidate ranking. Also constrains what the LLM is allowed to choose from. */
export function candidateCategories(user, owned) {
  const unowned = unownedCategories(owned);
  const scored = [];

  for (const category of unowned) {
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
    const phrase = {
      pet_owner: 'You have a pet',
      parent_young_child: 'You buy for a little one',
      cooks_daily: 'You cook most days',
    }[driver.signal] ?? 'Based on what you buy';
    return { reason: `${phrase} — ${category.toLowerCase()} is the usual next thing people add`, trust };
  }

  if (driver?.kind === 'adjacency') {
    const cadenceText = cadence
      ? ` every ${cadence > 10 ? Math.round(cadence / 7) + ' weeks' : cadence + ' days'}`
      : '';
    return {
      reason: `You buy ${driver.ownedCategory.toLowerCase()}${cadenceText} — most people who do also keep ${category.toLowerCase()} stocked`,
      trust,
    };
  }

  // No substantiated driver: say nothing rather than invent one.
  return null;
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

  if (!product || product.stock <= 0) {
    // Hard rule 3: fail closed rather than surface something unbuyable.
    return { card: null, mode: decision.mode, why: 'no_in_stock_product' };
  }

  const anchor = priceAnchor(user, product);
  const driver = decision.mode === 'A' ? chosenDriver : null;
  const cadence =
    driver?.kind === 'adjacency' ? purchaseCadenceDays(user, driver.ownedCategory) : null;

  let copy = composeFallback({
    mode: decision.mode,
    user,
    category,
    product,
    lapsedDays: decision.lapsedDays,
    cadence,
    driver,
  });

  // Hard rule 4: no substantiated reason means no card.
  if (!copy) return { card: null, mode: decision.mode, why: 'no_substantiated_reason' };

  if (llm) {
    try {
      const written = await llm.compose({
        mode: decision.mode,
        category,
        product: { name: product.name, price: product.price, pack: product.pack },
        ownedCategories: decision.owned,
        lapsedDays: decision.lapsedDays ?? null,
        anchor,
      });
      if (written?.reason && written?.trust) {
        copy = written;
        rationale.push('llm-phrased');
      }
    } catch {
      rationale.push('llm-compose-fallback');
    }
  }

  return {
    mode: decision.mode,
    card: {
      category,
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
    rationale,
  };
}
