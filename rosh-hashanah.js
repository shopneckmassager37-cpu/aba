// ══════════════════════════════════════════════════════════════════════
//  ROSH HASHANAH DINNER — temporary holiday package
//
//  Ordered exactly like the Shabbat Dinner package (package.js): a
//  fixed-price-per-person package added to the website cart and paid
//  for through the normal checkout. Unlike the Shabbat package the menu
//  itself is fixed — the only choice is which salmon to include.
//
//  The optional add-ons below reuse the real menu products and their
//  live (post-increase) prices, and go through the normal cart/checkout
//  the same way.
// ══════════════════════════════════════════════════════════════════════
const RH_PACKAGE = {
  name: 'Chefaleh Rosh Hashanah Dinner',
  pricePerPerson: 125,
  minGuests: 6,
  maxGuests: 30,
  fishOptions: ['Pomegranate Glazed Salmon', 'Moroccan Salmon'],
};
const RH_ADDON_NAMES = ['Chefaleh Simanim Platter', 'Classic Potato Kugel', 'Classic Honey Cake', 'Chocolate Babka'];

let rhGuestCount = RH_PACKAGE.minGuests;
let rhSelectedFish = RH_PACKAGE.fishOptions[1];
let rhCategories = [];
let rhProducts = [];

function fmt(n) { return '$' + n.toFixed(2); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escJs(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function rhTotal() {
  return RH_PACKAGE.pricePerPerson * rhGuestCount;
}

function renderRhGuests() {
  const count = document.getElementById('rh-guest-count');
  if (count) count.textContent = rhGuestCount;
  const minus = document.getElementById('rh-guest-minus');
  if (minus) minus.disabled = rhGuestCount <= RH_PACKAGE.minGuests;
  const plus = document.getElementById('rh-guest-plus');
  if (plus) plus.disabled = rhGuestCount >= RH_PACKAGE.maxGuests;
  renderRhSummary();
}

function rhIncrementGuests() {
  if (rhGuestCount < RH_PACKAGE.maxGuests) rhGuestCount++;
  renderRhGuests();
}
function rhDecrementGuests() {
  if (rhGuestCount > RH_PACKAGE.minGuests) rhGuestCount--;
  renderRhGuests();
}

function renderRhFish() {
  const el = document.getElementById('rh-fish-picks');
  if (el) {
    el.innerHTML = RH_PACKAGE.fishOptions.map(name => `
      <div class="pick pick-mini text-center${rhSelectedFish === name ? ' active' : ''}" onclick="selectRhFish('${escJs(name)}')">
        <div class="pick-label" style="font-size:1.05rem">${esc(name)}</div>
      </div>`).join('');
  }
}

function selectRhFish(name) {
  rhSelectedFish = name;
  renderRhFish();
}

function renderRhSummary() {
  const breakdown = document.getElementById('rh-breakdown');
  if (breakdown) {
    breakdown.innerHTML = `<div class="sum-row"><span class="sum-label">${rhGuestCount} guests &times; ${fmt(RH_PACKAGE.pricePerPerson)}</span><span class="sum-val">${fmt(rhTotal())}</span></div>`;
  }
  const total = document.getElementById('rh-grand-total');
  if (total) total.textContent = fmt(rhTotal());
}

// ── Add the package to cart as a single line item, same as the Shabbat Dinner package ──
function addRhPackageToCart() {
  const lines = [`Guests: ${rhGuestCount}`, `Fish: ${rhSelectedFish}`];
  addItem(RH_PACKAGE.name, rhTotal(), `Serves ${rhGuestCount}`, lines.join('\n'), false, [], []);

  rhGuestCount = RH_PACKAGE.minGuests;
  rhSelectedFish = RH_PACKAGE.fishOptions[1];
  renderRhFish();
  renderRhGuests();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Optional add-ons — real menu products, real cart, current à la carte price ──
function renderAddons() {
  const el = document.getElementById('rh-addons-grid');
  if (!el) return;
  const items = RH_ADDON_NAMES
    .map(name => rhProducts.find(p => p.name === name && p.visible !== false))
    .filter(Boolean);

  el.innerHTML = items.map(p => `
    <div class="border border-charcoal/10 bg-white p-4 flex flex-col">
      <h4 class="font-serif text-charcoal text-lg font-light leading-tight mb-2">${esc(p.name)}</h4>
      <div class="mt-auto flex items-center justify-between pt-2">
        <span class="font-serif text-charcoal text-lg">${fmt(p.price)}</span>
        <button onclick="addRhAddon('${escJs(p.name)}', ${p.price}, '${escJs(p.badge || '')}')"
          class="text-[10px] tracking-[.1em] uppercase bg-gold text-charcoal px-3 py-2 hover:bg-charcoal hover:text-cream transition-all font-medium">
          Add to Cart
        </button>
      </div>
    </div>`).join('');
}

function addRhAddon(name, price, badge) {
  addItem(name, price, badge || '', '', false, [], []);
}

async function loadRhData() {
  const errBox = document.getElementById('rh-load-error');
  try {
    [rhCategories, rhProducts] = await Promise.all([getCategories(), getProducts()]);
    renderAddons();
  } catch (e) {
    console.error('Could not load Rosh Hashanah data:', e);
    if (errBox) errBox.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // RH_ORDERS_CLOSED comes from cart.js, loaded before this file.
  if (RH_ORDERS_CLOSED) {
    document.getElementById('rh-order-card')?.classList.add('hidden');
    document.getElementById('rh-closed-card')?.classList.remove('hidden');
    document.getElementById('rh-addons-section')?.classList.add('hidden');
    return;
  }
  renderRhFish();
  renderRhGuests();
  loadRhData();
});
