const pptxgen = require('pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';           // 13.33 x 7.5
pres.author = 'Ayush Bisht';
pres.title = 'Blinkit — Category Exploration & Discovery';

// ── palette ────────────────────────────────────────────────────────────────
// Blue / orange / yellow only. No red-green pair anywhere, and no meaning is
// ever carried by colour alone — every coloured element is also labelled.
const INK = '1A1D29';
const INK_SOFT = 'C9CFDB';
const WHITE = 'FFFFFF';
const YELLOW = 'F8CB46';
const BLUE = '1D6FB8';
const ORANGE = 'C4552B';
const MUTED = '5A6270';
const TINT = 'F1F4F8';
const TINTY = 'FEF6E0';
const LINE = 'D8DEE7';

const HEAD = 'Cambria';
const BODY = 'Calibri';

const MVP = 'https://ayushbisht-source.github.io/Blinkit/';
const REPO = 'https://github.com/ayushbisht-source/Blinkit';
const DECKW = 'https://ayushbisht-source.github.io/Blinkit/deck/';

// Motif: a yellow disc carrying the slide number, same place on every slide.
function head(slide, n, text) {
  slide.addShape(pres.ShapeType.ellipse, {
    x: 0.55, y: 0.42, w: 0.52, h: 0.52, fill: { color: YELLOW },
  });
  slide.addText(String(n), {
    x: 0.55, y: 0.42, w: 0.52, h: 0.52, align: 'center', valign: 'middle',
    fontSize: 16, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  slide.addText(text, {
    x: 1.25, y: 0.28, w: 11.5, h: 0.86, fontSize: 23, bold: true,
    color: INK, fontFace: HEAD, valign: 'middle', margin: 0,
  });
}

function card(slide, o) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: 0.08,
    fill: { color: o.fill || TINT },
    line: { color: o.line || LINE, width: 1 },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 — Title
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: INK };

  s.addText('blinkit', {
    x: 0.7, y: 0.5, w: 4, h: 0.5, fontSize: 24, bold: true,
    color: YELLOW, fontFace: BODY, margin: 0,
  });
  s.addText('CATEGORY EXPLORATION & DISCOVERY', {
    x: 0.7, y: 1.02, w: 8, h: 0.35, fontSize: 14, bold: true,
    color: INK_SOFT, fontFace: BODY, charSpacing: 2, margin: 0,
  });

  s.addText('39 of 40 users have wanted to try a\nnew category — and didn’t.', {
    x: 0.7, y: 1.95, w: 11.6, h: 1.8, fontSize: 40, bold: true,
    color: WHITE, fontFace: HEAD, lineSpacing: 46, margin: 0,
  });

  s.addText(
    'Motivation is not the constraint. The app shows an unfamiliar category exactly what it shows a familiar one — a price. ' +
      'For a category you already buy that is enough; you hold the reference point in your head. For one you have never bought, ' +
      'a price with no reference point is uninterpretable, so evaluating it costs time a two-minute fetch session has not budgeted.',
    { x: 0.7, y: 3.95, w: 9.6, h: 1.5, fontSize: 15, color: INK_SOFT, fontFace: BODY, lineSpacing: 22, margin: 0 }
  );

  const links = [
    ['Live MVP', MVP, 0.7],
    ['Repository & data', REPO, 3.3],
    ['Full written case study', DECKW, 6.5],
  ];
  links.forEach(([label, url, x]) => {
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 5.75, w: label.length > 12 ? 2.9 : 2.3, h: 0.55, rectRadius: 0.1,
      fill: { color: '272C3A' }, line: { color: '3B4256', width: 1 },
    });
    s.addText(label, {
      x, y: 5.75, w: label.length > 12 ? 2.9 : 2.3, h: 0.55, align: 'center', valign: 'middle',
      fontSize: 14, bold: true, color: YELLOW, fontFace: BODY, margin: 0,
      hyperlink: { url, tooltip: label },
    });
  });

  s.addText('Ayush Bisht  ·  Product Manager Fellowship  ·  Graduation Project', {
    x: 0.7, y: 6.75, w: 9, h: 0.4, fontSize: 14, color: MUTED, fontFace: BODY, margin: 0,
  });
  s.addNotes('Thesis in one line: this is an ability problem, not a motivation problem. All three links are public.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 2 — Systems thinking / iceberg
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 2, 'The barrier sits below the waterline, where features rarely look');

  const rows = [
    ['EVENTS', 'React', '“This user has bought the same two categories for six months.”', TINT],
    ['PATTERNS', 'Anticipate', '38/40 arrive knowing what they want. 20/40 crossed a category in 3 months — and their barriers did not soften.', TINT],
    ['STRUCTURE', 'Design', 'An unfamiliar category is shown the same information as a familiar one: a price, with no reference point.', TINTY],
    ['MENTAL MODEL', 'Transform', 'User: “quick commerce is a fetch tool, not a browse tool.” Company: “more recommendations produce more discovery.”', TINT],
  ];
  let y = 1.35;
  rows.forEach(([lvl, verb, txt, fill], i) => {
    const h = 1.22;
    card(s, { x: 0.55, y, w: 7.6, h, fill, line: fill === TINTY ? YELLOW : LINE });
    s.addText(lvl, {
      x: 0.75, y: y + 0.12, w: 2.3, h: 0.32, fontSize: 14, bold: true,
      color: fill === TINTY ? ORANGE : INK, fontFace: BODY, margin: 0,
    });
    s.addText(verb, {
      x: 6.35, y: y + 0.12, w: 1.65, h: 0.32, fontSize: 14, bold: true, align: 'right',
      color: BLUE, fontFace: BODY, margin: 0,
    });
    s.addText(txt, {
      x: 0.75, y: y + 0.46, w: 7.2, h: 0.66, fontSize: 14, color: INK,
      fontFace: BODY, margin: 0, lineSpacing: 17,
    });
    y += h + 0.14;
  });

  card(s, { x: 8.45, y: 1.35, w: 4.35, h: 2.78, fill: WHITE, line: BLUE });
  s.addText('Where solutions usually intervene', {
    x: 8.7, y: 1.5, w: 3.9, h: 0.32, fontSize: 14, bold: true, color: BLUE, fontFace: BODY, margin: 0,
  });
  s.addText(
    [
      { text: 'A banner or an “explore” tab acts on EVENTS.', options: { bullet: true, breakLine: true } },
      { text: 'A discount campaign acts on PATTERNS.', options: { bullet: true, breakLine: true } },
      { text: 'Both push variables already non-zero — 39/40 want to explore.', options: { bullet: true, breakLine: true } },
      { text: 'We act on STRUCTURE: supply the missing reference point.', options: { bullet: true } },
    ],
    { x: 8.75, y: 1.96, w: 3.85, h: 2.1, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, paraSpaceAfter: 6, margin: 0 }
  );

  card(s, { x: 8.45, y: 4.3, w: 4.35, h: 2.18, fill: TINT, line: LINE });
  s.addText('The loop we are breaking', {
    x: 8.7, y: 4.42, w: 3.9, h: 0.32, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  s.addText(
    'Narrow basket  →  faster session  →  “a fetch tool, not a browse tool”  →  no reference point ' +
      'for an unfamiliar price  →  less exploration  →  narrower basket',
    { x: 8.7, y: 4.8, w: 3.9, h: 1.0, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 17 }
  );
  s.addText('Vicious: each efficient session makes the next exploration less likely.', {
    x: 8.7, y: 5.85, w: 3.9, h: 0.5, valign: 'top', fontSize: 14, italic: true, color: MUTED, fontFace: BODY, margin: 0,
  });

  s.addText('Fogg: B = M × A × P.  Motivation 39/40 present · Prompt present · Ability is the binding constraint.', {
    x: 0.55, y: 6.62, w: 12.25, h: 0.4, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  s.addNotes('Iceberg model from Class 1. The point: depth of intervention = leverage.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 3 — Discovery engine
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 3, '3,372 documents became 25 themes — every number computed, not generated');

  const steps = ['Collect', 'Normalize', 'Relevance gate', 'Extract', 'Cluster', 'Synthesize', 'Validate'];
  const w = 1.63, gap = 0.14;
  steps.forEach((st, i) => {
    const x = 0.55 + i * (w + gap);
    const last = i === steps.length - 1;
    card(s, { x, y: 1.3, w, h: 0.62, fill: last ? INK : BLUE, line: last ? INK : BLUE });
    s.addText(st, {
      x, y: 1.3, w, h: 0.62, align: 'center', valign: 'middle', fontSize: 14,
      bold: true, color: WHITE, fontFace: BODY, margin: 0,
    });
  });

  const stats = [
    ['3,372', 'documents collected', 'Play Store 3,033 · App Store 339, across 5 quick-commerce apps'],
    ['971', 'relevant — 28.8%', 'The gate removing 71% is the design: most reviews discuss delivery, not choice'],
    ['25', 'interpretable themes', 'TF-IDF → LSA → agglomerative, merge threshold calibrated on homogeneity'],
    ['0.4%', 'fabrication rate', '4 in 924. Every quote must be a verbatim substring, asserted character-for-character'],
  ];
  stats.forEach(([big, label, sub], i) => {
    const x = 0.55 + i * 3.12;
    card(s, { x, y: 2.2, w: 2.95, h: 2.28, fill: WHITE, line: LINE });
    s.addText(big, {
      x: x + 0.18, y: 2.32, w: 2.6, h: 0.72, fontSize: 34, bold: true, color: BLUE, fontFace: HEAD, margin: 0,
    });
    s.addText(label, {
      x: x + 0.18, y: 3.0, w: 2.6, h: 0.34, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
    });
    s.addText(sub, {
      x: x + 0.18, y: 3.42, w: 2.6, h: 1.0, fontSize: 14, color: MUTED, fontFace: BODY, margin: 0, lineSpacing: 16,
    });
  });

  card(s, { x: 0.55, y: 4.58, w: 6.05, h: 1.95, fill: TINTY, line: YELLOW });
  s.addText('Three rules that make the output checkable', {
    x: 0.78, y: 4.72, w: 5.6, h: 0.32, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  s.addText(
    [
      { text: 'The schema is the source of truth — every enum traces to one of the brief’s 8 questions.', options: { bullet: true, breakLine: true } },
      { text: 'Numbers never come from the model. It sees labels and quotes only.', options: { bullet: true, breakLine: true } },
      { text: 'Contradicting evidence is computed, never requested.', options: { bullet: true } },
    ],
    { x: 0.83, y: 5.16, w: 5.5, h: 1.3, fontSize: 14, color: INK, fontFace: BODY, paraSpaceAfter: 6, margin: 0 }
  );

  card(s, { x: 6.85, y: 4.58, w: 5.95, h: 1.95, fill: WHITE, line: ORANGE });
  s.addText('The filter’s error, found by interview', {
    x: 7.08, y: 4.72, w: 5.5, h: 0.32, fontSize: 14, bold: true, color: ORANGE, fontFace: BODY, margin: 0,
  });
  s.addText(
    'An interviewee described building their basket around a free-delivery threshold — a real constraint on what gets bought, ' +
      'expressed as a fee complaint. Re-checking the corpus: 133 documents use that language, and the gate discarded 64 as noise. ' +
      'Documented rather than quietly retuned.',
    { x: 7.08, y: 5.16, w: 5.5, h: 1.3, fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 17 }
  );

  s.addText('Corpus is app-store review text only — Play Store 3,033 · App Store 339.', {
    x: 0.55, y: 6.62, w: 12.25, h: 0.4, fontSize: 14, color: MUTED, fontFace: BODY, margin: 0,
    hyperlink: { url: REPO, tooltip: 'Repository' },
  });
  s.addNotes('Part 1. Emphasise: the gate is a design decision with a measured error rate, not a black box.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 4 — Validation
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 4, 'Trying to break our own insights: 3 pass, 2 report NOT RUN');

  const checks = [
    ['Quote grounding', 'PASS', '125 quotes checked against source text. 4 fabrications in 924 extractions; the rest are filtered before display.'],
    ['Hold-out generalisation', 'PASS', 'Out-of-sample, against a size-matched permutation null. Real themes z = +17.4; word salad z = −2.6.'],
    ['Theme non-degeneracy', 'PASS', 'An earlier run collapsed to one theme at 100% prevalence and reported success. Now asserted in code.'],
    ['Source spread', 'NOT RUN', '95% of the corpus is one source, so the check cannot discriminate. Reports the chance figure instead.'],
    ['Inter-rater agreement', 'NOT RUN', 'Needs a hand-labelled gold set that does not exist. Reported absent, not approximated.'],
  ];
  let y = 1.3;
  checks.forEach(([name, status, txt]) => {
    const pass = status === 'PASS';
    card(s, { x: 0.55, y, w: 8.05, h: 0.98, fill: WHITE, line: LINE });
    s.addText(name, { x: 0.75, y: y + 0.1, w: 2.6, h: 0.32, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0 });
    s.addShape(pres.ShapeType.roundRect, {
      x: 3.45, y: y + 0.11, w: 1.25, h: 0.3, rectRadius: 0.06,
      fill: { color: pass ? BLUE : ORANGE },
    });
    s.addText(status, {
      x: 3.45, y: y + 0.11, w: 1.25, h: 0.3, align: 'center', valign: 'middle',
      fontSize: 14, bold: true, color: WHITE, fontFace: BODY, margin: 0,
    });
    s.addText(txt, { x: 4.85, y: y + 0.08, w: 3.6, h: 0.82, fontSize: 14, color: MUTED, fontFace: BODY, margin: 0, lineSpacing: 15 });
    y += 1.08;
  });

  card(s, { x: 8.85, y: 1.3, w: 3.95, h: 2.82, fill: TINTY, line: YELLOW });
  s.addText('Cross-checked against a second model family', {
    x: 9.08, y: 1.44, w: 3.5, h: 0.55, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  s.addText(
    'Re-run on Llama 3.3 70B and compared with Gemini across 25 themes: 0.66 Jaccard, no theme at zero overlap, ' +
      'mechanism text matching 12/25 vs a 4% baseline.',
    { x: 9.08, y: 2.02, w: 3.5, h: 1.2, fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 16 }
  );
  s.addText('Agreement is not correctness — it bounds vendor dependence, nothing more.', {
    x: 9.08, y: 3.42, w: 3.5, h: 0.55, fontSize: 14, italic: true, color: MUTED, fontFace: BODY, margin: 0,
  });

  card(s, { x: 8.85, y: 4.28, w: 3.95, h: 2.25, fill: INK, line: INK });
  s.addText('Why report NOT RUN at all', {
    x: 9.08, y: 4.42, w: 3.5, h: 0.32, fontSize: 14, bold: true, color: YELLOW, fontFace: BODY, margin: 0,
  });
  s.addText(
    'Two of these used to print PASS over zero observations. A green line standing for no evidence is worse than an honest gap. ' +
      'Three pass, two abstain, and the deck says which.',
    { x: 9.08, y: 4.8, w: 3.5, h: 1.6, fontSize: 14, color: INK_SOFT, fontFace: BODY, margin: 0, lineSpacing: 17 }
  );
  s.addNotes('Validation. The NOT RUN rows are the credibility argument, not an apology.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 5 — Primary research
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 5, 'Five interviews found three barriers 3,372 documents cannot contain');

  card(s, { x: 0.55, y: 1.28, w: 12.25, h: 0.42, fill: INK, line: INK });
  [['What the corpus missed', 0.75, 4.0], ['Found by', 4.95, 2.1], ['Why the corpus cannot hold it', 7.25, 5.3]].forEach(
    ([t, x, w2]) => s.addText(t, { x, y: 1.28, w: w2, h: 0.42, valign: 'middle', fontSize: 14, bold: true, color: WHITE, fontFace: BODY, margin: 0 })
  );

  const gaps = [
    ['“Comparing took too long, so I bought nothing”', 'Survey, 13/40', 'The user did not buy, so there is nothing to review. Engine sees it at 1.5% — a twentyfold gap, not sampling noise.'],
    ['“This category does not apply to me”', 'Interviews, 3 of 5', 'No need means no purchase means no review. All 8 barrier codes presume latent demand, so all three would be miscoded as blocked.'],
    ['“I build my basket around the free-delivery threshold”', 'Interview + 133 corpus docs', 'Present in the text at scale — but the gate read it as a delivery complaint and the schema has nowhere to store it.'],
  ];
  let y = 1.78;
  gaps.forEach(([a, b, c], i) => {
    card(s, { x: 0.55, y, w: 12.25, h: 0.92, fill: i % 2 ? TINT : WHITE, line: LINE });
    s.addText(a, { x: 0.75, y: y + 0.08, w: 4.0, h: 0.76, valign: 'middle', fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0 });
    s.addText(b, { x: 4.95, y: y + 0.08, w: 2.1, h: 0.76, valign: 'middle', fontSize: 14, color: ORANGE, bold: true, fontFace: BODY, margin: 0 });
    s.addText(c, { x: 7.25, y: y + 0.08, w: 5.3, h: 0.76, valign: 'middle', fontSize: 14, color: MUTED, fontFace: BODY, margin: 0, lineSpacing: 16 });
    y += 0.96;
  });

  s.addText('A corpus of reviews contains only people who completed a transaction. Every barrier that stops someone before they buy generates no text at all.', {
    x: 0.55, y: 4.72, w: 12.25, h: 0.45, valign: 'top', fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });

  card(s, { x: 0.55, y: 5.34, w: 6.05, h: 1.3, fill: WHITE, line: BLUE });
  s.addText('Where research CONFIRMED the engine', { x: 0.78, y: 5.46, w: 5.6, h: 0.3, fontSize: 14, bold: true, color: BLUE, fontFace: BODY, margin: 0 });
  s.addText('Barrier ranking matches across two independent datasets. Engine: trust/quality 45.3%, price risk 22.7%, awareness 4.8% — the survey ranks them identically.',
    { x: 0.78, y: 5.8, w: 5.6, h: 0.8, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 16 });

  card(s, { x: 6.85, y: 5.34, w: 5.95, h: 1.3, fill: WHITE, line: ORANGE });
  s.addText('Where the engine outran both', { x: 7.08, y: 5.46, w: 5.5, h: 0.3, fontSize: 14, bold: true, color: ORANGE, fontFace: BODY, margin: 0 });
  s.addText('Its third-largest barrier is return anxiety at 18.4% — barely probed by the survey, raised by no interview. The correction runs both ways.',
    { x: 7.08, y: 5.8, w: 5.5, h: 0.8, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 16 });

  s.addNotes('Part 2. n=5, real, async over text, anonymised P01–P05. The challenges are the value, not the confirmations.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 6 — Problem definition
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 6, 'Every individual skip is rational; the aggregate is a two-year rut');

  card(s, { x: 0.55, y: 1.28, w: 3.9, h: 2.35, fill: WHITE, line: LINE });
  s.addText('Target segment', { x: 0.78, y: 1.4, w: 3.45, h: 0.32, fontSize: 14, bold: true, color: BLUE, fontFace: BODY, margin: 0 });
  s.addText(
    [
      { text: '≥3 orders/month (27 of 40)', options: { bullet: true, breakLine: true } },
      { text: '≥6 months tenure', options: { bullet: true, breakLine: true } },
      { text: '≤2 categories carry most spend', options: { bullet: true, breakLine: true } },
      { text: 'Already acquired and transacting — the blocker is behavioural.', options: { bullet: true } },
    ],
    { x: 0.83, y: 1.82, w: 3.4, h: 1.72, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, paraSpaceAfter: 6, margin: 0 }
  );

  card(s, { x: 4.7, y: 1.28, w: 8.12, h: 2.35, fill: TINTY, line: YELLOW });
  s.addText('Root cause', { x: 4.95, y: 1.4, w: 7.6, h: 0.32, fontSize: 14, bold: true, color: ORANGE, fontFace: BODY, margin: 0 });
  s.addText(
    'The app presents unfamiliar categories with the same information as familiar ones. For a familiar category that is enough, because the user ' +
      'supplies the missing context from memory. For an unfamiliar one it is not — so evaluating it costs time the user has not budgeted, and the ' +
      'rational move inside a two-minute fetch session is to skip it.',
    { x: 4.95, y: 1.76, w: 7.6, h: 1.3, fontSize: 15, color: INK, fontFace: BODY, margin: 0, lineSpacing: 20 }
  );
  s.addText('Every skip is individually correct. The aggregate outcome is a user who has bought the same things for two years.', {
    x: 4.95, y: 3.12, w: 7.6, h: 0.45, fontSize: 14, italic: true, bold: true, color: INK, fontFace: BODY, margin: 0,
  });

  s.addText('Existing workarounds — people only build these for problems they actually have', {
    x: 0.55, y: 3.82, w: 12.25, h: 0.34, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });

  const wa = [
    ['Buy it somewhere else', 'D-Mart 8 · Kirana 6 · Amazon 3', 'The demand is not missing — it is leaking. Displaced revenue, not absent appetite.'],
    ['Wait for a price signal', '“cheaper elsewhere” 12 · “too expensive” 8', 'Price is being used as a proxy for risk. Cheap enough means safe enough to test.'],
    ['Validate elsewhere', '14 want reviews first', 'The evaluation happens — on Instagram or in a shop. And so does the purchase.'],
    ['Defer indefinitely', '“forgot once cart-filling” 3 · distracted 6', 'Intent exists but evaporates on contact with the reorder flow.'],
  ];
  wa.forEach(([t, ev, note], i) => {
    const x = 0.55 + i * 3.12;
    card(s, { x, y: 4.24, w: 2.95, h: 1.86, fill: WHITE, line: LINE });
    s.addText(t, { x: x + 0.18, y: 4.36, w: 2.6, h: 0.3, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0 });
    s.addText(ev, { x: x + 0.18, y: 4.68, w: 2.6, h: 0.5, valign: 'top', fontSize: 14, color: ORANGE, fontFace: BODY, margin: 0, lineSpacing: 16 });
    s.addText(note, { x: x + 0.18, y: 5.24, w: 2.6, h: 0.8, valign: 'top', fontSize: 14, color: MUTED, fontFace: BODY, margin: 0, lineSpacing: 16 });
  });

  s.addText('Where the model stops: 2 of 5 interviewees have barriers no information closes — an incumbent kirana, and a belief settled by one bad delivery. The MVP shows them nothing, which is the correct behaviour.', {
    x: 0.55, y: 6.26, w: 12.25, h: 0.45, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, margin: 0,
  });
  s.addNotes('Part 3. Five whys behind the root cause; Fogg says ability is the binding constraint.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 7 — KPI tree
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 7, 'One lever: cut evaluation cost at cart review');

  // Level 1
  card(s, { x: 0.55, y: 1.3, w: 3.5, h: 1.08, fill: INK, line: INK });
  s.addText('BUSINESS OUTCOME', { x: 0.75, y: 1.4, w: 3.1, h: 0.3, fontSize: 14, bold: true, color: YELLOW, fontFace: BODY, margin: 0 });
  s.addText('Retention & LTV — category breadth is the moat', { x: 0.75, y: 1.76, w: 3.1, h: 0.55, fontSize: 14, color: WHITE, fontFace: BODY, margin: 0, lineSpacing: 17 });

  card(s, { x: 4.35, y: 1.3, w: 3.5, h: 1.08, fill: BLUE, line: BLUE });
  s.addText('NORTH STAR METRIC', { x: 4.55, y: 1.4, w: 3.1, h: 0.3, fontSize: 14, bold: true, color: WHITE, fontFace: BODY, margin: 0 });
  s.addText('CER — % of MAC buying from ≥1 new category this month', { x: 4.55, y: 1.76, w: 3.1, h: 0.55, fontSize: 14, color: WHITE, fontFace: BODY, margin: 0, lineSpacing: 17 });

  card(s, { x: 8.15, y: 1.3, w: 4.67, h: 1.08, fill: TINTY, line: YELLOW });
  s.addText('THE DEFINITION THAT DECIDES IT', { x: 8.38, y: 1.4, w: 4.25, h: 0.3, fontSize: 14, bold: true, color: ORANGE, fontFace: BODY, margin: 0 });
  s.addText('A purchase in month M from a category bought in none of M-1 … M-6.', { x: 8.38, y: 1.76, w: 4.25, h: 0.55, fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 17 });

  s.addText('CER  =  eligible sessions  ×  surfaced  ×  considered  ×  converted', {
    x: 0.55, y: 2.48, w: 12.25, h: 0.36, fontSize: 15, bold: true, color: INK, fontFace: HEAD, margin: 0,
  });

  const drivers = [
    ['Eligible sessions', 'Shopper reaches cart review with ≥2 orders of history', 'Instrumented, not modelled'],
    ['Surfaced', '% of those sessions where a substantiated new category exists', '35 of 36 row entries would register in CER'],
    ['Considered', '1 − dismissal rate', 'Pre-registered guardrail: kill above 60%'],
    ['Converted', 'Add-to-cart on a suggested new category', 'The number the experiment moves'],
  ];
  drivers.forEach(([t, d, m], i) => {
    const x = 0.55 + i * 3.12;
    card(s, { x, y: 2.96, w: 2.95, h: 1.66, fill: WHITE, line: LINE });
    s.addText(t, { x: x + 0.18, y: 3.08, w: 2.6, h: 0.3, fontSize: 14, bold: true, color: BLUE, fontFace: BODY, margin: 0 });
    s.addText(d, { x: x + 0.18, y: 3.4, w: 2.6, h: 0.72, fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 16 });
    s.addText(m, { x: x + 0.18, y: 4.1, w: 2.6, h: 0.5, fontSize: 14, italic: true, color: MUTED, fontFace: BODY, margin: 0, lineSpacing: 16 });
  });

  card(s, { x: 0.55, y: 4.76, w: 6.05, h: 1.72, fill: TINT, line: LINE });
  s.addText('Opportunity → the one thing we build', { x: 0.78, y: 4.88, w: 5.6, h: 0.3, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0 });
  s.addText(
    'Three of the four are already healthy: intent arrives in-app (Blinkit 16 vs Amazon 3), sessions are frequent, the catalogue is there. ' +
      'Only CONSIDERED is not — the shopper cannot evaluate fast enough. That is what the intervention targets.',
    { x: 0.78, y: 5.3, w: 5.6, h: 1.12, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 17 }
  );

  card(s, { x: 6.85, y: 4.76, w: 5.95, h: 1.72, fill: WHITE, line: ORANGE });
  s.addText('The correction that changed the build', { x: 7.08, y: 4.88, w: 5.5, h: 0.3, fontSize: 14, bold: true, color: ORANGE, fontFace: BODY, margin: 0 });
  s.addText(
    'The spec first ranked the repeat prompt above first trial, reasoning that a monthly metric rewards repeats. It does not — that repeat sits ' +
      'inside the lookback and scores zero. First crossovers now lead.',
    { x: 7.08, y: 5.3, w: 5.5, h: 1.12, valign: 'top', fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 16 }
  );
  s.addNotes('KPI tree: business outcome → product outcome → drivers → the single lever. The correction shows the tree being used, not decorated.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 8 — MVP: flow + wireframe
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 8, 'The MVP pre-computes the comparison a two-minute session cannot afford');

  s.addText('User flow — no new screen, no new journey', {
    x: 0.55, y: 1.26, w: 7.4, h: 0.3, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  const flow = [
    ['1', 'Fetch-mode session', 'Shopper opens the app knowing what they want — 38/40'],
    ['2', 'Basket fills', 'Their usual list. The agent does not interrupt the task'],
    ['3', 'Cart review', 'The only natural pause: task done, payment not started'],
    ['4', 'Card appears', 'Up to 5, each opening a different never-bought category'],
    ['5', 'Add, or dismiss', 'Dismissal is logged as a guardrail, not hidden'],
  ];
  let fy = 1.62;
  flow.forEach(([n, t, d]) => {
    s.addShape(pres.ShapeType.ellipse, { x: 0.58, y: fy + 0.06, w: 0.42, h: 0.42, fill: { color: BLUE } });
    s.addText(n, { x: 0.58, y: fy + 0.06, w: 0.42, h: 0.42, align: 'center', valign: 'middle', fontSize: 14, bold: true, color: WHITE, fontFace: BODY, margin: 0 });
    s.addText(t, { x: 1.15, y: fy, w: 2.5, h: 0.3, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0 });
    s.addText(d, { x: 1.15, y: fy + 0.28, w: 6.4, h: 0.3, fontSize: 14, color: MUTED, fontFace: BODY, margin: 0 });
    fy += 0.66;
  });

  card(s, { x: 0.55, y: 5.05, w: 7.4, h: 1.45, fill: TINTY, line: YELLOW });
  s.addText('Every line on the card closes a blocker the survey named', {
    x: 0.78, y: 5.16, w: 6.9, h: 0.3, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  s.addText(
    'Reason from own history → “not sure it’ll suit my need” 14/40  ·  Price anchor → “priced higher than usual” 15/40  ·  ' +
      'Trust signal → “don’t trust the brand / want reviews” 26/40  ·  Smallest pack → “too expensive” 20/40',
    { x: 0.78, y: 5.5, w: 6.9, h: 0.9, fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 18 }
  );

  // Wireframe
  s.addText('Wireframe — the card, at cart review', {
    x: 8.25, y: 1.26, w: 4.55, h: 0.3, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0,
  });
  card(s, { x: 8.25, y: 1.62, w: 4.57, h: 4.88, fill: WHITE, line: INK });

  s.addShape(pres.ShapeType.roundRect, { x: 8.5, y: 1.85, w: 2.2, h: 0.34, rectRadius: 0.05, fill: { color: ORANGE } });
  s.addText('CATEGORY SPARK', { x: 8.5, y: 1.85, w: 2.2, h: 0.34, align: 'center', valign: 'middle', fontSize: 14, bold: true, color: WHITE, fontFace: BODY, margin: 0 });
  s.addShape(pres.ShapeType.roundRect, { x: 10.82, y: 1.85, w: 1.75, h: 0.34, rectRadius: 0.05, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
  s.addText('5 CATEGORIES', { x: 10.82, y: 1.85, w: 1.75, h: 0.34, align: 'center', valign: 'middle', fontSize: 14, color: MUTED, fontFace: BODY, margin: 0 });

  card(s, { x: 8.5, y: 2.32, w: 4.07, h: 1.86, fill: TINT, line: LINE });
  s.addShape(pres.ShapeType.roundRect, { x: 8.68, y: 2.48, w: 0.62, h: 0.62, rectRadius: 0.08, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
  s.addText('Drools Puppy Treats · 150g', { x: 9.42, y: 2.48, w: 3.0, h: 0.34, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0 });
  s.addText('₹65', { x: 9.42, y: 2.8, w: 3.0, h: 0.3, fontSize: 14, bold: true, color: INK, fontFace: BODY, margin: 0 });
  s.addText('“You have a pet — pet supplies is the usual next thing people add”', {
    x: 8.68, y: 3.16, w: 3.72, h: 0.52, fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 16,
  });
  s.addText('~₹65/week  ·  your usual runs ~₹68/week', {
    x: 8.68, y: 3.72, w: 3.72, h: 0.32, fontSize: 14, bold: true, color: BLUE, fontFace: BODY, margin: 0,
  });

  const labels = [
    ['Reason', 'their own history, never “customers like you”'],
    ['Price anchor', '₹/week vs their own comparable spend'],
    ['Trust signal', 'most-reordered pick in that category'],
  ];
  let ly = 4.3;
  labels.forEach(([t, d]) => {
    s.addText(t, { x: 8.5, y: ly, w: 1.6, h: 0.3, fontSize: 14, bold: true, color: ORANGE, fontFace: BODY, margin: 0 });
    s.addText(d, { x: 10.12, y: ly, w: 2.45, h: 0.5, fontSize: 14, color: MUTED, fontFace: BODY, margin: 0, lineSpacing: 15 });
    ly += 0.54;
  });

  s.addShape(pres.ShapeType.roundRect, { x: 8.5, y: 5.98, w: 4.07, h: 0.42, rectRadius: 0.06, fill: { color: BLUE } });
  s.addText('Add to Cart', { x: 8.5, y: 5.98, w: 4.07, h: 0.42, align: 'center', valign: 'middle', fontSize: 14, bold: true, color: WHITE, fontFace: BODY, margin: 0 });

  s.addText('Try the live MVP — 10 shopper profiles, two of which correctly receive no suggestion at all', {
    x: 0.55, y: 6.62, w: 12.25, h: 0.4, fontSize: 14, bold: true, color: BLUE, fontFace: BODY, margin: 0,
    hyperlink: { url: MVP, tooltip: 'Live MVP' },
  });
  s.addNotes('Part 4. Not a feed, not a rail, not a browse tab — those were all ruled out by the survey.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 9 — Architecture
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  head(s, 9, 'Decisions are deterministic — the LLM only writes the sentence');

  const blocks = [
    ['1  Eligibility', 'Mode A first crossover · Mode B lapsed repeat · or neither', 'Rules, no model call. Fails closed to no card.'],
    ['2  Profile', 'Order history → owned categories, cadence, declared signals', 'Read from the shopper’s own data'],
    ['3  Candidates', 'Never-bought categories, minus any the shopper has closed', 'Also the only list the LLM may choose from'],
    ['4  Price anchor', '₹/week for the candidate vs their own comparable spend', 'Division. Never routed through a model'],
    ['5  Compose', 'One reason line + one trust line', 'The only step an LLM touches'],
  ];
  let by = 1.3;
  blocks.forEach(([t, d, n], i) => {
    const isLLM = i === 4;
    card(s, { x: 0.55, y: by, w: 7.55, h: 0.92, fill: isLLM ? TINTY : WHITE, line: isLLM ? YELLOW : LINE });
    s.addText(t, { x: 0.75, y: by + 0.1, w: 1.85, h: 0.32, fontSize: 14, bold: true, color: isLLM ? ORANGE : BLUE, fontFace: BODY, margin: 0 });
    s.addText(d, { x: 2.65, y: by + 0.1, w: 3.15, h: 0.72, fontSize: 14, color: INK, fontFace: BODY, margin: 0, lineSpacing: 16 });
    s.addText(n, { x: 5.9, y: by + 0.1, w: 2.05, h: 0.72, fontSize: 14, italic: true, color: MUTED, fontFace: BODY, margin: 0, lineSpacing: 15 });
    by += 1.0;
  });

  card(s, { x: 8.35, y: 1.3, w: 4.47, h: 2.42, fill: INK, line: INK });
  s.addText('No API key required', { x: 8.58, y: 1.42, w: 4.0, h: 0.32, fontSize: 14, bold: true, color: YELLOW, fontFace: BODY, margin: 0 });
  s.addText(
    'Mode, category, product and the anchor are identical with or without an LLM — only the wording differs. Copy is pre-generated in CI where ' +
      'the key lives, and discarded at render if the agent picked differently than it did at build time. A demo that a quota reset can break is not a demo.',
    { x: 8.58, y: 1.78, w: 4.0, h: 1.8, fontSize: 14, color: INK_SOFT, fontFace: BODY, margin: 0, lineSpacing: 17 }
  );

  card(s, { x: 8.35, y: 3.9, w: 4.47, h: 2.6, fill: WHITE, line: BLUE });
  s.addText('Agent evals — 11 pass, 1 not run', { x: 8.58, y: 4.02, w: 4.0, h: 0.32, fontSize: 14, bold: true, color: BLUE, fontFace: BODY, margin: 0 });
  s.addText(
    [
      { text: 'Never an owned or closed category', options: { bullet: true, breakLine: true } },
      { text: 'Every SKU exists and is in stock', options: { bullet: true, breakLine: true } },
      { text: 'Every reason traceable to history or a declared signal', options: { bullet: true, breakLine: true } },
      { text: 'The rendered ₹/week recomputes exactly', options: { bullet: true, breakLine: true } },
      { text: 'Each check is mutation-tested', options: { bullet: true } },
    ],
    { x: 8.63, y: 4.38, w: 3.95, h: 2.0, fontSize: 14, color: INK, fontFace: BODY, paraSpaceAfter: 5, margin: 0 }
  );

  s.addText('Deployed via GitHub Actions to GitHub Pages. The deploy job runs the evals first and refuses to publish on failure.', {
    x: 0.55, y: 6.5, w: 12.25, h: 0.4, fontSize: 14, color: MUTED, fontFace: BODY, margin: 0,
    hyperlink: { url: REPO, tooltip: 'Repository' },
  });
  s.addNotes('AI system design: the model is confined to the one step where being wrong is cheap and visible.');
}

// ═══════════════════════════════════════════════════════════════════════════
// 10 — Measurement + limits
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: INK };

  s.addShape(pres.ShapeType.ellipse, { x: 0.55, y: 0.42, w: 0.52, h: 0.52, fill: { color: YELLOW } });
  s.addText('10', { x: 0.55, y: 0.42, w: 0.52, h: 0.52, align: 'center', valign: 'middle', fontSize: 16, bold: true, color: INK, fontFace: BODY, margin: 0 });
  s.addText('Pre-registered guardrails, and what would kill this', {
    x: 1.25, y: 0.28, w: 11.5, h: 0.86, fontSize: 23, bold: true, color: WHITE, fontFace: HEAD, valign: 'middle', margin: 0,
  });

  const cols = [
    ['Guardrails — committed in advance', ORANGE, [
      'No AOV degradation',
      'No drop in core-category order frequency — >3% is a kill',
      'No rise in refund / return rate',
      'Card dismissal rate below 60%',
      'Decided before the result, so it cannot be relitigated after',
    ]],
    ['What would falsify the hypothesis', BLUE, [
      'Cards are added but the category never repeats — trial without repeat is a discount, not exploration',
      'Dismissal climbs with exposure — the card is noise',
      'CER rises while core frequency falls — we moved attention, not behaviour',
    ]],
    ['Limits we state rather than bury', YELLOW, [
      'n=40 convenience sample, skewed young and metro. Baby (3) and pet (2) owners too thin for segment claims',
      'n=5 interviews: enough to challenge the vocabulary, never enough for an “X% of users” claim — and none is made',
      'The MVP runs on synthetic order histories. It demonstrates the mechanism, not real-world lift',
    ]],
  ];
  cols.forEach(([title, colour, items], i) => {
    const x = 0.55 + i * 4.15;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.35, w: 3.9, h: 4.35, rectRadius: 0.08,
      fill: { color: '242938' }, line: { color: '394054', width: 1 },
    });
    s.addText(title, { x: x + 0.22, y: 1.5, w: 3.45, h: 0.6, fontSize: 14, bold: true, color: colour, fontFace: BODY, margin: 0 });
    s.addText(
      items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j !== items.length - 1 } })),
      { x: x + 0.27, y: 2.12, w: 3.4, h: 3.4, fontSize: 14, color: INK_SOFT, fontFace: BODY, paraSpaceAfter: 8, margin: 0, lineSpacing: 17 }
    );
  });

  s.addText('No interview was fabricated, and no synthetic persona is counted toward the total. Of five hypotheses the AI personas produced, one was testable — and it was wrong.', {
    x: 0.55, y: 5.85, w: 12.25, h: 0.55, fontSize: 15, bold: true, color: WHITE, fontFace: BODY, margin: 0,
  });
  s.addText('Live MVP  ·  Repository, corpus and evals  ·  Full written case study', {
    x: 0.55, y: 6.5, w: 12.25, h: 0.4, fontSize: 14, bold: true, color: YELLOW, fontFace: BODY, margin: 0,
    hyperlink: { url: MVP, tooltip: 'Live MVP' },
  });
  s.addNotes('Close on falsifiability: the guardrails and the kill thresholds were written before any result existed.');
}

pres.writeFile({ fileName: 'Blinkit-Category-Exploration.pptx' }).then(() => console.log('written'));
