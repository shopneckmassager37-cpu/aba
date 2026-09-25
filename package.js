// ══════════════════════════════════════════════════════════════════════
//  CHEFALEH SHABBAT/CHAG DINNER — package configuration
//
//  Everything that can change (price, upgrade charges, which items are
//  included) lives in this one object. Edit the numbers here — nothing
//  else on the page needs to change.
//
//  Eligible salads are NOT listed here — they're pulled live from the
//  "Salads" category in the menu (the same one managed in the admin
//  panel's Products tab), so adding, removing or repricing a salad there
//  updates this page automatically. The soup and protein add-ons below
//  are looked up the same way, by name, from the Soups and Meat
//  categories.
// ══════════════════════════════════════════════════════════════════════
const PACKAGE = {
  name: 'Chefaleh Shabbat/Chag Dinner',
  pricePerPerson: 125,
  minGuests: 4,
  maxGuests: 30,

  saladCount: 4,
  saladsCategorySlug: 'salads',
  saladsExcludeNames: ['Chefaleh Simanim Platter'], // a whole platter, not an 8 oz portion

  includedFishOptions: ['Moroccan Tilapia', 'Asian Ginger-Sesame Tilapia'],
  fishUpgrades: [
    { name: 'Moroccan Salmon', price: 20 },
    { name: 'Pomegranate Glazed Salmon', price: 20 },
  ],

  includedMain: 'Honey-Ginger Roasted Chicken',

  mainsCategorySlug: 'meat',
  proteinAddOns: ['Israeli Shnitzel', 'Thai Tiger Beef with Broccoli & Cashews'],

  soupsCategorySlug: 'soups',
  soupAddOns: ['Chicken Soup'],

  additionalItemDiscount: 0.05, // 5% off anything added from "Complete Your Shabbat Table"
};

// ── State ──
let allCategories = [];
let allProducts = [];
let selectedSalads = new Set();
let selectedFish = PACKAGE.includedFishOptions[0];
let guestCount = PACKAGE.minGuests;
let extraProteins = []; // add-on proteins beyond the included main, full menu price, duplicates allowed
let extraSoups = [];    // add-on soups, full menu price, duplicates allowed

function fmt(n) { return '$' + n.toFixed(2); }

function categoryProducts(slug) {
  const cat = allCategories.find(c => c.slug === slug);
  if (!cat) return [];
  return allProducts.filter(p => p.category_id === cat.id && p.visible !== false);
}

function productPrice(slug, name) {
  const p = categoryProducts(slug).find(x => x.name === name);
  return p ? p.price : 0;
}

function extrasTotal() {
  return extraProteins.reduce((s, n) => s + productPrice(PACKAGE.mainsCategorySlug, n), 0)
       + extraSoups.reduce((s, n) => s + productPrice(PACKAGE.soupsCategorySlug, n), 0);
}

// ── Pricing ──
function selectedFishUpgrade() {
  return PACKAGE.fishUpgrades.find(f => f.name === selectedFish);
}

function upgradeTotal() {
  const u = selectedFishUpgrade();
  return u ? u.price : 0;
}

function packageTotal() {
  return PACKAGE.pricePerPerson * guestCount + upgradeTotal();
}

// ── Guest count ──
function renderGuests() {
  const el = document.getElementById('guest-count');
  if (el) el.textContent = guestCount;
  const serves = document.getElementById('pkg-serves');
  if (serves) serves.textContent = `Serves ${guestCount}`;
  const minus = document.getElementById('guest-minus');
  if (minus) minus.disabled = guestCount <= PACKAGE.minGuests;
  const plus = document.getElementById('guest-plus');
  if (plus) plus.disabled = guestCount >= PACKAGE.maxGuests;
}

function incrementGuests() {
  if (guestCount < PACKAGE.maxGuests) guestCount++;
  renderAll();
}
function decrementGuests() {
  if (guestCount > PACKAGE.minGuests) guestCount--;
  renderAll();
}

// ── Rendering ──
function renderSalads() {
  const el = document.getElementById('salad-picks');
  if (!el) return;
  const items = categoryProducts(PACKAGE.saladsCategorySlug)
    .filter(p => !PACKAGE.saladsExcludeNames.includes(p.name));

  el.innerHTML = items.map(p => {
    const active = selectedSalads.has(p.name);
    const atMax = selectedSalads.size >= PACKAGE.saladCount && !active;
    return `
      <div class="pick pick-mini text-center${atMax ? ' opacity-35 pointer-events-none' : ''}${active ? ' active' : ''}"
        onclick="toggleSalad('${escJs(p.name)}')">
        <div class="pick-label" style="font-size:1.05rem">${esc(p.name)}</div>
        <div class="pick-suf">8 oz portion</div>
      </div>`;
  }).join('');

  const count = document.getElementById('salad-count');
  if (count) count.textContent = `${selectedSalads.size} / ${PACKAGE.saladCount} chosen`;
}

