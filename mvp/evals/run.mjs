// Eval suite for the One Thing agent.
//
//   node evals/run.mjs
//
// The first four checks are pass/fail correctness, not judgement calls — which is exactly what
// makes them worth having. "Is the recommendation good?" is arguable; "did it recommend a category
// the user already buys" is not. Each check corresponds to a hard rule in docs/04-mvp-spec.md, so
// the rules are enforced by tests rather than living only in prose.

import { USERS, CATALOGUE, PRODUCTS_BY_ID, CATEGORIES } from '../data/seed.js';
import { suggest } from '../agent/suggest.js';
import { categoryHistory, priceAnchor, MODE_B_MIN_DAYS, MODE_B_MAX_DAYS } from '../agent/eligibility.js';

const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

const cards = [];
for (const user of USERS) {
  cards.push({ user, out: await suggest(user) });
}

// ── Check 1 — Novelty (hard rule 2) ────────────────────────────────────────────────────────────
// Mode A must never surface a category the user already buys. This is the entire point of the
// feature; a familiar category is not merely unhelpful, it defeats the premise.
{
  let pass = true;
  const bad = [];
  for (const { user, out } of cards) {
    if (out.mode !== 'A' || !out.card) continue;
    const owned = Object.keys(categoryHistory(user));
    if (owned.includes(out.card.category)) {
      pass = false;
      bad.push(`${user.id}: suggested ${out.card.category}, already owns it`);
    }
  }
  record('novelty — Mode A never suggests an owned category', pass, bad.join('; '));
}

// ── Check 2 — Grounding (hard rule 3) ──────────────────────────────────────────────────────────
// Every suggested SKU must exist in the catalogue and be in stock. An agent that names a product
// the store cannot sell is a demo that dies live.
{
  let pass = true;
  const bad = [];
  for (const { user, out } of cards) {
    if (!out.card) continue;
    const p = PRODUCTS_BY_ID[out.card.product.id];
    if (!p) {
      pass = false;
      bad.push(`${user.id}: unknown SKU ${out.card.product.id}`);
    } else if (p.stock <= 0) {
      pass = false;
      bad.push(`${user.id}: ${p.name} out of stock`);
    } else if (p.name !== out.card.product.name || p.price !== out.card.product.price) {
      pass = false;
      bad.push(`${user.id}: card fields disagree with catalogue for ${p.id}`);
    }
  }
  record('grounding — every SKU exists, is in stock, fields match catalogue', pass, bad.join('; '));
}

// ── Check 3 — Reason validity (hard rule 4) ────────────────────────────────────────────────────
// The stated reason must be substantiated by the user's own order history or declared signals.
// This is the check that stops the feature degrading into "customers like you love this".
{
  let pass = true;
  const bad = [];
  const SIGNAL_PHRASES = {
    pet_owner: 'you have a pet',
    parent_young_child: 'you buy for a little one',
    cooks_daily: 'you cook most days',
  };

  for (const { user, out } of cards) {
    if (!out.card) continue;
    const reason = out.card.reason.toLowerCase();
    const owned = Object.keys(categoryHistory(user)).map((c) => c.toLowerCase());

    if (out.mode === 'B') {
      // Must reference the category they actually lapsed on.
      if (!reason.includes(out.card.category.toLowerCase())) {
        pass = false;
        bad.push(`${user.id}: Mode B reason omits the lapsed category`);
      }
      continue;
    }

    // Mode A: reason must cite either a genuinely owned category or a signal the user declared.
    const citesOwned = owned.some((c) => reason.includes(c));
    const declared = (user.signals ?? []).map((s) => SIGNAL_PHRASES[s]).filter(Boolean);
    const citesSignal = declared.some((phrase) => reason.includes(phrase));

    if (!citesOwned && !citesSignal) {
      pass = false;
      bad.push(`${user.id}: reason cites nothing verifiable — "${out.card.reason}"`);
    }

    // And must not claim a signal the user never declared.
    for (const [signal, phrase] of Object.entries(SIGNAL_PHRASES)) {
      if (reason.includes(phrase) && !(user.signals ?? []).includes(signal)) {
        pass = false;
        bad.push(`${user.id}: claims "${phrase}" but signal not declared`);
      }
    }
  }
  record('reason validity — every reason substantiated by history or declared signal', pass, bad.join('; '));
}

