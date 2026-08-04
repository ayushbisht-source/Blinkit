// Survey alignment audit — does the row still obey the constraints the survey imposed?
//
//   node mvp/evals/survey-alignment.mjs
//
// docs/02-user-research.md §4 turns the n=40 survey into design constraints rather than features.
// Going from one card to five changes how well the product meets several of them, in both
// directions, so this measures rather than assumes. It is a report, not a pass/fail eval: these are
// quantities and trade-offs, and a threshold would be invented.

import { USERS } from '../data/seed.js';
import { suggestMany } from '../agent/suggest.js';

const rows = [];
for (const user of USERS) {
  rows.push({ user, ...(await suggestMany(user, { limit: 5 })) });
}
const all = rows.flatMap((r) => r.cards);

// F3 — the three things the card must supply at the moment of consideration:
// fitness-for-need, a price anchor, a trust signal.
const withAnchor = all.filter((c) => c.anchorLine).length;
const withTrust = all.filter((c) => c.trust && c.trust.trim()).length;

// F3 again — "generic recommendations supply none of these". A reason resting on a population
// pattern ("people who buy X also buy Y") is a true statement about a crowd and a weak one about
// this shopper. A reason resting on a declared fact about the person is the strong case.
const population = all.filter((c) => /\b(common pairing|most people who)\b/i.test(c.reason)).length;
const personal = all.length - population;

// The backing-out data: "didn't really need it" (13) is the top abandonment reason, so
// relevance-to-need beats novelty. Declared signals are need evidence; adjacency is not.
const rowsLedByPersonal = rows.filter(
  (r) => r.cards.length > 0 && !/\b(common pairing|most people who)\b/i.test(r.cards[0].reason)
).length;
const rowsWithAnyPersonal = rows.filter((r) =>
  r.cards.some((c) => !/\b(common pairing|most people who)\b/i.test(c.reason))
).length;

// F2 — a ~2-minute fetch session. Row length is the honest proxy for how much reading was added.
const lengths = rows.map((r) => r.cards.length);
const mean = (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1);

console.log('\n── Survey alignment (docs/02-user-research.md §4) ──\n');

console.log('F3 — the three things every card must supply:');
console.log(`   price anchor present : ${withAnchor}/${all.length}`);
console.log(`   trust signal present : ${withTrust}/${all.length}`);
console.log(`   reason present       : ${all.length}/${all.length}  (hard rule 4 drops the rest)\n`);

console.log('F3 — strength of the reason, which the survey says is what fails:');
console.log(`   rests on a declared fact about the person : ${personal}/${all.length}`);
console.log(`   rests on a population pattern            : ${population}/${all.length}`);
console.log(`   rows whose LEAD card is personal         : ${rowsLedByPersonal}/${rows.length}`);
console.log(`   rows carrying at least one personal card : ${rowsWithAnyPersonal}/${rows.length}\n`);

console.log('F2 — the ~2-minute fetch session:');
console.log(`   row length min ${Math.min(...lengths)}, max ${Math.max(...lengths)}, mean ${mean}`);
console.log('   note: five entries is more to read than one. The spec amendment records this as the');
console.log('   cost of the row; the survey named comparison time as the #2 blocker (13/40).\n');

console.log('Where the population-pattern reasons land:');
for (const r of rows) {
  const weak = r.cards.filter((c) => /\b(common pairing|most people who)\b/i.test(c.reason));
  if (weak.length) {
    console.log(`   ${r.user.name}: ${weak.length}/${r.cards.length} — ${weak.map((c) => c.category).join(', ')}`);
  }
}
console.log(
  '\nA shopper who declares no lifestyle signal has nothing but adjacency available, so their row\n' +
    'rests entirely on population patterns. That is a property of the data the demo was seeded with,\n' +
    'not a bug — and it is the honest ceiling on what this feature can do without a richer profile.\n'
);
