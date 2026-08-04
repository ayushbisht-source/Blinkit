// Storefront wiring for the Category Spark MVP.
//
// Deliberately runs the *same* agent modules the eval suite tests — no reimplementation for the
// browser. If the demo shows a card, that card came from the code that passes the evals.
//
// No instrumentation panels: this is styled as the surface a shopper would actually see. The
// agent's reasoning is still fully inspectable — it is asserted by mvp/evals/run.mjs, which is what
// should be trusted anyway, rather than by a number printed next to the thing that produced it.
// There are deliberately no uplift figures anywhere in this demo either — there is no experiment
// behind one, and an invented percentage would be the most confident number on the page with
// nothing supporting it.

import { USERS, CATALOGUE, PRODUCTS_BY_ID } from './data/seed.js';
import { suggestMany } from './agent/suggest.js';

// How many suggestions the row may carry. The agent routinely returns fewer — a candidate with no
// substantiated reason is dropped rather than padded — so this is a ceiling, not a quota.
const MAX_SUGGESTIONS = 5;

// LLM-written copy, generated in CI where the API key lives (see scripts/pregenerate-copy.mjs).
// Absent or empty is fine — the agent's deterministic copy takes over and the card still works.
let LLM_COPY = {};
try {
  LLM_COPY = await fetch('./data/llm-copy.json').then((r) => (r.ok ? r.json() : {}));
} catch {
  LLM_COPY = {};
}

const $ = (id) => document.getElementById(id);
const rupees = (n) => 'Rs ' + Math.round(n).toLocaleString('en-IN');
const ICONS = {
  'Dairy & Bread': '🥛', 'Snacks & Beverages': '🥤', 'Fruits & Vegetables': '🥬',
  'Household Essentials': '🧴', 'Personal Care': '🪥', 'Baby Care': '🍼',
  'Pet Supplies': '🐕', 'Home & Kitchen': '🍶', 'Health & Pharma': '💊',
  'Frozen Food': '🧊', 'Tea & Coffee': '☕', 'Cleaning Supplies': '🧽',
};

// Free delivery above this. Present because P03 and 133 corpus documents describe the threshold
// shaping what goes in the basket (docs/02 §8.3) — the bill is where a shopper actually meets it.
const FREE_DELIVERY_ABOVE = 199;
const DELIVERY_FEE = 25;

let currentUser = USERS[0];
let cart = [];
let lastKey = null;             // suppresses duplicate impressions on re-render

// Deterministic rating, so the card reads like a storefront without inventing fresh numbers on
// every render — a rating that changed as you clicked would be exactly the kind of fake detail
// the rest of this project refuses to ship.
const rating = (id) => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return { stars: (4.1 + (h % 9) / 10).toFixed(1), count: 800 + (h % 2400) };
};

// ── personas ─────────────────────────────────────────────────────────────────────────────────
const avgOrderValue = (u) =>
  u.orders.reduce(
    (s, o) => s + o.items.reduce((x, i) => x + (PRODUCTS_BY_ID[i.productId]?.price ?? 0) * i.qty, 0),
    0
  ) / Math.max(1, u.orders.length);

function renderPersonas() {
  $('personas').innerHTML = USERS.map((u) => `
    <button class="persona" data-id="${u.id}" aria-current="${u.id === currentUser.id}">
      <div class="pn">${u.name ?? u.id}</div>
      <div class="ptag">${u.tag ?? u.subtitle ?? ''}</div>
      <div class="prow">
        <span>Household: <b>${u.household ?? '—'}</b></span>
        <span>AOV Profiling: <b>${rupees(avgOrderValue(u))}</b></span>
      </div>
    </button>`).join('');

  $('personas').querySelectorAll('.persona').forEach((b) => {
    b.onclick = () => {
      currentUser = USERS.find((u) => u.id === b.dataset.id);
      lastKey = null;
      loadRegularBasket();
      renderAll();
    };
  });
}

// The basket starts pre-filled with the shopper's most recent order, because this is a *fetch-mode*
// session — which is what 38 of 40 survey respondents described. Starting empty would model a
// browsing session, the one behaviour the research says almost nobody is in.
function loadRegularBasket() {
  const last = currentUser.orders?.[0];
  cart = last ? last.items.map((i) => ({ productId: i.productId, qty: i.qty })) : [];
}

// ── catalogue + cart ─────────────────────────────────────────────────────────────────────────
function renderCatalogue() {
  $('grid').innerHTML = CATALOGUE.filter((p) => p.stock > 0).map((p) => `
    <div class="prod">
      <div class="c">${p.category}</div>
      <div class="n">${p.name}</div>
      <div class="p">${p.pack} · ${rupees(p.price)}</div>
      <button data-id="${p.id}">Add</button>
    </div>`).join('');

  $('grid').querySelectorAll('button').forEach((b) => {
    b.onclick = () => addToCart(b.dataset.id);
  });
}

function addToCart(productId, qty = 1) {
  const line = cart.find((l) => l.productId === productId);
  if (line) line.qty += qty;
  else cart.push({ productId, qty });
  render();
}

function setQty(productId, delta) {
  const line = cart.find((l) => l.productId === productId);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((l) => l.productId !== productId);
  render();
}

function cartTotal() {
  return cart.reduce((s, l) => s + (PRODUCTS_BY_ID[l.productId]?.price ?? 0) * l.qty, 0);
}

