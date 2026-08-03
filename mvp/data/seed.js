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
  // ── Five profiles, one per depth interview ────────────────────────────────────────────────────
  //
  // Each carries the barrier its interview actually described, so the agent has to handle the real
  // thing rather than a tidied version of it. Two of them are cases where the correct output is no
  // card at all — that is the point of including them.
  //
  // They are synthetic profiles patterned on the interviews. They are not the interviewees, whose
  // transcripts stay anonymous as P01–P05 in research/transcripts/.
  {
    id: 'i01', name: 'Neha Joshi', tag: 'Hometown Utility Shopper', household: 'With family',
    provenance: 'P01', label: 'Buys personal care basics; only one app available where she lives',
    expect: 'Mode A. Need-driven shopper, narrow basket, no pet and no child.',
    signals: ['tier2_plus'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'pc1', qty: 1 }, { productId: 'pc2', qty: 2 }] },
      { date: daysAgo(12), items: [{ productId: 'pc2', qty: 1 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(23), items: [{ productId: 'pc1', qty: 1 }, { productId: 'db1', qty: 2 }] },
    ],
  },
  {
    id: 'i02', name: 'Rohan Mehta', tag: 'Late-Night Shopper & Single', household: 'Alone',
    provenance: 'P02', label: 'Orders late at night when nothing else is open',
    expect: 'Mode A. Frequent but very narrow — snacks and drinks only.',
    signals: ['lives_alone', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(1), items: [{ productId: 'sb2', qty: 3 }, { productId: 'sb1', qty: 2 }] },
      { date: daysAgo(5), items: [{ productId: 'sb1', qty: 2 }, { productId: 'sb3', qty: 4 }] },
      { date: daysAgo(11), items: [{ productId: 'sb2', qty: 4 }] },
      { date: daysAgo(19), items: [{ productId: 'sb3', qty: 3 }, { productId: 'sb1', qty: 2 }] },
    ],
  },
  {
    id: 'i03', name: 'Ayush Bisht', tag: 'Gym Goer & Tech Single', household: 'Alone',
    provenance: 'P03', label: 'Joined a gym recently; price-led, compares across apps',
    expect: 'Mode A into Health & Pharma via a declared training habit.',
    signals: ['gym_goer', 'lives_alone', 'working_professional'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'sb1', qty: 3 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(8), items: [{ productId: 'sb2', qty: 2 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(17), items: [{ productId: 'sb3', qty: 4 }, { productId: 'db3', qty: 1 }] },
    ],
  },
  {
    id: 'i04', name: 'Priya Sharma', tag: 'New Mother & Kirana Loyalist', household: 'With family',
    provenance: 'P04', label: 'Buys baby care on the app, staples from the shop next door',
    expect: 'NO staples card. The block lifts only if she moves house or the kirana closes.',
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
    id: 'i05', name: 'Kabir Das', tag: 'Produce Sceptic', household: 'With family',
    provenance: 'P05', label: 'Tried vegetables once, one bad delivery, closed the category',
    expect: 'NO CARD. On the numbers a textbook Mode B target; the shopper has closed it.',
    signals: ['cooks_daily', 'tier1_metro'],
    avoid: [
      { category: 'Fruits & Vegetables', kind: 'distrust', note: 'one bad delivery, category closed' },
    ],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'db1', qty: 2 }, { productId: 'he1', qty: 1 }] },
      { date: daysAgo(11), items: [{ productId: 'db1', qty: 2 }, { productId: 'cs1', qty: 1 }] },
      { date: daysAgo(25), items: [{ productId: 'fv2', qty: 1 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(33), items: [{ productId: 'db1', qty: 3 }, { productId: 'db2', qty: 1 }] },
    ],
  },

  // ── Five lifestyle profiles ───────────────────────────────────────────────────────────────────
  //
  // The first three are the brief's own worked examples, reached through a declared fact about the
  // person rather than a category-graph edge — see the note on SIGNAL_CATEGORIES in agent/suggest.js.
  {
    id: 'r01', name: 'Diya Kulkarni', tag: 'New Puppy Owner', household: 'With family',
    label: 'Grocery regular who just got a puppy',
    expect: "Brief example 1: groceries -> pet supplies, via a declared pet.",
    signals: ['pet_owner', 'tier1_metro'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'fv1', qty: 2 }, { productId: 'db1', qty: 3 }] },
      { date: daysAgo(10), items: [{ productId: 'fv2', qty: 2 }, { productId: 'db2', qty: 1 }] },
      { date: daysAgo(19), items: [{ productId: 'fv3', qty: 1 }, { productId: 'db1', qty: 3 }] },
    ],
  },
  {
    id: 'r02', name: 'Sana Qureshi', tag: 'Hostel Student', household: 'With family / Roommates',
    label: 'Student on snacks, starting a skincare routine',
    expect: 'Brief example 2: snacks -> personal care.',
    signals: ['skincare_routine', 'student', 'tier2_plus'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'sb3', qty: 6 }] },
      { date: daysAgo(7), items: [{ productId: 'sb1', qty: 3 }, { productId: 'sb3', qty: 3 }] },
      { date: daysAgo(16), items: [{ productId: 'sb2', qty: 2 }, { productId: 'sb1', qty: 2 }] },
    ],
  },
  {
    id: 'r03', name: 'Meera Iyer', tag: 'Young Family & Home Runner', household: 'With family',
    label: 'Household-essentials buyer with a young child',
    expect: 'Brief example 3: household essentials -> baby care.',
    signals: ['parent_young_child', 'tier2_plus'],
    orders: [
      { date: daysAgo(2), items: [{ productId: 'he1', qty: 1 }, { productId: 'he2', qty: 1 }] },
      { date: daysAgo(11), items: [{ productId: 'he1', qty: 1 }, { productId: 'cs1', qty: 1 }] },
      { date: daysAgo(21), items: [{ productId: 'he2', qty: 2 }, { productId: 'cs2', qty: 1 }] },
    ],
  },
  {
    id: 'r04', name: 'Vikram Nair', tag: 'Cat Parent & Dairy Regular', household: 'Alone',
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
    id: 'r05', name: 'Ananya Bose', tag: 'Lapsed Pet Buyer', household: 'With family',
    label: 'Crossed into pet supplies once, 28 days ago, never returned',
    expect: 'Mode B — the metric-moving case. A replenishment prompt, not a first trial.',
    signals: ['pet_owner', 'working_professional', 'tier1_metro'],
    orders: [
      { date: daysAgo(3), items: [{ productId: 'db1', qty: 2 }, { productId: 'fv1', qty: 1 }] },
      { date: daysAgo(11), items: [{ productId: 'db1', qty: 2 }, { productId: 'sb1', qty: 2 }] },
      { date: daysAgo(28), items: [{ productId: 'ps1', qty: 1 }, { productId: 'db1', qty: 2 }] },
      { date: daysAgo(35), items: [{ productId: 'db1', qty: 2 }, { productId: 'fv2', qty: 2 }] },
    ],
  },
];

export const PRODUCTS_BY_ID = Object.fromEntries(CATALOGUE.map((p) => [p.id, p]));
