// ══════════════════════════════════════════════════════════════════════
//  ROSH HASHANAH DINNER — temporary holiday menu
//
//  Fixed menu, $125/person, 6-person minimum. Unlike the Shabbat Dinner
//  package this is NOT added to the website cart or checkout — it's
//  ordered directly through WhatsApp, prefilled with the guest count,
//  fish choice and total so the customer doesn't have to retype it.
//
//  The optional add-ons below (Simanim platter, kugel, honey cake, babka)
//  reuse the real menu products and their live (post-increase) prices,
//  and DO go through the normal cart/checkout like any à la carte item.
// ══════════════════════════════════════════════════════════════════════
const RH_PRICE_PER_PERSON = 125;
const RH_MIN_GUESTS = 6;
const RH_MAX_GUESTS = 30;
const RH_FISH_OPTIONS = ['Pomegranate Glazed Salmon', 'Moroccan Salmon'];
const RH_ADDON_NAMES = ['Chefaleh Simanim Platter', 'Classic Potato Kugel', 'Classic Honey Cake', 'Chocolate Babka'];
const RH_WHATSAPP_NUMBER = '13053076800';

let rhGuestCount = RH_MIN_GUESTS;
let rhSelectedFish = RH_FISH_OPTIONS[1];
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
  return RH_PRICE_PER_PERSON * rhGuestCount;
}

function updateWhatsAppLink() {
  const btn = document.getElementById('rh-whatsapp-btn');
  if (!btn) return;
  const msg = `Hi! I'd like to order the Rosh Hashanah Dinner for ${rhGuestCount} guests (${fmt(rhTotal())} total), with ${rhSelectedFish} as the fish, for delivery Friday, September 11.`;
  btn.href = `https://wa.me/${RH_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function renderRhGuests() {
  const count = document.getElementById('rh-guest-count');
  if (count) count.textContent = rhGuestCount;
  const minus = document.getElementById('rh-guest-minus');
  if (minus) minus.disabled = rhGuestCount <= RH_MIN_GUESTS;
  const plus = document.getElementById('rh-guest-plus');
  if (plus) plus.disabled = rhGuestCount >= RH_MAX_GUESTS;
  const grand = document.getElementById('rh-grand-total');
  if (grand) grand.textContent = fmt(rhTotal());
  updateWhatsAppLink();
}

function rhIncrementGuests() {
  if (rhGuestCount < RH_MAX_GUESTS) rhGuestCount++;
  renderRhGuests();
}
function rhDecrementGuests() {
  if (rhGuestCount > RH_MIN_GUESTS) rhGuestCount--;
  renderRhGuests();
}

function renderRhFish() {
  const el = document.getElementById('rh-fish-picks');
  if (el) {
    el.innerHTML = RH_FISH_OPTIONS.map(name => `
      <div class="pick pick-mini text-center${rhSelectedFish === name ? ' active' : ''}" onclick="selectRhFish('${escJs(name)}')">
        <div class="pick-label" style="font-size:1.05rem">${esc(name)}</div>
      </div>`).join('');
  }
}

function selectRhFish(name) {
  rhSelectedFish = name;
  renderRhFish();
  updateWhatsAppLink();
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
    console.error('Could not load Rosh Hashanah add-on data:', e);
    if (errBox) errBox.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderRhFish();
  renderRhGuests();
  loadRhData();
});
