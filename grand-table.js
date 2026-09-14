// ══════════════════════════════════════════════════════════════════════
//  GRAND TABLE — permanent second package, alongside the Shabbat Dinner
//
//  Ordered exactly like the Shabbat Dinner package (package.js): a
//  fixed-price-per-person package added to the website cart and paid
//  for through the normal checkout. Unlike the Shabbat package the menu
//  itself is fixed — the only choice is which salmon to include.
//
//  The optional add-ons below reuse the real menu products and their
//  live à la carte prices, and go through the normal cart/checkout the
//  same way.
// ══════════════════════════════════════════════════════════════════════
const GT_PACKAGE = {
  name: 'Chefaleh Grand Table',
  pricePerPerson: 125,
  minGuests: 6,
  maxGuests: 30,
  fishOptions: ['Pomegranate Glazed Salmon', 'Moroccan Salmon'],
};
const GT_ADDON_NAMES = ['Chefaleh Simanim Platter', 'Classic Potato Kugel', 'Classic Honey Cake', 'Chocolate Babka'];

let gtGuestCount = GT_PACKAGE.minGuests;
let gtSelectedFish = GT_PACKAGE.fishOptions[1];
let gtCategories = [];
let gtProducts = [];

function fmt(n) { return '$' + n.toFixed(2); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escJs(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function gtTotal() {
  return GT_PACKAGE.pricePerPerson * gtGuestCount;
}

function renderGtGuests() {
  const count = document.getElementById('gt-guest-count');
  if (count) count.textContent = gtGuestCount;
  const minus = document.getElementById('gt-guest-minus');
  if (minus) minus.disabled = gtGuestCount <= GT_PACKAGE.minGuests;
  const plus = document.getElementById('gt-guest-plus');
  if (plus) plus.disabled = gtGuestCount >= GT_PACKAGE.maxGuests;
  renderGtSummary();
}

function gtIncrementGuests() {
  if (gtGuestCount < GT_PACKAGE.maxGuests) gtGuestCount++;
  renderGtGuests();
}
function gtDecrementGuests() {
  if (gtGuestCount > GT_PACKAGE.minGuests) gtGuestCount--;
  renderGtGuests();
}

function renderGtFish() {
  const el = document.getElementById('gt-fish-picks');
  if (el) {
    el.innerHTML = GT_PACKAGE.fishOptions.map(name => `
      <div class="pick pick-mini text-center${gtSelectedFish === name ? ' active' : ''}" onclick="selectGtFish('${escJs(name)}')">
        <div class="pick-label" style="font-size:1.05rem">${esc(name)}</div>
      </div>`).join('');
  }
}

function selectGtFish(name) {
  gtSelectedFish = name;
  renderGtFish();
}

function renderGtSummary() {
  const breakdown = document.getElementById('gt-breakdown');
  if (breakdown) {
    breakdown.innerHTML = `<div class="sum-row"><span class="sum-label">${gtGuestCount} guests &times; ${fmt(GT_PACKAGE.pricePerPerson)}</span><span class="sum-val">${fmt(gtTotal())}</span></div>`;
  }
  const total = document.getElementById('gt-grand-total');
  if (total) total.textContent = fmt(gtTotal());
}

// ── Add the package to cart as a single line item, same as the Shabbat Dinner package ──
function addGtPackageToCart() {
  const lines = [`Guests: ${gtGuestCount}`, `Fish: ${gtSelectedFish}`];
  addItem(GT_PACKAGE.name, gtTotal(), `Serves ${gtGuestCount}`, lines.join('\n'), false, [], []);

  gtGuestCount = GT_PACKAGE.minGuests;
  gtSelectedFish = GT_PACKAGE.fishOptions[1];
  renderGtFish();
  renderGtGuests();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Optional add-ons — real menu products, real cart, current à la carte price ──
function renderGtAddons() {
  const el = document.getElementById('gt-addons-grid');
  if (!el) return;
  const items = GT_ADDON_NAMES
    .map(name => gtProducts.find(p => p.name === name && p.visible !== false))
    .filter(Boolean);

  el.innerHTML = items.map(p => `
    <div class="border border-charcoal/10 bg-white p-4 flex flex-col">
      <h4 class="font-serif text-charcoal text-lg font-light leading-tight mb-2">${esc(p.name)}</h4>
      <div class="mt-auto flex items-center justify-between pt-2">
        <span class="font-serif text-charcoal text-lg">${fmt(p.price)}</span>
        <button onclick="addGtAddon('${escJs(p.name)}', ${p.price}, '${escJs(p.badge || '')}')"
          class="text-[10px] tracking-[.1em] uppercase bg-gold text-charcoal px-3 py-2 hover:bg-charcoal hover:text-cream transition-all font-medium">
          Add to Cart
        </button>
      </div>
    </div>`).join('');
}

function addGtAddon(name, price, badge) {
  addItem(name, price, badge || '', '', false, [], []);
}

async function loadGtData() {
  const errBox = document.getElementById('gt-load-error');
  try {
    [gtCategories, gtProducts] = await Promise.all([getCategories(), getProducts()]);
    renderGtAddons();
  } catch (e) {
    console.error('Could not load Grand Table data:', e);
    if (errBox) errBox.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderGtFish();
  renderGtGuests();
  loadGtData();
});
