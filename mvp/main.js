// Storefront wiring for the Category Spark MVP.
//
// Deliberately runs the *same* agent modules the eval suite tests — no reimplementation for the
// browser. If the demo shows a card, that card came from the code that passes the evals.
//
// The diagnostics panel counts only what happens in this session. There are no projected lift
// figures, because there is no experiment behind them, and a plausible-looking percentage on a demo
// is exactly the kind of number this project spent its validation budget arguing against.

import { USERS, CATALOGUE, PRODUCTS_BY_ID } from './data/seed.js';
import { suggest } from './agent/suggest.js';
import { categoryHistory } from './agent/eligibility.js';

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

// Free delivery above this. Present because P03 and 133 corpus documents both describe the
// threshold shaping what goes in the basket (docs/02 §8.3), and the bill is where a user meets it.
const FREE_DELIVERY_ABOVE = 199;
const DELIVERY_FEE = 25;

let currentUser = USERS[0];
let cart = [];
let events = [];
let lastCardKey = null;   // so re-renders don't log duplicate impressions

// ── events ───────────────────────────────────────────────────────────────────────────────────
function log(kind, detail, cls = '') {
  events.unshift({ t: new Date(), kind, detail, cls });
  events = events.slice(0, 60);
  renderDiagnostics();
}

