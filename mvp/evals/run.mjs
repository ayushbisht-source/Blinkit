// Eval suite for the One Thing agent.
//
//   node evals/run.mjs
//
// The first four checks are pass/fail correctness, not judgement calls — which is exactly what
// makes them worth having. "Is the recommendation good?" is arguable; "did it recommend a category
// the user already buys" is not. Each check corresponds to a hard rule in docs/04-mvp-spec.md, so
// the rules are enforced by tests rather than living only in prose.

import { USERS, CATALOGUE, PRODUCTS_BY_ID, CATEGORIES } from '../data/seed.js';
import { suggest, suggestMany, SIGNAL_PHRASE } from '../agent/suggest.js';
import {
  categoryHistory,
  priceAnchor,
  countsTowardCER,
  MODE_B_MIN_DAYS,
  MODE_B_MAX_DAYS,
} from '../agent/eligibility.js';

const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

// A check whose precondition no seeded shopper meets is reported NOT RUN, never PASS. It is not
// evidence, and printing it green would make the suite look stronger than it is — the same reason
// engine/validation/checks.py reports the source-spread and kappa checks that way.
const notRun = (name, why) => results.push({ name, pass: true, skipped: true, detail: why });

const MAX_SUGGESTIONS = 5;

const cards = [];
for (const user of USERS) {
  cards.push({ user, out: await suggest(user), many: await suggestMany(user, { limit: MAX_SUGGESTIONS }) });
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
  // Imported, not restated. This table used to be a second copy, and when the agent gained seven
  // lifestyle signals the copy did not — so the "reason cites nothing verifiable" arm produced
  // eight false failures, and, more quietly, the "claims a signal the user never declared" arm
  // stopped covering those seven signals entirely. A duplicated constant is a check that silently
  // narrows.
  const SIGNAL_PHRASES = Object.fromEntries(
    Object.entries(SIGNAL_PHRASE).map(([k, v]) => [k, v.toLowerCase()])
  );

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
  if (!thin) {
    // Every seeded shopper has 3-4 orders, so there is nothing here to assert. This used to report
    // PASS, which was a green line standing for zero observations.
    notRun(
      'silence — thin-history users receive no card',
      'no seeded shopper has fewer than 2 orders; the suppression path is covered instead by the ' +
        'closed-category check below'
    );
  } else {
    record(
      'silence — thin-history users receive no card',
      thin.out.card === null,
      thin.out.card ? `${thin.user.id} got a card with ${thin.user.orders.length} order(s)` : ''
    );
  }
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

// ── 8. The five-card row obeys every rule the single card obeys ─────────────────────────────────
//
// Showing five suggestions instead of one multiplies by five whatever the agent gets wrong, so the
// row is held to the same hard rules rather than treated as a display concern: never an owned
// category, never a closed one, never an unbuyable SKU, and never more than the cap.
{
  let pass = true;
  const bad = [];
  for (const { user, many } of cards) {
    const owned = Object.keys(categoryHistory(user));
    const closed = new Set((user.avoid ?? []).map((a) => a.category));

    if (many.cards.length > MAX_SUGGESTIONS) {
      pass = false;
      bad.push(`${user.id}: ${many.cards.length} cards exceeds the cap of ${MAX_SUGGESTIONS}`);
    }

    // Asserted at a limit that actually binds. No seeded shopper currently has more than five
    // substantiated candidates, so testing the cap only at five would pass even with the cap
    // deleted — a check that cannot fail is not evidence of anything.
    const capped = await suggestMany(user, { limit: 2 });
    if (capped.cards.length > 2) {
      pass = false;
      bad.push(`${user.id}: limit=2 returned ${capped.cards.length} cards`);
    }

    for (const c of many.cards) {
      if (c.mode === 'A' && owned.includes(c.category)) {
        pass = false;
        bad.push(`${user.id}: row offers ${c.category}, already owned`);
      }
      if (closed.has(c.category)) {
        pass = false;
        bad.push(`${user.id}: row offers ${c.category}, closed by the user`);
      }
      const p = PRODUCTS_BY_ID[c.product.id];
      if (!p || p.stock <= 0 || p.name !== c.product.name || p.price !== c.product.price) {
        pass = false;
        bad.push(`${user.id}: row SKU ${c.product.id} missing, out of stock, or mismatched`);
      }
    }
  }
  record(`the ${MAX_SUGGESTIONS}-card row keeps novelty, avoidance, stock and the cap`, pass, bad.join('; '));
}

// ── 9. Every row entry is a distinct new category ───────────────────────────────────────────────
//
// The strategic goal counts customers who buy from at least one *new category* in a month. Five
// products from one category would be five shots at a single target; five categories are five
// targets. A duplicate category in the row is therefore a wasted slot, not a cosmetic repeat.
{
  let pass = true;
  const bad = [];
  for (const { user, many } of cards) {
    const seen = new Set();
    for (const c of many.cards) {
      if (seen.has(c.category)) {
        pass = false;
        bad.push(`${user.id}: ${c.category} appears twice in the row`);
      }
      seen.add(c.category);
    }
  }
  record('every suggestion in the row opens a different new category', pass, bad.join('; '));
}

// ── 10. Silence still survives the row ──────────────────────────────────────────────────────────
//
// The easiest way to break this feature is to fill five slots because five were asked for. A user
// with too little history must get an empty row, and a user who has closed a category must not see
// it reappear simply because there were slots left to fill.
{
  const withAvoid = cards.filter(({ user }) => (user.avoid ?? []).length > 0);
  const failures = [];
  for (const { user, many } of withAvoid) {
    const closed = new Set(user.avoid.map((a) => a.category));
    for (const c of many.cards) {
      if (closed.has(c.category)) failures.push(`${user.id} was offered ${c.category} to fill the row`);
    }
  }
  record(
    'the row is never padded with a category the shopper has closed',
    withAvoid.length > 0 && failures.length === 0,
    withAvoid.length === 0 ? 'no seeded shopper declares an avoid list' : failures.join('; ')
  );
}

// ── 11. The brief's three named crossovers actually happen ──────────────────────────────────────
//
// The strategic goal names three examples: groceries → pet supplies, snacks → personal care,
// household essentials → baby products. Those are reached by declared lifestyle signals, not by the
// category-adjacency graph, so this check ties the goal to the code: a shopper who declares the
// signal, has never bought the category and has not closed it must be offered it in the row.
//
// Membership in the row is too weak a bar to assert: with five slots the goal category still lands
// somewhere even if signal scoring is gutted. So the check asserts *rank* — the declared signal must
// be the leading first-crossover pick — which is the property that fails the moment signals stop
// outranking generic adjacency, the exact regression that turns this back into "customers like you
// also bought".
{
  const GOAL = {
    pet_owner: 'Pet Supplies',
    skincare_routine: 'Personal Care',
    parent_young_child: 'Baby Care',
  };
  let pass = true;
  const bad = [];
  let exercised = 0;

  for (const { user, many } of cards) {
    const owned = Object.keys(categoryHistory(user));
    const closed = new Set((user.avoid ?? []).map((a) => a.category));
    for (const [signal, category] of Object.entries(GOAL)) {
      if (!(user.signals ?? []).includes(signal)) continue;
      if (owned.includes(category) || closed.has(category)) continue;
      exercised++;
      // Mode B leads the row when it is eligible, so rank is measured among first-crossover picks.
      const firstCrossover = many.cards.find((c) => c.mode === 'A');
      if (!many.cards.some((c) => c.category === category)) {
        pass = false;
        bad.push(`${user.id}: declares ${signal} but the row never offers ${category}`);
      } else if (firstCrossover?.category !== category) {
        pass = false;
        bad.push(
          `${user.id}: declares ${signal} but ${firstCrossover?.category} leads instead of ${category}`
        );
      }
    }
  }
  record(
    `the brief's named crossovers reach the row (${exercised} signal/category pairs exercised)`,
    pass && exercised > 0,
    exercised === 0 ? 'no seeded shopper declares one of the three signals — check did not run' : bad.join('; ')
  );
}

// ── 12. The lead slot goes to a suggestion that can actually move the metric ────────────────────
//
// CER counts a purchase in month M from a category absent in M-1 … M-6. A Mode B repeat sits inside
// that lookback by construction — the category was tried 14-45 days ago — so it cannot register,
// however well it converts. The most prominent slot therefore belongs to a card that counts.
//
// This is the check that catches the error the spec used to contain in prose: that Mode B was "the
// metric-moving mode". It is the *secondary*-metric mode. Ranking it first spent the best slot on
// the one card guaranteed to score zero against the goal.
{
  let pass = true;
  const bad = [];
  let exercised = 0;

  for (const { user, many } of cards) {
    if (many.cards.length === 0) continue;
    const anyCounts = many.cards.some((c) => c.countsTowardCER);
    if (!anyCounts) continue; // nothing in the row could count; no ranking choice to make
    exercised++;
    if (!many.cards[0].countsTowardCER) {
      pass = false;
      bad.push(`${user.id}: row leads with ${many.cards[0].category} (${many.cards[0].mode}), which cannot count`);
    }
  }

  // And the flag itself must agree with the metric definition rather than being decorative.
  for (const { user, many } of cards) {
    for (const c of many.cards) {
      if (c.countsTowardCER !== countsTowardCER(user, c.category)) {
        pass = false;
        bad.push(`${user.id}: countsTowardCER on ${c.category} disagrees with the lookback`);
      }
    }
  }

  record(
    `the row leads with a CER-eligible suggestion (${exercised} rows exercised)`,
    pass && exercised > 0,
    exercised === 0 ? 'no row contained a CER-eligible card — check did not run' : bad.join('; ')
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
  console.log(`${r.skipped ? 'NOT RUN' : r.pass ? 'PASS' : 'FAIL'}  ${r.name}`);
  if (r.detail) console.log(`      ${r.detail}`);
}
const rowSizes = cards.map(({ many }) => many.cards.length);
console.log(`\ncoverage across ${cards.length} seeded users:`, byMode);
console.log(
  `row size (cap ${MAX_SUGGESTIONS}): min ${Math.min(...rowSizes)}, max ${Math.max(...rowSizes)}, ` +
    `mean ${(rowSizes.reduce((a, b) => a + b, 0) / rowSizes.length).toFixed(1)} — ` +
    `short rows are candidates dropped for want of a substantiated reason, not a bug`
);
console.log(`catalogue: ${CATALOGUE.length} SKUs across ${CATEGORIES.length} categories\n`);

const failed = results.filter((r) => !r.pass && !r.skipped).length;
const skipped = results.filter((r) => r.skipped).length;
if (failed > 0) {
  console.error(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log(
  `${results.length - skipped} check(s) passed` + (skipped ? `, ${skipped} not run.\n` : '.\n')
);
