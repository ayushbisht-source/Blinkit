// CER audit — does the row actually move the metric the brief names?
//
//   node mvp/evals/cer-audit.mjs
//
// The strategic goal is "% of Monthly Active Customers who purchase from at least one NEW category
// every month", formalised in docs/00-foundation.md as:
//
//   CER(M) = users who purchased from category C in month M, where C is in none of M-1 … M-6
//            ──────────────────────────────────────────────────────────────────────────────
//                                users with >=1 order in M
//
// The 6-month lookback is what this audit exists to take seriously. A suggestion only counts toward
// CER if accepting it would put the shopper into a category they have not bought from in the
// previous six months. Anything else may be a good suggestion — it is not a CER suggestion.
//
// This is deliberately a separate report rather than a pass/fail eval: it measures how well the
// product serves the goal, which is a quantity, not a rule.

import { USERS, PRODUCTS_BY_ID } from '../data/seed.js';
import { suggestMany } from '../agent/suggest.js';
import { categoryHistory } from '../agent/eligibility.js';

const LOOKBACK_DAYS = 182; // six months
const now = new Date();
const daysSince = (iso) => Math.floor((now - new Date(iso + 'T00:00:00Z')) / 86400000);

/** Categories bought within the lookback — the ones CER will NOT count as new. */
function categoriesInLookback(user) {
  const seen = new Set();
  for (const [category, entry] of Object.entries(categoryHistory(user))) {
    if (entry.orderDates.some((d) => daysSince(d) <= LOOKBACK_DAYS)) seen.add(category);
  }
  return seen;
}

let totalCards = 0;
let cerEligible = 0;
let usersWithAtLeastOne = 0;
const rows = [];

for (const user of USERS) {
  const excluded = categoriesInLookback(user);
  const { cards } = await suggestMany(user, { limit: 5 });

  const marked = cards.map((c) => ({ ...c, counts: !excluded.has(c.category) }));
  const n = marked.filter((c) => c.counts).length;

  totalCards += marked.length;
  cerEligible += n;
  if (n > 0) usersWithAtLeastOne++;

  rows.push({ user, marked, n });
}

console.log('\n── CER audit — would accepting a suggestion count toward the goal? ──\n');
console.log(`lookback: ${LOOKBACK_DAYS} days, per docs/00-foundation.md\n`);

for (const { user, marked, n } of rows) {
  console.log(`${user.name} — ${n}/${marked.length} of the row counts toward CER`);
  for (const c of marked) {
    const flag = c.counts ? 'counts  ' : 'does NOT';
    const note = c.counts ? '' : `  (bought within the lookback — CER excludes it)`;
    console.log(`   ${flag}  ${c.mode}  ${c.category}${note}`);
  }
}

console.log(`\nrow cards that would count: ${cerEligible}/${totalCards}`);
console.log(`shoppers offered at least one CER-eligible category: ${usersWithAtLeastOne}/${USERS.length}`);

// The brief's three named crossovers, checked as CER events specifically.
const GOAL = {
  pet_owner: 'Pet Supplies',
  skincare_routine: 'Personal Care',
  parent_young_child: 'Baby Care',
};
console.log('\nthe brief\'s named crossovers:');
for (const { user, marked } of rows) {
  for (const [signal, category] of Object.entries(GOAL)) {
    if (!(user.signals ?? []).includes(signal)) continue;
    const card = marked.find((c) => c.category === category);
    const state = !card
      ? 'not offered'
      : card.counts
        ? 'offered and would count toward CER'
        : 'offered but would NOT count (already bought inside the lookback)';
    console.log(`   ${user.name} · ${signal} -> ${category}: ${state}`);
  }
}
console.log();