function renderDiagnostics() {
  const imp = events.filter((e) => e.kind === 'SPARK_IMPRESSION').length;
  const sup = events.filter((e) => e.kind === 'SPARK_SUPPRESSED').length;
  const acc = events.filter((e) => e.kind === 'SPARK_ACCEPTED').length;
  const dis = events.filter((e) => e.kind === 'SPARK_DISMISSED').length;
  const shown = imp + sup;

  $('stats').innerHTML = [
    [imp, 'cards shown'],
    [sup, 'correctly suppressed'],
    [acc, 'accepted'],
    [shown ? Math.round((sup / shown) * 100) + '%' : '—', 'of moments declined'],
  ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');

  $('log').innerHTML = events.length
    ? events.map((e) => {
        const ts = e.t.toTimeString().slice(0, 8);
        return `<div class="ev"><span class="t">[${ts}]</span> <span class="k ${e.cls}">${e.kind}</span><br>
                <span class="d">&gt; ${e.detail}</span></div>`;
      }).join('')
    : '<span class="t">No events yet. Add something to the basket.</span>';

  $('caveat').innerHTML =
    `Accepted ${acc}, dismissed ${dis}. <strong>Dismissal rate is a pre-registered guardrail</strong> —
     this feature is designed to be killed if it becomes noise. No lift percentage is shown, because
     there is no experiment behind one.`;
}

// ── personas ─────────────────────────────────────────────────────────────────────────────────
function renderPersonas() {
  $('personas').innerHTML = USERS.map((u) => {
    const owned = Object.keys(categoryHistory(u));
    return `
      <button class="persona" data-id="${u.id}" aria-current="${u.id === currentUser.id}">
        <div class="pname">${u.name ?? u.id}</div>
        <div class="psub">${u.subtitle ?? u.label}</div>
        <div class="pmeta">
          <span>${u.orders.length} orders · ${owned.length} categories</span>
          <span class="prov">${u.provenance ?? ''}</span>
        </div>
      </button>`;
  }).join('');

  $('personas').querySelectorAll('.persona').forEach((b) => {
    b.onclick = () => {
      currentUser = USERS.find((u) => u.id === b.dataset.id);
      cart = [];
      lastCardKey = null;
      log('PERSONA_SELECTED', `${currentUser.name} — ${currentUser.subtitle ?? ''}`, 'acc');
      renderAll();
    };
  });
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
    b.onclick = () => {
      addToCart(b.dataset.id);
      log('ADD_TO_CART', `SKU: ${b.dataset.id} (${PRODUCTS_BY_ID[b.dataset.id].category})`);
    };
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
  return cart.reduce((s, l) => s + PRODUCTS_BY_ID[l.productId].price * l.qty, 0);
}

function renderCart() {
  if (!cart.length) {
    $('cart').innerHTML =
      '<div class="empty">Basket is empty. Add something below — the agent only acts at cart review, ' +
      'because that is the moment the task the user came for is already done.</div>';
    return;
  }
  $('cart').innerHTML = cart.map((l) => {
    const p = PRODUCTS_BY_ID[l.productId];
    return `
      <div class="row">
        <span class="ico">${ICONS[p.category] ?? '🛒'}</span>
        <span class="nm"><b>${p.name}</b><span>${p.pack}</span></span>
        <span class="qty">
          <button data-dec="${p.id}">−</button><b>${l.qty}</b><button data-inc="${p.id}">+</button>
        </span>
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
    <div><span>Item total</span><span>${rupees(total)}</span></div>
    <div><span>Delivery fee</span><span class="${free ? 'free' : ''}">${free ? 'FREE (waived)' : rupees(DELIVERY_FEE)}</span></div>
    ${free ? '' : `<div><span style="color:#fb923c">Add ${rupees(FREE_DELIVERY_ABOVE - total)} more for free delivery</span><span></span></div>`}
    <div class="tot"><span>To pay</span><span>${rupees(total + fee)}</span></div>` : '';
  $('place').style.display = cart.length ? 'block' : 'none';
}

// ── the card ─────────────────────────────────────────────────────────────────────────────────
async function renderSuggestion() {
  if (!cart.length) {
    $('suggestion').innerHTML = '';
    $('trace').textContent = 'No basket yet — the agent has not been asked.';
    lastCardKey = null;
    return;
  }

  const out = await suggest(currentUser);

  // Swap in pre-generated copy only if it was written for this exact decision. If the agent picked
  // a different category or product than it did at build time, the stored line would be a false
  // statement about this user — so it is discarded rather than shown.
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
        exactly the noise these users already ignore — and two of the five interviews describe
        barriers that no suggestion can close.</p>
      </div>`;
    $('trace').textContent = [
      `mode:       ${out.mode}`,
      `suppressed: ${out.why}`,
      ``,
      `expected:   ${currentUser.expect ?? '—'}`,
    ].join('\n');
    if (lastCardKey !== 'none') {
      lastCardKey = 'none';
      log('SPARK_SUPPRESSED', `${currentUser.name} — ${out.why}`, 'sup');
    }
    return;
  }

  const c = out.card;
  const key = `${currentUser.id}:${c.product.id}`;
  $('suggestion').innerHTML = `
    <div class="spark">
      <div class="spark-head">
        <span class="spark-pill">CATEGORY SPARK</span>
        <span class="mode-pill ${out.mode === 'B' ? 'b' : ''}">
          ${out.mode === 'B' ? 'MODE B · SECOND PURCHASE' : 'MODE A · FIRST CROSSOVER'}
        </span>
        <button class="spark-x" id="dis" title="Dismiss">×</button>
      </div>
      <div class="pname">${c.product.name}</div>
      <div class="meta">${c.product.pack} · ${c.category}</div>
      <div class="price">${rupees(c.product.price)}</div>
      <div class="reason">${c.reason}</div>
      ${c.anchorLine ? `<div class="anchor ${c.anchorFavourable === false ? 'bad' : ''}">${c.anchorLine}</div>` : ''}
      <div class="trust">${c.trust}</div>
      <div class="cta">
        <button class="primary" id="acc">Add to basket</button>
        <button class="ghost" id="not">Not now</button>
      </div>
    </div>`;

  $('acc').onclick = () => {
    log('SPARK_ACCEPTED', `${c.category} — ${c.product.name}`, 'acc');
    addToCart(c.product.id);
  };
  const dismiss = () => {
    log('SPARK_DISMISSED', `${c.category} — dismissal rate is a guardrail metric`, 'sup');
    $('suggestion').innerHTML =
      '<div class="nocard"><b>Dismissed.</b><p>Recorded. Dismissal rate is a pre-registered ' +
      'guardrail — this feature dies if it becomes noise.</p></div>';
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

  if (lastCardKey !== key) {
    lastCardKey = key;
    log('SPARK_IMPRESSION', `${currentUser.name} | ${c.category} | ${c.product.id} | mode ${out.mode}`);
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
  log('ORDER_PLACED', `${cart.length} lines · ${rupees(cartTotal())}`, 'acc');
  cart = [];
  lastCardKey = null;
  render();
};

renderPersonas();
renderCatalogue();
renderDiagnostics();
renderAll();
