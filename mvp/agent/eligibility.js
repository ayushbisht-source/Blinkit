// Deterministic gates and arithmetic. Nothing here touches an LLM.
//
// The spec is explicit that eligibility is a rule and the price anchor is division — routing either
// through a model would add latency, cost and a hallucination surface for zero benefit. Keeping
// them here also makes them unit-testable, which is what lets the eval suite assert correctness
// rather than judge quality.

import { PRODUCTS_BY_ID } from '../data/seed.js';

export const MODE_B_MIN_DAYS = 14;
export const MODE_B_MAX_DAYS = 45;
const MIN_ORDERS_FOR_A_REASON = 2;

function daysBetween(isoDate, now = new Date()) {
  const then = new Date(isoDate + 'T00:00:00Z');
  return Math.floor((now - then) / 86400000);
}

/** Every category the user has ever purchased from, with first/last purchase dates. */
export function categoryHistory(user) {
  const history = {};
  for (const order of user.orders) {
    for (const line of order.items) {
      const product = PRODUCTS_BY_ID[line.productId];
      if (!product) continue;
      const entry = (history[product.category] ??= {
        category: product.category,
        orderDates: [],
        totalSpend: 0,
        purchaseCount: 0,
      });
      if (!entry.orderDates.includes(order.date)) entry.orderDates.push(order.date);
      entry.totalSpend += product.price * line.qty;
      entry.purchaseCount += line.qty;
    }
  }
  for (const entry of Object.values(history)) {
    entry.orderDates.sort();
    entry.firstPurchase = entry.orderDates[0];
    entry.lastPurchase = entry.orderDates[entry.orderDates.length - 1];
    entry.distinctOrders = entry.orderDates.length;
  }
  return history;
}

/** Product ids the user has actually bought within a category. */
export function productsBoughtIn(user, category) {
  const ids = new Set();
  for (const order of user.orders) {
    for (const line of order.items) {
      const p = PRODUCTS_BY_ID[line.productId];
      if (p && p.category === category) ids.add(p.id);
    }
  }
  return [...ids];
}

/**
 * Which mode applies, if any.
 *
 * Mode B wins whenever both are eligible: the goal metric counts monthly recurrence, so converting
 * an existing one-off crossover into a repeat moves it, while a fresh first trial does not.
 */
export function decideMode(user, now = new Date()) {
  if (user.orders.length < MIN_ORDERS_FOR_A_REASON) {
    // Hard rule 4: no card rather than a card with a reason we cannot substantiate.
    return { mode: 'none', why: 'insufficient_history' };
  }

  const history = categoryHistory(user);
  const owned = Object.keys(history);
  const allOrderDates = user.orders.map((o) => o.date).sort();

  // Mode B: a genuine lapsed crossover.
  //
  // "Bought exactly once" is NOT sufficient on its own — it cannot distinguish a user who tried a
  // new category and reverted from one who simply buys that category rarely. The discriminator is
  // whether the user was already ordering *before* that first purchase without buying it: that is
  // what makes "new to them" a claim the data actually supports rather than an artifact of how far
  // back the history happens to go.
  const candidates = owned
    .map((c) => history[c])
    .filter((e) => e.distinctOrders === 1)
    .filter((e) => allOrderDates.some((d) => d < e.firstPurchase))
    .map((e) => ({ ...e, ageDays: daysBetween(e.lastPurchase, now) }))
    .filter((e) => e.ageDays >= MODE_B_MIN_DAYS && e.ageDays <= MODE_B_MAX_DAYS)
    .sort((a, b) => a.ageDays - b.ageDays); // freshest lapse first — most recoverable

  if (candidates.length > 0) {
    const pick = candidates[0];
    return {
      mode: 'B',
      category: pick.category,
      lapsedDays: pick.ageDays,
      triedProductIds: productsBoughtIn(user, pick.category),
      owned,
    };
  }

  return { mode: 'A', owned };
}

/**
 * The price anchor — the non-obvious core of the feature.
 *
 * A bare price ("₹185") does not answer the question users actually asked, which was "is this fair
 * compared to what I normally pay?". 13/40 survey respondents said comparison takes too long; this
 * does that comparison for them, expressed per week so items with different pack sizes and
 * consumption rates are directly comparable.
 *
 * Returns null when the user has no comparable spend to anchor against — better no anchor than a
 * meaningless one.
 */
export function priceAnchor(user, product) {
  const weeklyCostOf = (p) => (p.unitsPerWeek > 0 ? p.price * p.unitsPerWeek : null);
  const candidateWeekly = weeklyCostOf(product);
  if (candidateWeekly === null) return null;

  // Anchor against the user's own routine purchases in a similar price band, which is the
  // reference point they actually hold in their head.
  const theirWeekly = [];
  for (const order of user.orders) {
    for (const line of order.items) {
      const owned = PRODUCTS_BY_ID[line.productId];
      if (!owned || owned.category === product.category) continue;
      const w = weeklyCostOf(owned);
      if (w !== null) theirWeekly.push(w);
    }
  }
  if (theirWeekly.length === 0) return null;

  theirWeekly.sort((a, b) => a - b);
  const median = theirWeekly[Math.floor(theirWeekly.length / 2)];

  return {
    candidatePerWeek: Math.round(candidateWeekly),
    theirTypicalPerWeek: Math.round(median),
    cheaper: candidateWeekly <= median,
  };
}

/** Cheapest in-stock item in a category — the low-risk trial pack. */
export function trialPack(catalogue, category) {
  return catalogue
    .filter((p) => p.category === category && p.stock > 0)
    .sort((a, b) => a.price - b.price)[0] ?? null;
}

/** Most-reordered in-stock item — the trust signal. */
export function mostReordered(catalogue, category) {
  return catalogue
    .filter((p) => p.category === category && p.stock > 0)
    .sort((a, b) => a.reorderRank - b.reorderRank)[0] ?? null;
}

/** Cadence for a category the user already buys, used in Mode B's reason line. */
export function purchaseCadenceDays(user, category) {
  const entry = categoryHistory(user)[category];
  if (!entry || entry.orderDates.length < 2) return null;
  const gaps = [];
  for (let i = 1; i < entry.orderDates.length; i++) {
    gaps.push(daysBetween(entry.orderDates[i - 1], new Date(entry.orderDates[i] + 'T00:00:00Z')));
  }
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}
