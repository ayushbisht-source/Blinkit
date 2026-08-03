// Storefront wiring for the Category Spark MVP.
//
// Deliberately runs the *same* agent modules the eval suite tests — no reimplementation for the
// browser. If the demo shows a card, that card came from the code that passes the evals.
//
// No diagnostics panel and no uplift figures: this is styled as the storefront a shopper would
// actually see. The agent's reasoning is still fully inspectable — it is asserted by
// mvp/evals/run.mjs, which is what should be trusted anyway, rather than by a number printed
// next to the thing that produced it.

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
const rupees = (n) => '\u20B9' + Math.round(n).toLocaleString('en-IN');
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
    <button class="chip" data-id="${u.id}" aria-current="${u.id === currentUser.id}">
      <div class="cn">${u.name}</div>
      <div class="ct">${u.tag}</div>
      <span class="cp ${u.provenance ? '' : 'syn'}">${u.provenance ?? 'LIFESTYLE'}</span>
    </button>`).join('');

  $('personas').querySelectorAll('.chip').forEach((b) => {
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
      <div class="img">${ICONS[p.category] ?? '\uD83D\uDED2'}</div>
      <div class="cat">${p.category}</div>
      <div class="nm">${p.name}</div>
      <div class="pk">${p.pack}</div>
      <div class="foot">
        <span class="pr">${rupees(p.price)}</span>
        <button class="add" data-id="${p.id}">ADD</button>
      </div>
    </div>`).join('');
  $('grid').querySelectorAll('.add').forEach((b) => (b.onclick = () => addToCart(b.dataset.id)));
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
    $('cart').innerHTML = '<div class="empty">Cart is empty. Add something to trigger cart review.</div>';
    return;
  }
  $('cart').innerHTML = cart.map((l) => {
    const p = PRODUCTS_BY_ID[l.productId];
    return `
      <div class="crow">
        <span class="ci">${ICONS[p.category] ?? '\uD83D\uDED2'}</span>
        <span class="cd"><b>${p.name}</b><span>${p.pack}</span></span>
        <span class="stepper">
          <button data-dec="${p.id}">\u2212</button><b>${l.qty}</b><button data-inc="${p.id}">+</button>
        </span>
        <span class="cv">${rupees(p.price * l.qty)}</span>
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
    <div class="b"><span>Item total</span><b>${rupees(total)}</b></div>
    <div class="b"><span>Delivery charge</span>
      <b class="${free ? 'free' : ''}">${free ? 'FREE' : rupees(DELIVERY_FEE)}</b></div>
    ${free ? '' : `<div class="b"><span class="warn">Add ${rupees(FREE_DELIVERY_ABOVE - total)} more for free delivery</span><b></b></div>`}
  ` : '';
  $('paytotal').textContent = rupees(total + fee);
  const n = cart.reduce((s, l) => s + l.qty, 0);
  $('carttop').textContent = n ? `${n} item${n > 1 ? 's' : ''} \u00B7 ${rupees(total + fee)}` : 'My Cart';
}

// ── the card ─────────────────────────────────────────────────────────────────────────────────
async function renderSuggestion() {
  if (!cart.length) {
    $('suggestion').innerHTML = '';
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
        <b>No suggestion shown.</b>
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

  const c = out.card;
  const key = `${currentUser.id}:${c.product.id}`;
  const r = rating(c.product.id);
  $('suggestion').innerHTML = `
    <div class="spark">
      <div class="skhead">
        <span class="skpill">CATEGORY SPARK</span>
        <span class="skmode ${out.mode === 'B' ? 'b' : ''}">${out.mode === 'B' ? 'MODE B · SECOND PURCHASE' : 'MODE A · FIRST CROSSOVER'}</span>
        <button class="skx" id="dis" title="Dismiss">×</button>
      </div>
      <div class="skmain">
        <span class="skimg">${ICONS[c.category] ?? '🛒'}</span>
        <span class="skinfo">
          <div class="n">${c.product.name}</div>
          <div class="m">${c.product.pack} &nbsp;·&nbsp; <span class="star">${r.stars} ★</span> (${r.count.toLocaleString('en-IN')})</div>
          <div class="p">${rupees(c.product.price)}</div>
        </span>
      </div>
      <div class="reason">${c.reason}</div>
      ${c.anchorLine ? `<div class="anchor ${c.anchorFavourable === false ? 'bad' : ''}">${c.anchorLine}</div>` : ''}
      <div class="trust">${c.trust}</div>
      <button class="skadd" id="acc">Add to Cart</button>
      <button class="sknot" id="not">Not now</button>
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
  $('who').textContent = `${currentUser.name} · ${currentUser.household}`;
  $('personas').querySelectorAll('.persona').forEach((b) => {
    b.setAttribute('aria-current', String(b.dataset.id === currentUser.id));
  });
  render();
}

const placeOrder = () => {
  if (!cart.length) return;
  loadRegularBasket();
  lastKey = null;
  render();
};
$('pay').onclick = placeOrder;
$('paytop').onclick = placeOrder;

renderPersonas();
renderCatalogue();
loadRegularBasket();
renderAll();