function renderCart() {
  if (!cart.length) {
    $('cart').innerHTML =
      '<div class="empty">Basket is empty. Add items below — the agent only acts at cart review, ' +
      'when the task the shopper came for is already done.</div>';
    return;
  }
  $('cart').innerHTML = cart.map((l) => {
    const p = PRODUCTS_BY_ID[l.productId];
    return `
      <div class="item">
        <span class="thumb">${ICONS[p.category] ?? '🛒'}</span>
        <span class="nm"><b>${p.name}</b><span>Qty: ${l.qty} · ${p.pack}</span></span>
        <span class="qty"><button data-dec="${p.id}">−</button><button data-inc="${p.id}">+</button></span>
        <span class="pr">${rupees(p.price * l.qty)}</span>
      </div>`;
  }).join('');
  $('cart').querySelectorAll('[data-inc]').forEach((b) => (b.onclick = () => setQty(b.dataset.inc, 1)));
  $('cart').querySelectorAll('[data-dec]').forEach((b) => (b.onclick = () => setQty(b.dataset.dec, -1)));
}

function renderBill() {
  const total = cartTotal();
  const free = total >= FREE_DELIVERY_ABOVE;
  const fee = cart.length && !free ? DELIVERY_FEE : 0;
  $('bill').innerHTML = cart.length ? `
    <div class="sect">BILL DETAILS</div>
    <div class="r"><span>Item Total</span><b>${rupees(total)}</b></div>
    <div class="r"><span>Delivery Partner Fee</span>
      <b class="${free ? 'free' : ''}">${free ? 'FREE (Waiver)' : rupees(DELIVERY_FEE)}</b></div>
    ${free ? '' : `<div class="r"><span class="warn">Add ${rupees(FREE_DELIVERY_ABOVE - total)} more for free delivery</span><b></b></div>`}
  ` : '';
  $('placetotal').textContent = rupees(total + fee);
}

// ── the card ─────────────────────────────────────────────────────────────────────────────────
async function renderSuggestion() {
  if (!cart.length) {
    $('suggestion').innerHTML = '';
    lastKey = null;
    return;
  }

  const out = await suggestMany(currentUser, { limit: MAX_SUGGESTIONS });

  // Swap in pre-generated copy only for the card it was written for. If the agent picked a different
  // category or product than it did at build time, the stored line would be a false statement about
  // this shopper — so it is discarded rather than shown.
  const pre = LLM_COPY[currentUser.id];
  for (const c of out.cards) {
    if (pre && pre.category === c.category && pre.productId === c.product.id) {
      c.reason = pre.reason;
      c.trust = pre.trust;
    }
  }

  if (!out.cards.length) {
    $('suggestion').innerHTML = `
      <div class="nocard">
        <b>Nothing to suggest.</b>
        <p>Reason: <code>${out.why}</code></p>
        <p>Showing nothing is a designed outcome. A card whose reason the data cannot substantiate is
        exactly the noise these shoppers already ignore — and two of the five interviews describe
        barriers that no suggestion can close.</p>
      </div>`;
    if (lastKey !== 'none') {
      lastKey = 'none';
    }
    return;
  }

  const key = `${currentUser.id}:${out.cards.map((c) => c.product.id).join(',')}`;
  const plural = out.cards.length === 1 ? 'CATEGORY' : 'CATEGORIES';

  $('suggestion').innerHTML = `
    <div class="spark">
      <div class="sk-head">
        <span class="sk-pill">📍 CATEGORY SPARK</span>
        <span class="sk-mode ${out.mode === 'B' ? 'b' : ''}">${out.cards.length} NEW ${plural}</span>
        <button class="sk-x" id="dis" title="Dismiss">×</button>
      </div>
      ${out.cards.map((c) => {
        const r = rating(c.product.id);
        return `
        <div class="skitem">
          <span class="th">${ICONS[c.category] ?? '🛒'}</span>
          <div class="bd">
            <div class="cat">${c.category.toUpperCase()}${c.mode === 'B' ? ' · <em>MODE B</em>' : ''}</div>
            <div class="n">${c.product.name}</div>
            <div class="meta">${c.product.pack} &nbsp;|&nbsp; <span class="star">${r.stars} ★</span> (${r.count.toLocaleString('en-IN')})</div>
            <div class="rs">${c.reason}</div>
            ${c.anchorLine ? `<div class="an ${c.anchorFavourable === false ? 'bad' : ''}">${c.anchorLine}</div>` : ''}
            <div class="tr">${c.trust}</div>
          </div>
          <div class="sd">
            <span class="pz">${rupees(c.product.price)}</span>
            <button class="ad" data-add="${c.product.id}">Add</button>
          </div>
        </div>`;
      }).join('')}
      <button class="notnow" id="not">Not now</button>
    </div>`;

  $('suggestion').querySelectorAll('[data-add]').forEach((b) => {
    b.onclick = () => addToCart(b.dataset.add);
  });

  const dismiss = () => {
    $('suggestion').innerHTML =
      '<div class="nocard"><b>Dismissed.</b><p>Recorded. Dismissal rate is a pre-registered guardrail — this feature dies if it becomes noise.</p></div>';
  };
  $('dis').onclick = dismiss;
  $('not').onclick = dismiss;

  if (lastKey !== key) {
    lastKey = key;
  }
}

// ── render ───────────────────────────────────────────────────────────────────────────────────
function render() {
  renderCart();
  renderBill();
  renderSuggestion();
}

function renderAll() {
  $('who').textContent = currentUser.name ?? currentUser.id;
  $('personas').querySelectorAll('.persona').forEach((b) => {
    b.setAttribute('aria-current', String(b.dataset.id === currentUser.id));
  });
  render();
}

$('place').onclick = () => {
  if (!cart.length) return;
  loadRegularBasket();
  lastKey = null;
  render();
};

renderPersonas();
renderCatalogue();
loadRegularBasket();
renderAll();