function renderFish() {
  const el = document.getElementById('fish-picks');
  if (!el) return;
  const options = [
    ...PACKAGE.includedFishOptions.map(name => ({ name, label: name, sub: 'Included' })),
    ...PACKAGE.fishUpgrades.map(u => ({ name: u.name, label: u.name, sub: `Upgrade +${fmt(u.price)}` })),
  ];
  el.innerHTML = options.map(o => `
    <div class="pick pick-mini text-center${selectedFish === o.name ? ' active' : ''}" onclick="selectFish('${escJs(o.name)}')">
      <div class="pick-label" style="font-size:1.05rem">${esc(o.label)}</div>
      <div class="pick-suf">${esc(o.sub)}</div>
    </div>`).join('');
}

// Optional soup add-on — full menu price, added as its own cart line.
function renderSoupAddOn() {
  const picks = document.getElementById('soup-addon-picks');
  const list = document.getElementById('soup-addon-list');
  if (!picks || !list) return;

  picks.innerHTML = PACKAGE.soupAddOns.map(name => `
    <button type="button" onclick="addSoupAddOn('${escJs(name)}')"
      class="text-xs tracking-wide border border-charcoal/15 text-charcoal/65 px-3 py-1.5 rounded-full hover:border-gold hover:text-charcoal transition-colors">
      + ${esc(name)} <span class="text-charcoal/35">+${fmt(productPrice(PACKAGE.soupsCategorySlug, name))}</span>
    </button>`).join('');

  list.innerHTML = extraSoups.map((name, i) => `
    <div class="flex items-center justify-between text-xs text-charcoal/60 font-light py-1">
      <span>${esc(name)}</span>
      <span class="flex items-center gap-2">
        ${fmt(productPrice(PACKAGE.soupsCategorySlug, name))}
        <button type="button" onclick="removeSoupAddOn(${i})" aria-label="Remove soup" class="text-charcoal/40 hover:text-charcoal">&times;</button>
      </span>
    </div>`).join('');
}

function addSoupAddOn(name) { extraSoups.push(name); renderAll(); }
function removeSoupAddOn(i) { extraSoups.splice(i, 1); renderAll(); }

// Optional additional proteins — full menu price, added as their own cart line.
function renderProteinAddOns() {
  const picks = document.getElementById('protein-addon-picks');
  const list = document.getElementById('protein-addon-list');
  if (!picks || !list) return;

  picks.innerHTML = PACKAGE.proteinAddOns.map(name => `
    <button type="button" onclick="addProteinAddOn('${escJs(name)}')"
      class="text-xs tracking-wide border border-charcoal/15 text-charcoal/65 px-3 py-1.5 rounded-full hover:border-gold hover:text-charcoal transition-colors">
      + ${esc(name)} <span class="text-charcoal/35">+${fmt(productPrice(PACKAGE.mainsCategorySlug, name))}</span>
    </button>`).join('');

  list.innerHTML = extraProteins.map((name, i) => `
    <div class="flex items-center justify-between text-xs text-charcoal/60 font-light py-1">
      <span>${esc(name)}</span>
      <span class="flex items-center gap-2">
        ${fmt(productPrice(PACKAGE.mainsCategorySlug, name))}
        <button type="button" onclick="removeProteinAddOn(${i})" aria-label="Remove protein" class="text-charcoal/40 hover:text-charcoal">&times;</button>
      </span>
    </div>`).join('');
}

function addProteinAddOn(name) { extraProteins.push(name); renderAll(); }
function removeProteinAddOn(i) { extraProteins.splice(i, 1); renderAll(); }

function renderSummary() {
  const el = document.getElementById('pkg-total');
  if (el) el.textContent = fmt(packageTotal());

  const lines = [];
  const fishUpgrade = selectedFishUpgrade();
  if (fishUpgrade) lines.push({ label: `${fishUpgrade.name} upgrade`, amt: fishUpgrade.price });

  const breakdown = document.getElementById('pkg-breakdown');
  if (breakdown) {
    breakdown.innerHTML =
      `<div class="sum-row"><span class="sum-label">${guestCount} guests &times; ${fmt(PACKAGE.pricePerPerson)}</span><span class="sum-val">${fmt(PACKAGE.pricePerPerson * guestCount)}</span></div>` +
      lines.map(l => `<div class="sum-row"><span class="sum-label">${esc(l.label)}</span><span class="sum-val">+${fmt(l.amt)}</span></div>`).join('');
  }

  const extrasEl = document.getElementById('pkg-extras-summary');
  if (extrasEl) {
    const hasExtras = extraProteins.length || extraSoups.length;
    if (hasExtras) {
      const rows = [
        ...extraProteins.map(n => `<div class="sum-row"><span class="sum-label">Add-on: ${esc(n)}</span><span class="sum-val">${fmt(productPrice(PACKAGE.mainsCategorySlug, n))}</span></div>`),
        ...extraSoups.map(n => `<div class="sum-row"><span class="sum-label">Add-on: ${esc(n)}</span><span class="sum-val">${fmt(productPrice(PACKAGE.soupsCategorySlug, n))}</span></div>`),
      ];
      extrasEl.innerHTML =
        `<p class="text-[10px] tracking-[.15em] uppercase text-charcoal/40 mb-1 mt-3">Add-ons · added at menu price</p>` +
        rows.join('') +
        `<div class="flex justify-between items-baseline pt-2 mt-1 border-t border-charcoal/10">
           <span class="text-xs text-charcoal/50 font-light">Order total (package + add-ons)</span>
           <span class="text-sm text-charcoal font-medium">${fmt(packageTotal() + extrasTotal())}</span>
         </div>`;
      extrasEl.classList.remove('hidden');
    } else {
      extrasEl.innerHTML = '';
      extrasEl.classList.add('hidden');
    }
  }
}

