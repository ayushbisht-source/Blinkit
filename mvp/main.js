// Storefront wiring for the One Thing MVP.
//
// Deliberately runs the *same* agent modules the eval suite tests — no reimplementation for the
// browser. If the demo shows a card, that card came from the code that passes the evals.

import { USERS, CATALOGUE } from './data/seed.js';
import { suggest } from './agent/suggest.js';
import { categoryHistory } from './agent/eligibility.js';

const $ = (id) => document.getElementById(id);
const rupees = (n) => '₹' + n.toLocaleString('en-IN');

let currentUser = USERS[0];
let cart = [];

function renderUserPicker() {
  $('user').innerHTML = USERS.map((u) => `<option value="${u.id}">${u.label}</option>`).join('');
  $('user').onchange = (e) => {
    currentUser = USERS.find((u) => u.id === e.target.value);
    cart = [];
    renderAll();
  };
}

function renderPersona() {
  const owned = Object.keys(categoryHistory(currentUser));
  const signals = currentUser.signals ?? [];
  $('persona').textContent =
    `${currentUser.orders.length} orders on record. ` +
    (signals.length ? `Declared: ${signals.map((s) => s.replace(/_/g, ' ')).join(', ')}.` : 'No declared signals.');
  $('owned').innerHTML =
    (owned.length ? owned : ['no purchase history'])
      .map((c) => `<span class="chip">${c}</span>`)
      .join('');
}

function renderCatalogue() {
  $('grid').innerHTML = CATALOGUE.map(
    (p) => `
    <div class="prod">
      <div class="cat">${p.category}</div>
      <div class="nm">${p.name}</div>
      <div class="pk">${p.pack}</div>
      <div class="row">
        <span class="pr">${rupees(p.price)}</span>
        <button class="add" data-id="${p.id}">Add</button>
      </div>
    </div>`
  ).join('');
  $('grid').querySelectorAll('.add').forEach((b) => {
    b.onclick = () => {
      cart.push(CATALOGUE.find((p) => p.id === b.dataset.id));
      renderCart();
    };
  });
}

async function renderCart() {
  if (cart.length === 0) {
    $('cart').innerHTML = '<div class="empty">Cart is empty. Add something to trigger cart review.</div>';
    $('suggestion').innerHTML = '';
    $('log').textContent = '—';
    return;
  }

  const total = cart.reduce((s, p) => s + p.price, 0);
  $('cart').innerHTML =
    cart.map((p) => `<div class="cart-item"><span>${p.name}</span><span>${rupees(p.price)}</span></div>`).join('') +
    `<div class="cart-total"><span>Total</span><span>${rupees(total)}</span></div>`;

  // Cart review is the trigger point: the task the user came for is done, so attention is free.
  const out = await suggest(currentUser);
  renderSuggestion(out);
}

function renderSuggestion(out) {
  if (!out.card) {
    $('suggestion').innerHTML = `
      <div class="nocard">
        <strong>No card shown.</strong><br>
        Reason: <code>${out.why}</code><br><br>
        Showing nothing is a designed outcome — a card whose reason the data cannot substantiate
        is exactly the noise users already ignore.
      </div>`;
    $('log').textContent = `mode: ${out.mode}\nsuppressed: ${out.why}`;
    return;
  }

  const c = out.card;
  const anchorClass = c.anchorFavourable === false ? 'anchor bad' : 'anchor';
  $('suggestion').innerHTML = `
    <div class="onething">
      <span class="mode ${out.mode === 'B' ? 'b' : ''}">
        ${out.mode === 'B' ? 'MODE B · SECOND PURCHASE' : 'MODE A · FIRST CROSSOVER'}
      </span>
      <div class="reason">${c.reason}</div>
      <div class="prod-line">
        <span class="nm">${c.product.name} · ${c.product.pack}</span>
        <span class="price">${rupees(c.product.price)}</span>
      </div>
      ${c.anchorLine ? `<div class="${anchorClass}">${c.anchorLine}</div>` : ''}
      <div class="trust">${c.trust}</div>
      <div class="cta">
        <button class="primary" id="acc">Add to cart</button>
        <button class="ghost" id="dis">Not now</button>
      </div>
      <div class="why">
        Category <code>${c.category}</code> — never purchased by this shopper.
        ${c.anchorLine ? 'Price shown per week against their own comparable spend, not as a bare number.' : 'No comparable spend on record, so no anchor is claimed.'}
      </div>
    </div>`;

  $('acc').onclick = () => {
    cart.push(CATALOGUE.find((p) => p.id === c.product.id));
    renderCart();
  };
  $('dis').onclick = () => {
    $('suggestion').innerHTML = '<div class="nocard">Dismissed. Dismissal rate is a guardrail metric — this feature dies if it becomes noise.</div>';
  };

  $('log').textContent = [
    `mode:        ${out.mode}`,
    `category:    ${c.category}`,
    `product:     ${c.product.name} (${c.product.id})`,
    `anchor:      ${c.anchorLine ?? '(none — no comparable spend)'}`,
    `favourable:  ${c.anchorFavourable}`,
    `rationale:   ${out.rationale.join(' | ')}`,
  ].join('\n');
}

function renderAll() {
  renderPersona();
  renderCatalogue();
  renderCart();
}

renderUserPicker();
renderAll();
