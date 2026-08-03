// Seed data for the One Thing MVP.
//
// Synthetic, but deliberately shaped to match what the research found so the demo exercises the
// real decision logic rather than a happy path:
//   - most users are concentrated in 1-2 categories (the "Habitual Narrow Repeater" segment)
//   - some crossed over exactly once and never returned  -> Mode B's target
//   - some have genuinely broad baskets                  -> must NOT receive a Mode A card
//   - one user's breadth comes from order consolidation, not curiosity — the persona-derived
//     hypothesis from Part 2 that's worth staying honest about

export const CATEGORIES = [
  'Fruits & Vegetables',
  'Dairy & Bread',
  'Snacks & Beverages',
  'Household Essentials',
  'Personal Care',
  'Baby Care',
  'Pet Supplies',
  'Home & Kitchen',
  'Health & Pharma',
  'Frozen Food',
  'Tea & Coffee',
  'Cleaning Supplies',
];

// unitsPerWeek is the typical consumption rate, used to compute the ₹/week price anchor.
// reorderRank stands in for "most reordered in this category" — the trust signal.
export const CATALOGUE = [
  { id: 'db1', name: 'Amul Taaza Milk', category: 'Dairy & Bread', price: 33, pack: '500ml', unitsPerWeek: 7, stock: 40, reorderRank: 1 },
  { id: 'db2', name: 'Britannia Brown Bread', category: 'Dairy & Bread', price: 45, pack: '400g', unitsPerWeek: 1.5, stock: 25, reorderRank: 2 },
  { id: 'db3', name: 'Amul Butter', category: 'Dairy & Bread', price: 62, pack: '100g', unitsPerWeek: 0.5, stock: 30, reorderRank: 3 },

  { id: 'sb1', name: "Lay's Classic Salted", category: 'Snacks & Beverages', price: 20, pack: '52g', unitsPerWeek: 3, stock: 60, reorderRank: 1 },
  { id: 'sb2', name: 'Coca-Cola', category: 'Snacks & Beverages', price: 40, pack: '750ml', unitsPerWeek: 2, stock: 50, reorderRank: 2 },
  { id: 'sb3', name: 'Parle-G Biscuits', category: 'Snacks & Beverages', price: 10, pack: '80g', unitsPerWeek: 4, stock: 80, reorderRank: 3 },

  { id: 'fv1', name: 'Bananas', category: 'Fruits & Vegetables', price: 48, pack: '6 pcs', unitsPerWeek: 1, stock: 35, reorderRank: 1 },
  { id: 'fv2', name: 'Tomatoes', category: 'Fruits & Vegetables', price: 32, pack: '500g', unitsPerWeek: 2, stock: 40, reorderRank: 2 },
  { id: 'fv3', name: 'Onions', category: 'Fruits & Vegetables', price: 38, pack: '1kg', unitsPerWeek: 1, stock: 45, reorderRank: 3 },

  { id: 'he1', name: 'Surf Excel Easy Wash', category: 'Household Essentials', price: 125, pack: '1kg', unitsPerWeek: 0.25, stock: 20, reorderRank: 1 },
  { id: 'he2', name: 'Vim Dishwash Gel', category: 'Household Essentials', price: 99, pack: '500ml', unitsPerWeek: 0.3, stock: 22, reorderRank: 2 },

  { id: 'pc1', name: 'Colgate Strong Teeth', category: 'Personal Care', price: 55, pack: '100g', unitsPerWeek: 0.25, stock: 30, reorderRank: 1 },
  { id: 'pc2', name: 'Dove Soap', category: 'Personal Care', price: 65, pack: '100g', unitsPerWeek: 0.5, stock: 28, reorderRank: 2 },
  { id: 'pc3', name: 'Head & Shoulders Shampoo', category: 'Personal Care', price: 199, pack: '340ml', unitsPerWeek: 0.15, stock: 18, reorderRank: 3 },

  // Trial-size options matter most here: a small pack is what makes a first purchase low-risk.
  { id: 'ps1', name: 'Pedigree Chicken Chunks', category: 'Pet Supplies', price: 99, pack: '400g', unitsPerWeek: 3.5, stock: 15, reorderRank: 1 },
  { id: 'ps2', name: 'Pedigree Adult Dry Food', category: 'Pet Supplies', price: 349, pack: '1.2kg', unitsPerWeek: 1, stock: 12, reorderRank: 2 },
  { id: 'ps3', name: 'Whiskas Tuna Cat Food', category: 'Pet Supplies', price: 85, pack: '450g', unitsPerWeek: 2, stock: 14, reorderRank: 3 },
  { id: 'ps4', name: 'Drools Puppy Treats', category: 'Pet Supplies', price: 65, pack: '150g', unitsPerWeek: 1, stock: 20, reorderRank: 4 },

  { id: 'bc1', name: 'Pampers Baby Dry Pants', category: 'Baby Care', price: 399, pack: '30 pcs', unitsPerWeek: 1, stock: 16, reorderRank: 1 },
  { id: 'bc2', name: "Johnson's Baby Wipes", category: 'Baby Care', price: 199, pack: '72 pcs', unitsPerWeek: 0.5, stock: 20, reorderRank: 2 },
  { id: 'bc3', name: 'Cerelac Wheat Apple', category: 'Baby Care', price: 285, pack: '300g', unitsPerWeek: 0.5, stock: 14, reorderRank: 3 },

  { id: 'hk1', name: 'Milton Steel Bottle', category: 'Home & Kitchen', price: 449, pack: '750ml', unitsPerWeek: 0, stock: 10, reorderRank: 1 },
  { id: 'hk2', name: 'Scotch-Brite Scrub Pad', category: 'Home & Kitchen', price: 45, pack: '3 pcs', unitsPerWeek: 0.2, stock: 30, reorderRank: 2 },

  { id: 'hp1', name: 'Dettol Antiseptic Liquid', category: 'Health & Pharma', price: 145, pack: '250ml', unitsPerWeek: 0.15, stock: 18, reorderRank: 1 },
  { id: 'hp2', name: 'Volini Pain Relief Spray', category: 'Health & Pharma', price: 215, pack: '60g', unitsPerWeek: 0.1, stock: 12, reorderRank: 2 },

  { id: 'ff1', name: 'McCain French Fries', category: 'Frozen Food', price: 135, pack: '420g', unitsPerWeek: 0.5, stock: 20, reorderRank: 1 },
  { id: 'ff2', name: 'Sumeru Green Peas', category: 'Frozen Food', price: 85, pack: '500g', unitsPerWeek: 0.5, stock: 22, reorderRank: 2 },

  { id: 'tc1', name: 'Red Label Tea', category: 'Tea & Coffee', price: 155, pack: '500g', unitsPerWeek: 0.2, stock: 25, reorderRank: 1 },
  { id: 'tc2', name: 'Nescafe Classic', category: 'Tea & Coffee', price: 295, pack: '100g', unitsPerWeek: 0.15, stock: 16, reorderRank: 2 },

  { id: 'cs1', name: 'Harpic Toilet Cleaner', category: 'Cleaning Supplies', price: 105, pack: '500ml', unitsPerWeek: 0.2, stock: 24, reorderRank: 1 },
  { id: 'cs2', name: 'Lizol Floor Cleaner', category: 'Cleaning Supplies', price: 185, pack: '975ml', unitsPerWeek: 0.2, stock: 18, reorderRank: 2 },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const USERS = [
  {
    id: 'u1',
    tag: 'Snack & Dairy Regular',
    household: 'Alone',
    name: 'Arjun Saxena',
    subtitle: 'Dairy &amp; snacks only · lives alone',
    provenance: 'Textbook target segment',
    label: 'Narrow Repeater — dairy + snacks only',
    expect: 'Mode A. Textbook target segment: frequent, 2 categories, never crossed over.',
    signals: ['lives_alone', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'db1', qty: 2 }, { productId: 'sb1', qty: 2 }] },
      { date: daysAgo(9), items: [{ productId: 'db1', qty: 2 }, { productId: 'db2', qty: 1 }, { productId: 'sb3', qty: 3 }] },
      { date: daysAgo(16), items: [{ productId: 'db1', qty: 2 }, { productId: 'sb1', qty: 1 }] },
      { date: daysAgo(24), items: [{ productId: 'db1', qty: 3 }, { productId: 'sb2', qty: 2 }] },
    ],
  },
  {
    id: 'u2',
    tag: 'Lapsed Pet Buyer',
    household: 'With family',
    name: 'Priya Sharma',
    subtitle: 'Tried pet supplies once, 28 days ago',
    provenance: 'P03 · the Mode B case',
    label: 'Crossed once into Pet Supplies, 28 days ago, never returned',
    expect: 'Mode B — the metric-moving case. Replenishment prompt for Pet Supplies.',
    signals: ['pet_owner', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'db1', qty: 2 }, { productId: 'fv1', qty: 1 }] },
      { date: daysAgo(11), items: [{ productId: 'db1', qty: 2 }, { productId: 'sb1', qty: 2 }] },
      // the one-off crossover — bought trial-size pet food once and reverted
      { date: daysAgo(28), items: [{ productId: 'ps1', qty: 1 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(35), items: [{ productId: 'db1', qty: 2 }, { productId: 'fv2', qty: 2 }] },
    ],
  },
  {
    id: 'u3',
    tag: 'Wide Basket Explorer',
    household: 'With family',
    name: 'Neha Joshi',
    subtitle: 'Six categories already',
    provenance: 'Tests the novelty assertion',
    label: 'Genuinely broad basket — 6 categories',
    expect: 'No Mode A card for owned categories. Tests the novelty assertion.',
    signals: ['cooks_daily', 'tier1_metro'],
    orders: [
      { date: daysAgo(4), items: [{ productId: 'db1', qty: 2 }, { productId: 'fv1', qty: 1 }, { productId: 'pc1', qty: 1 }] },
      { date: daysAgo(12), items: [{ productId: 'he1', qty: 1 }, { productId: 'cs1', qty: 1 }, { productId: 'tc1', qty: 1 }] },
      { date: daysAgo(20), items: [{ productId: 'sb1', qty: 2 }, { productId: 'fv3', qty: 1 }, { productId: 'pc2', qty: 2 }] },
    ],
  },
  {
    id: 'u4',
    tag: 'Bulk Consolidator',
    household: 'With family / Roommates',
    name: 'Rahul Verma',
    subtitle: 'Infrequent, wide basket',
    provenance: 'Bundles rather than browses',
    label: 'Consolidator — infrequent but wide basket',
    expect: 'Breadth from batching, not curiosity. Should NOT read as an explorer.',
    signals: ['lives_alone', 'student', 'tier2_plus'],
    orders: [
      // one big order every ~3 weeks covering everything at once
      { date: daysAgo(6), items: [
        { productId: 'db1', qty: 4 }, { productId: 'sb1', qty: 3 }, { productId: 'pc1', qty: 1 },
        { productId: 'he2', qty: 1 }, { productId: 'fv1', qty: 2 },
      ] },
      { date: daysAgo(27), items: [
        { productId: 'db1', qty: 4 }, { productId: 'sb3', qty: 4 }, { productId: 'pc2', qty: 2 },
        { productId: 'he1', qty: 1 },
      ] },
    ],
  },
  {
    id: 'u5',
    tag: 'New Parent & Regular',
    household: 'With family',
    name: 'Sneha Reddy',
    subtitle: 'Baby care already established',
    provenance: 'P04 · buys baby care on-app',
    label: 'Parent — baby care already established',
    expect: 'Mode A into an adjacent unowned category, never Baby Care.',
    signals: ['parent_young_child', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(1), items: [{ productId: 'bc1', qty: 1 }, { productId: 'db1', qty: 3 }] },
      { date: daysAgo(7), items: [{ productId: 'bc2', qty: 1 }, { productId: 'db1', qty: 2 }, { productId: 'fv1', qty: 1 }] },
      { date: daysAgo(14), items: [{ productId: 'bc1', qty: 1 }, { productId: 'sb3', qty: 2 }] },
    ],
  },
  {
    id: 'u6',
    tag: 'Recent Crosser',
    household: 'Alone',
    name: 'Karan Gupta',
    subtitle: 'Personal care, 40 days ago',
    provenance: 'Outside the Mode B window',
    label: 'Crossed into Personal Care 40 days ago',
    expect: 'Mode B at the outer edge of the 14-45 day window.',
    signals: ['working_professional', 'lives_alone'],
    orders: [
      { date: daysAgo(5), items: [{ productId: 'db1', qty: 2 }, { productId: 'sb2', qty: 2 }] },
      { date: daysAgo(18), items: [{ productId: 'db1', qty: 2 }, { productId: 'db2', qty: 1 }] },
      { date: daysAgo(40), items: [{ productId: 'pc3', qty: 1 }, { productId: 'db1', qty: 2 }] },
      // Prior activity WITHOUT personal care. Required for the day-40 purchase to count as a
      // genuine crossover rather than an artifact of the history window starting there.
      { date: daysAgo(52), items: [{ productId: 'db1', qty: 2 }, { productId: 'sb1', qty: 2 }] },
      { date: daysAgo(61), items: [{ productId: 'db1', qty: 3 }] },
    ],
  },
  {
    id: 'u7',
    tag: 'First-Time Shopper',
    household: 'Alone',
    name: 'Ayesha Khan',
    subtitle: 'One order on record',
    provenance: 'Not enough history to suggest',
    label: 'Brand-new user — one order',
    expect: 'No card. Insufficient history to state a true reason (hard rule 4).',
    signals: [],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'db1', qty: 1 }, { productId: 'sb1', qty: 1 }] },
    ],
  },

  // ── Two personas taken from interviews where the correct answer is NO CARD ──────────────
  //
  // These exist because the demo is more honest with them than without. P04 and P05 describe
  // barriers that no in-app information closes (docs/03 §2), so an agent suggesting anything here
  // is simply wrong — and until these profiles existed, the demo had no way to show that.
  {
    id: 'u8',
    tag: 'New Mother & Kirana Loyalist',
    household: 'With family',
    name: 'Lakshmi Nambiar',
    subtitle: 'Buys staples next door, "like from ages"',
    provenance: 'P04 · incumbent supplier',
    label: 'Kirana loyalist — buys staples offline by habit',
    expect: 'NO staples card. Dairy scores top on adjacency; the user has an incumbent supplier.',
    signals: ['parent_young_child', 'tier2_plus'],
    avoid: [
      { category: 'Dairy & Bread', kind: 'incumbent', note: 'buys from the kirana next door' },
      { category: 'Fruits & Vegetables', kind: 'incumbent', note: 'buys from the kirana next door' },
    ],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'bc1', qty: 1 }, { productId: 'ff1', qty: 1 }, { productId: 'sb1', qty: 2 }] },
      { date: daysAgo(9), items: [{ productId: 'bc1', qty: 1 }, { productId: 'ff2', qty: 2 }, { productId: 'sb3', qty: 3 }] },
      { date: daysAgo(18), items: [{ productId: 'bc2', qty: 2 }, { productId: 'ff1', qty: 1 }, { productId: 'sb1', qty: 1 }] },
      { date: daysAgo(27), items: [{ productId: 'bc1', qty: 1 }, { productId: 'ff2', qty: 1 }, { productId: 'sb2', qty: 2 }] },
    ],
  },
  {
    id: 'u9',
    tag: 'Produce Sceptic',
    household: 'With family',
    name: 'Rohit Bhardwaj',
    subtitle: 'Tried veg once, one bad delivery, never again',
    provenance: 'P05 · settled negative belief',
    label: 'Trust breach — tried fruit & veg once and closed the category',
    expect: 'NO CARD. On the numbers this is a textbook Mode B target; the user has closed it.',
    signals: ['cooks_daily', 'tier1_metro'],
    avoid: [
      { category: 'Fruits & Vegetables', kind: 'distrust', note: 'one bad delivery, category closed' },
    ],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'db1', qty: 2 }, { productId: 'he1', qty: 1 }] },
      { date: daysAgo(11), items: [{ productId: 'db1', qty: 2 }, { productId: 'cs1', qty: 1 }] },
      // the single produce order, and the last one — "one time I got really bad vegetables"
      { date: daysAgo(25), items: [{ productId: 'fv2', qty: 1 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(33), items: [{ productId: 'db1', qty: 3 }, { productId: 'db2', qty: 1 }] },
    ],
  },

  // ── Fifteen lifestyle profiles ────────────────────────────────────────────────────────────────
  //
  // Each one is narrow by design: a concentrated basket plus one declared fact about the person.
  // That combination is what the strategic goal actually needs — the goal is not "suggest
  // something", it is a *new category* per month, so a profile that already buys widely has
  // nothing to cross into and a profile with no declared fact has no true reason to offer.
  //
  // The brief's three worked examples appear here deliberately:
  //   groceries -> pet supplies         Diya, Vikram
  //   snacks -> personal care           Kabir, Sana
  //   household essentials -> baby care Meera
  {
    id: 'p01', name: 'Aarav Menon', tag: 'Gym Goer & Tech Single', household: 'Alone',
    label: 'Gym goer — snacks and dairy only', expect: 'Mode A into Health & Pharma via gym_goer.',
    signals: ['gym_goer', 'lives_alone', 'working_professional'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'sb1', qty: 3 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(8), items: [{ productId: 'sb2', qty: 4 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(17), items: [{ productId: 'sb3', qty: 5 }, { productId: 'db3', qty: 1 }] },
    ],
  },
  {
    id: 'p02', name: 'Diya Kulkarni', tag: 'New Puppy Owner', household: 'With family',
    label: 'Grocery regular who just got a puppy',
    expect: "The brief's first example: groceries -> pet supplies, via a declared pet.",
    signals: ['pet_owner', 'tier1_metro'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'fv1', qty: 2 }, { productId: 'db1', qty: 3 }] },
      { date: daysAgo(10), items: [{ productId: 'fv2', qty: 2 }, { productId: 'db2', qty: 1 }] },
      { date: daysAgo(19), items: [{ productId: 'fv3', qty: 1 }, { productId: 'db1', qty: 3 }] },
    ],
  },
  {
    id: 'p03', name: 'Kabir Rane', tag: 'Night-Shift Coder', household: 'Alone',
    label: 'Late-night snacker with a skincare habit',
    expect: "The brief's second example: snacks -> personal care.",
    signals: ['skincare_routine', 'lives_alone', 'working_professional'],
    orders: [
      { date: daysAgo(1), items: [{ productId: 'sb2', qty: 3 }, { productId: 'sb1', qty: 2 }] },
      { date: daysAgo(6), items: [{ productId: 'sb3', qty: 4 }] },
      { date: daysAgo(14), items: [{ productId: 'sb1', qty: 3 }, { productId: 'sb2', qty: 2 }] },
    ],
  },
  {
    id: 'p04', name: 'Meera Iyer', tag: 'Young Family & Home Runner', household: 'With family',
    label: 'Household-essentials buyer with a young child',
    expect: "The brief's third example: household essentials -> baby care.",
    signals: ['parent_young_child', 'tier2_plus'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'he1', qty: 1 }, { productId: 'he2', qty: 1 }] },
      { date: daysAgo(11), items: [{ productId: 'he1', qty: 1 }, { productId: 'cs1', qty: 1 }] },
      { date: daysAgo(21), items: [{ productId: 'he2', qty: 2 }, { productId: 'cs2', qty: 1 }] },
    ],
  },
  {
    id: 'p05', name: 'Rohan Deshpande', tag: 'Weekend Cook', household: 'With family / Roommates',
    label: 'Buys fresh produce, no kitchen kit', expect: 'Mode A into Home & Kitchen via cooks_daily.',
    signals: ['cooks_daily', 'tier1_metro'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'fv2', qty: 3 }, { productId: 'fv3', qty: 2 }] },
      { date: daysAgo(9), items: [{ productId: 'fv1', qty: 2 }, { productId: 'fv2', qty: 2 }] },
      { date: daysAgo(18), items: [{ productId: 'fv3', qty: 2 }, { productId: 'fv1', qty: 1 }] },
    ],
  },
  {
    id: 'p06', name: 'Sana Qureshi', tag: 'Hostel Student', household: 'With family / Roommates',
    label: 'Student on snacks, starting a skincare routine',
    expect: 'Mode A into Personal Care. Small basket, so the trial pack matters.',
    signals: ['skincare_routine', 'student', 'tier2_plus'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'sb3', qty: 6 }] },
      { date: daysAgo(7), items: [{ productId: 'sb1', qty: 3 }, { productId: 'sb3', qty: 3 }] },
      { date: daysAgo(16), items: [{ productId: 'sb2', qty: 2 }, { productId: 'sb1', qty: 2 }] },
    ],
  },
  {
    id: 'p07', name: 'Vikram Nair', tag: 'Cat Parent & Dairy Regular', household: 'Alone',
    label: 'Buys milk daily, has a cat, has never bought pet food',
    expect: 'Mode A into Pet Supplies via a declared cat.',
    signals: ['pet_owner', 'lives_alone', 'tier1_metro'],
    orders: [
      { date: daysAgo(1), items: [{ productId: 'db1', qty: 3 }, { productId: 'db2', qty: 1 }] },
      { date: daysAgo(6), items: [{ productId: 'db1', qty: 3 }] },
      { date: daysAgo(13), items: [{ productId: 'db1', qty: 2 }, { productId: 'db3', qty: 1 }] },
      { date: daysAgo(22), items: [{ productId: 'db1', qty: 3 }, { productId: 'db2', qty: 2 }] },
    ],
  },
  {
    id: 'p08', name: 'Ananya Bose', tag: 'Skincare Enthusiast', household: 'Alone',
    label: 'Personal care regular, never bought health & pharma',
    expect: 'Signal already spent (owns Personal Care) — falls to adjacency, cheapest trial wins.',
    signals: ['skincare_routine', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'pc2', qty: 2 }, { productId: 'pc3', qty: 1 }] },
      { date: daysAgo(12), items: [{ productId: 'pc1', qty: 2 }, { productId: 'pc2', qty: 1 }] },
      { date: daysAgo(24), items: [{ productId: 'pc3', qty: 1 }, { productId: 'pc1', qty: 1 }] },
    ],
  },
  {
    id: 'p09', name: 'Farhan Sheikh', tag: 'Daily Chai Ritual', household: 'With family',
    label: 'Tea buyer who never buys the milk to go with it',
    expect: 'Mode A into Dairy & Bread by adjacency from Tea & Coffee.',
    signals: ['tea_ritual', 'tier2_plus'],
    orders: [
      { date: daysAgo(4), items: [{ productId: 'tc1', qty: 1 }, { productId: 'sb3', qty: 3 }] },
      { date: daysAgo(15), items: [{ productId: 'tc1', qty: 1 }, { productId: 'sb1', qty: 2 }] },
      { date: daysAgo(28), items: [{ productId: 'tc2', qty: 1 }, { productId: 'sb3', qty: 2 }] },
    ],
  },
  {
    id: 'p10', name: 'Ishita Raghavan', tag: 'Meal Prepper & Runner', household: 'Alone',
    label: 'Frozen-food regular who trains', expect: 'Mode A into Health & Pharma via gym_goer.',
    signals: ['gym_goer', 'lives_alone', 'tier1_metro'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'ff1', qty: 2 }, { productId: 'ff2', qty: 2 }] },
      { date: daysAgo(9), items: [{ productId: 'ff2', qty: 3 }] },
      { date: daysAgo(20), items: [{ productId: 'ff1', qty: 2 }, { productId: 'sb1', qty: 2 }] },
    ],
  },
  {
    id: 'p11', name: 'Nikhil Chawla', tag: 'Just Moved In', household: 'With family / Roommates',
    label: 'Cleaning-supplies buyer setting up a new flat',
    expect: 'Mode A into Home & Kitchen via new_home.',
    signals: ['new_home', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'cs1', qty: 2 }, { productId: 'cs2', qty: 1 }] },
      { date: daysAgo(10), items: [{ productId: 'cs2', qty: 1 }, { productId: 'he2', qty: 1 }] },
      { date: daysAgo(19), items: [{ productId: 'cs1', qty: 1 }, { productId: 'he1', qty: 1 }] },
    ],
  },
  {
    id: 'p12', name: 'Tanvi Bhatt', tag: 'Working Parent', household: 'With family',
    label: 'Baby-care regular, no health & pharma yet',
    expect: 'Signal already spent (owns Baby Care) — falls to adjacency, cheapest trial wins.',
    signals: ['parent_young_child', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'bc1', qty: 1 }, { productId: 'bc2', qty: 1 }] },
      { date: daysAgo(9), items: [{ productId: 'bc1', qty: 1 }, { productId: 'bc3', qty: 1 }] },
      { date: daysAgo(20), items: [{ productId: 'bc2', qty: 2 }, { productId: 'bc1', qty: 1 }] },
    ],
  },
  {
    id: 'p13', name: 'Aditya Pillai', tag: 'Hosts Every Weekend', household: 'With family / Roommates',
    label: 'Snacks and drinks for guests, never frozen',
    expect: 'Mode A into Frozen Food via hosts_often.',
    signals: ['hosts_often', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'sb2', qty: 6 }, { productId: 'sb1', qty: 4 }] },
      { date: daysAgo(9), items: [{ productId: 'sb1', qty: 3 }, { productId: 'sb3', qty: 4 }] },
      { date: daysAgo(16), items: [{ productId: 'sb2', qty: 5 }] },
    ],
  },
  {
    id: 'p14', name: 'Riya Malhotra', tag: 'Dog Parent, Spotless Flat', household: 'Alone',
    label: 'Pet-supplies regular who has never bought cleaning products',
    expect: 'Mode A into Cleaning Supplies via deep_cleans.',
    signals: ['deep_cleans', 'pet_owner', 'lives_alone'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'ps1', qty: 3 }, { productId: 'ps4', qty: 1 }] },
      { date: daysAgo(11), items: [{ productId: 'ps2', qty: 1 }, { productId: 'ps1', qty: 2 }] },
      { date: daysAgo(23), items: [{ productId: 'ps1', qty: 3 }] },
    ],
  },
  {
    id: 'p15', name: 'Zoya Ansari', tag: 'Cooks Fresh Daily', household: 'With family',
    label: 'Tea and snacks buyer who cooks from scratch',
    expect: 'Mode A into Fruits & Vegetables via fresh_cook.',
    signals: ['fresh_cook', 'tier2_plus'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'tc1', qty: 1 }, { productId: 'sb3', qty: 3 }] },
      { date: daysAgo(10), items: [{ productId: 'db1', qty: 2 }, { productId: 'tc1', qty: 1 }] },
      { date: daysAgo(21), items: [{ productId: 'db1', qty: 2 }, { productId: 'sb1', qty: 2 }] },
    ],
  },

];

export const PRODUCTS_BY_ID = Object.fromEntries(CATALOGUE.map((p) => [p.id, p]));