function renderAll() {
  renderGuests();
  renderSalads();
  renderFish();
  renderSoupAddOn();
  renderProteinAddOns();
  renderSummary();
}

// ── Selection handlers ──
function toggleSalad(name) {
  if (selectedSalads.has(name)) selectedSalads.delete(name);
  else if (selectedSalads.size < PACKAGE.saladCount) selectedSalads.add(name);
  renderAll();
}

function selectFish(name) { selectedFish = name; renderAll(); }

// ── Add package to cart as a single line item ──
function addPackageToCart() {
  const errEl = document.getElementById('pkg-error');
  if (selectedSalads.size !== PACKAGE.saladCount) {
    errEl.textContent = `Please choose exactly ${PACKAGE.saladCount} salads (${selectedSalads.size} chosen).`;
    errEl.classList.remove('hidden');
    document.getElementById('salad-picks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  errEl.classList.add('hidden');

  const fishUpgrade = selectedFishUpgrade();
  const lines = [];
  lines.push(`Guests: ${guestCount}`);
  lines.push(`Salads: ${Array.from(selectedSalads).join(', ')}`);
  lines.push(`Fish: ${fishUpgrade ? selectedFish + ' (+' + fmt(fishUpgrade.price) + ')' : selectedFish + ' (included)'}`);
  lines.push(`Main: ${PACKAGE.includedMain} (included)`);

  addItem(PACKAGE.name, packageTotal(), `Serves ${guestCount}`, lines.join('\n'), false, [], []);

  extraProteins.forEach(name => {
    addItem(name, productPrice(PACKAGE.mainsCategorySlug, name), 'Add-on · Shabbat/Chag Dinner', '', false, [], []);
  });
  extraSoups.forEach(name => {
    addItem(name, productPrice(PACKAGE.soupsCategorySlug, name), 'Add-on · Shabbat/Chag Dinner', '', false, [], []);
  });

  // Reset selections for a second package, if they want one.
  selectedSalads = new Set();
  selectedFish = PACKAGE.includedFishOptions[0];
  guestCount = PACKAGE.minGuests;
  extraProteins = [];
  extraSoups = [];
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── "Complete Your Shabbat Table" — any menu item, 5% off ──
function renderExtras() {
  const el = document.getElementById('extras-grid');
  if (!el) return;
  const bySlug = {};
  allCategories.forEach(c => { bySlug[c.id] = c.name; });

  const items = allProducts
    .filter(p => p.visible !== false)
    .slice()
    .sort((a, b) => (bySlug[a.category_id] || '').localeCompare(bySlug[b.category_id] || '') || a.order - b.order);

  el.innerHTML = items.map(p => {
    const discounted = p.price * (1 - PACKAGE.additionalItemDiscount);
    return `
      <div class="border border-charcoal/10 bg-white p-4 flex flex-col">
        <p class="text-[10px] tracking-[.15em] uppercase text-gold font-light mb-1">${esc(bySlug[p.category_id] || '')}</p>
        <h4 class="font-serif text-charcoal text-lg font-light leading-tight mb-2">${esc(p.name)}</h4>
        <div class="mt-auto flex items-center justify-between pt-2">
          <div>
            <span class="text-charcoal/30 text-xs line-through mr-1">${fmt(p.price)}</span>
            <span class="font-serif text-charcoal text-lg">${fmt(discounted)}</span>
          </div>
          <button onclick="addExtra('${escJs(p.name)}', ${p.price}, '${escJs(p.badge || '')}')"
            class="text-[10px] tracking-[.1em] uppercase bg-gold text-charcoal px-3 py-2 hover:bg-charcoal hover:text-cream transition-all font-medium">
            Add · 5% off
          </button>
        </div>
      </div>`;
  }).join('');
}

function addExtra(name, price, badge) {
  const discounted = price * (1 - PACKAGE.additionalItemDiscount);
  const badgeText = (badge ? badge + ' · ' : '') + 'Shabbat/Chag Package −5%';
  addItem(name, discounted, badgeText, '', false, [], []);
}

// ── Utilities ──
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escJs(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function loadPackageData() {
  const errBox = document.getElementById('pkg-load-error');
  try {
    [allCategories, allProducts] = await Promise.all([getCategories(), getProducts()]);
    renderAll();
    renderExtras();
  } catch (e) {
    console.error('Could not load package data:', e);
    if (errBox) errBox.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pkg-name').textContent = PACKAGE.name;
  loadPackageData();
});