// ── Check 4 — Anchor arithmetic ────────────────────────────────────────────────────────────────
// The ₹/week figures must recompute exactly. The anchor is the feature's core claim; if the number
// is wrong the feature actively misleads, which is worse than showing nothing.
{
  let pass = true;
  const bad = [];
  for (const { user, out } of cards) {
    if (!out.card?.anchorLine) continue;
    const p = PRODUCTS_BY_ID[out.card.product.id];
    const expected = priceAnchor(user, p);
    const m = out.card.anchorLine.match(/~₹(\d+)\/week · your usual runs ~₹(\d+)\/week/);
    if (!m) {
      pass = false;
      bad.push(`${user.id}: anchor line unparseable`);
      continue;
    }
    if (Number(m[1]) !== expected.candidatePerWeek || Number(m[2]) !== expected.theirTypicalPerWeek) {
      pass = false;
      bad.push(`${user.id}: anchor mismatch — rendered ${m[1]}/${m[2]}, recomputed ${expected.candidatePerWeek}/${expected.theirTypicalPerWeek}`);
    }
  }
  record('anchor arithmetic — rendered ₹/week recomputes exactly', pass, bad.join('; '));
}

// ── Check 5 — Mode B window ────────────────────────────────────────────────────────────────────
{
  let pass = true;
  const bad = [];
  for (const { user, out } of cards) {
    if (out.mode !== 'B' || !out.card) continue;
    const lapsed = Number(out.rationale.join(' ').match(/lapsed (\d+)d/)?.[1]);
    if (!(lapsed >= MODE_B_MIN_DAYS && lapsed <= MODE_B_MAX_DAYS)) {
      pass = false;
      bad.push(`${user.id}: lapsed ${lapsed}d outside ${MODE_B_MIN_DAYS}-${MODE_B_MAX_DAYS}d window`);
    }
  }
  record(`Mode B fires only inside the ${MODE_B_MIN_DAYS}-${MODE_B_MAX_DAYS} day window`, pass, bad.join('; '));
}

// ── Check 6 — Silence is a valid outcome ───────────────────────────────────────────────────────
// A user with too little history must get no card. If this check fails, the agent is inventing
// reasons for users it knows nothing about.
{
  const thin = cards.find(({ user }) => user.orders.length < 2);
  const pass = thin ? thin.out.card === null : true;
  record(
    'silence — thin-history users receive no card',
    pass,
    thin && thin.out.card ? `${thin.user.id} got a card with ${thin.user.orders.length} order(s)` : ''
  );
}

// ── 7. A category the user has closed is never suggested ────────────────────────────────────────
//
// This rule exists because of the interviews, not the survey. P04 buys groceries from the kirana
// next door "like from ages"; P05 abandoned produce permanently after one bad delivery. Both are
// never-purchased categories with real adjacency, so every heuristic in this agent scores them
// highly — and a card for either would be technically valid and substantively wrong.
//
// Checked on both paths, because they are separate code: Mode A filters candidates, and Mode B
// replays a previously-tried category and would otherwise walk straight past the filter. A user who
// tried produce once and closed it is exactly the profile Mode B targets on the numbers.
{
  const withAvoid = cards.filter(({ user }) => (user.avoid ?? []).length > 0);
  const violations = withAvoid.filter(
    ({ user, out }) => out.card && user.avoid.some((a) => a.category === out.card.category)
  );
  record(
    'closed categories are never suggested (Mode A and Mode B)',
    withAvoid.length > 0 && violations.length === 0,
    withAvoid.length === 0
      ? 'no seeded user declares an avoid list — this check did not run'
      : violations.map(({ user, out }) => `${user.id} was shown ${out.card.category}`).join('; ')
  );
}

// ── Coverage report (informational, not pass/fail) ──────────────────────────────────────────────
const byMode = cards.reduce((acc, { out }) => {
  const k = out.card ? out.mode : `${out.mode}/no-card`;
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});

console.log('\n── One Thing — eval suite ──\n');
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}`);
  if (r.detail) console.log(`      ${r.detail}`);
}
console.log(`\ncoverage across ${cards.length} seeded users:`, byMode);
console.log(`catalogue: ${CATALOGUE.length} SKUs across ${CATEGORIES.length} categories\n`);

const failed = results.filter((r) => !r.pass).length;
if (failed > 0) {
  console.error(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log('All checks passed.\n');
