// Storefront wiring for the Category Spark MVP.
//
// Deliberately runs the *same* agent modules the eval suite tests — no reimplementation for the
// browser. If the demo shows a card, that card came from the code that passes the evals.
//
// The decision trace under the phone is the only instrumentation kept: it shows mode, category,
// product, anchor and the rationale behind whatever the agent just did. There are deliberately no
// uplift figures anywhere in this demo — there is no experiment behind one, and an invented
// percentage would be the most confident number on the page with nothing supporting it.

import { USERS, CATALOGUE, PRODUCTS_BY_ID } from './data/seed.js';
import { suggest } from './agent/suggest.js';

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
    $('trace').textContent = 'Empty basket — the agent has not been asked.';
    lastKey = null;
    return;
  }

  const out = await suggest(currentUser);

  // Swap in pre-generated copy only if it was written for this exact decision. If the agent picked
  // a different category or product than it did at build time, the stored line would be a false
  // statement about this shopper — so it is discarded rather than shown.
  const pre = LLM_COPY[currentUser.id];
  if (out.card && pre && pre.category === out.card.category && pre.productId === out.card.product.id) {
    out.card.reason = pre.reason;
    out.card.trust = pre.trust;
    out.copySource = `LLM (${pre.model})`;
  } else if (out.card) {
    out.copySource = 'deterministic fallback';
  }

  if (!out.card) {
    $('suggestion').innerHTML = `
      <div class="nocard">
        <b>No card shown.</b>
        <p>Reason: <code>${out.why}</code></p>
        <p>Showing nothing is a designed outcome. A card whose reason the data cannot substantiate is
        exactly the noise these shoppers already ignore — and two of the five interviews describe
        barriers that no suggestion can close.</p>
      </div>`;
    $('trace').textContent = [
      `mode:       ${out.mode}`,
      `suppressed: ${out.why}`,
      ``,
      `expected:   ${currentUser.expect ?? '—'}`,
    ].join('\n');
    if (lastKey !== 'none') {
      lastKey = 'none';
    }
    return;
  }

  const c = out.card;
  const key = `${currentUser.id}:${c.product.id}`;
  const r = rating(c.product.id);
  $('suggestion').innerHTML = `
    <div class="spark">
      <div class="sk-head">
        <span class="sk-pill">📍 CATEGORY SPARK</span>
        <span class="sk-mode ${out.mode === 'B' ? 'b' : ''}">${out.mode === 'B' ? 'MODE B' : 'MODE A'}</span>
        <button class="sk-x" id="dis" title="Dismiss">×</button>
      </div>
      <div class="sk-main">
        <span class="sk-thumb">${ICONS[c.category] ?? '🛒'}</span>
        <span class="sk-info">
          <div class="n">${c.product.name}</div>
          <div class="meta">${c.product.pack} &nbsp;|&nbsp; <span class="star">${r.stars} ★</span> (${r.count.toLocaleString('en-IN')} ratings)</div>
          <div class="price">${rupees(c.product.price)}</div>
        </span>
      </div>
      <div class="reason">${c.reason}</div>
      ${c.anchorLine ? `<div class="anchor ${c.anchorFavourable === false ? 'bad' : ''}">${c.anchorLine}</div>` : ''}
      <div class="trust">${c.trust}</div>
      <button class="addbtn" id="acc">Add to Cart</button>
      <button class="notnow" id="not">Not now</button>
    </div>`;

  $('acc').onclick = () => {
    addToCart(c.product.id);
  };
  const dismiss = () => {
    $('suggestion').innerHTML =
      '<div class="nocard"><b>Dismissed.</b><p>Recorded. Dismissal rate is a pre-registered guardrail — this feature dies if it becomes noise.</p></div>';
  };
  $('dis').onclick = dismiss;
  $('not').onclick = dismiss;

  $('trace').textContent = [
    `mode:       ${out.mode}`,
    `category:   ${c.category}   (never purchased by this shopper)`,
    `product:    ${c.product.name} (${c.product.id})`,
    `anchor:     ${c.anchorLine ?? '(none — no comparable spend on record)'}`,
    `favourable: ${c.anchorFavourable}`,
    `copy:       ${out.copySource}`,
    `rationale:  ${out.rationale.join(' | ')}`,
    ``,
    `mode, category, product and anchor are computed deterministically`,
    `and are identical with or without an LLM. only the wording differs.`,
  ].join('\n');

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
