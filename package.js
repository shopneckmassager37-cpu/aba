// ══════════════════════════════════════════════════════════════════════
//  CHEFALEH SHABBAT DINNER — package configuration
//
//  Everything that can change (price, upgrade charges, which items are
//  included) lives in this one object. Edit the numbers here — nothing
//  else on the page needs to change.
//
//  Eligible salads and sides are NOT listed here — they're pulled live
//  from the "Salads" and "Sides" categories in the menu (the same ones
//  managed in the admin panel's Products tab), so adding, removing or
//  repricing a salad/side there updates this page automatically.
// ══════════════════════════════════════════════════════════════════════
const PACKAGE = {
  name: 'Chefaleh Shabbat Dinner',
  serves: 'Serves 4–6',
  basePrice: 250,

  saladCount: 4,
  saladsCategorySlug: 'salads',
  saladsExcludeNames: ['Chefaleh Simanim Platter'], // a whole platter, not an 8 oz portion

  sideCount: 2,
  sidesCategorySlug: 'sides',
  sidePremiumThreshold: 40,  // sides priced above this (menu price) are a premium upgrade
  sidePremiumSurcharge: 8,   // flat charge added per premium side chosen

  includedFish: 'Moroccan Tilapia',
  fishUpgrades: [
    { name: 'Moroccan Salmon', price: 20 },
    { name: 'Pomegranate Glazed Salmon', price: 20 },
  ],

  includedMain: 'Whole Roasted Chicken',
  mainUpgrades: [
    { name: 'Israeli Schnitzel', price: 45 },
    { name: 'Israeli Pargit', price: 55 },
    { name: 'Prime Rib / Ribeye Roast', price: 70 },
    { name: 'Chefaleh Brisket', price: 75 },
    { name: 'Pomegranate Braised Short Ribs', price: 110 },
  ],
  mainsCategorySlug: 'meat', // for extra (non-included) main courses, below

  additionalItemDiscount: 0.05, // 5% off anything added from "Complete Your Shabbat Table"
};

// ── State ──
let allCategories = [];
let allProducts = [];
let selectedSalads = new Set();
let selectedSides = new Set();
let selectedFish = 'included';   // 'included' | fish upgrade name
let selectedMain = 'included';   // 'included' | main upgrade name
let extraSalads = [];            // extra salads beyond the included 4, full menu price, duplicates allowed
let extraMains = [];             // extra main courses beyond the included 1, full menu price, duplicates allowed

function fmt(n) { return '$' + n.toFixed(2); }

function categoryProducts(slug) {
  const cat = allCategories.find(c => c.slug === slug);
  if (!cat) return [];
  return allProducts.filter(p => p.category_id === cat.id && p.visible !== false);
}

function isPremiumSide(product) {
  return product.price > PACKAGE.sidePremiumThreshold;
}

function productPrice(slug, name) {
  const p = categoryProducts(slug).find(x => x.name === name);
  return p ? p.price : 0;
}

function extrasTotal() {
  return extraSalads.reduce((s, n) => s + productPrice(PACKAGE.saladsCategorySlug, n), 0)
       + extraMains.reduce((s, n) => s + productPrice(PACKAGE.mainsCategorySlug, n), 0);
}

// ── Pricing ──
function upgradeTotal() {
  let total = 0;
  if (selectedFish !== 'included') {
    const u = PACKAGE.fishUpgrades.find(f => f.name === selectedFish);
    if (u) total += u.price;
  }
  if (selectedMain !== 'included') {
    const u = PACKAGE.mainUpgrades.find(m => m.name === selectedMain);
    if (u) total += u.price;
  }
  categoryProducts(PACKAGE.sidesCategorySlug).forEach(p => {
    if (selectedSides.has(p.name) && isPremiumSide(p)) total += PACKAGE.sidePremiumSurcharge;
  });
  return total;
}

function packageTotal() {
  return PACKAGE.basePrice + upgradeTotal();
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

// Extra salads beyond the included 4 — full menu price, added as their own cart line.
function renderSaladExtras() {
  const picks = document.getElementById('salad-extra-picks');
  const list = document.getElementById('salad-extra-list');
  if (!picks || !list) return;
  const items = categoryProducts(PACKAGE.saladsCategorySlug)
    .filter(p => !PACKAGE.saladsExcludeNames.includes(p.name));

  picks.innerHTML = items.map(p => `
    <button type="button" onclick="addExtraSalad('${escJs(p.name)}')"
      class="text-xs tracking-wide border border-charcoal/15 text-charcoal/65 px-3 py-1.5 rounded-full hover:border-gold hover:text-charcoal transition-colors">
      + ${esc(p.name)} <span class="text-charcoal/35">+${fmt(p.price)}</span>
    </button>`).join('');

  list.innerHTML = extraSalads.map((name, i) => `
    <div class="flex items-center justify-between text-xs text-charcoal/60 font-light py-1">
      <span>${esc(name)}</span>
      <span class="flex items-center gap-2">
        ${fmt(productPrice(PACKAGE.saladsCategorySlug, name))}
        <button type="button" onclick="removeExtraSalad(${i})" aria-label="Remove extra salad" class="text-charcoal/40 hover:text-charcoal">&times;</button>
      </span>
    </div>`).join('');
}

function addExtraSalad(name) { extraSalads.push(name); renderAll(); }
function removeExtraSalad(i) { extraSalads.splice(i, 1); renderAll(); }

function renderSides() {
  const el = document.getElementById('side-picks');
  if (!el) return;
  const items = categoryProducts(PACKAGE.sidesCategorySlug);

  el.innerHTML = items.map(p => {
    const active = selectedSides.has(p.name);
    const atMax = selectedSides.size >= PACKAGE.sideCount && !active;
    const premium = isPremiumSide(p);
    return `
      <div class="pick pick-mini text-center${atMax ? ' opacity-35 pointer-events-none' : ''}${active ? ' active' : ''}"
        onclick="toggleSide('${escJs(p.name)}')">
        <div class="pick-label" style="font-size:1.05rem">${esc(p.name)}</div>
        <div class="pick-suf">${premium ? `Premium upgrade +${fmt(PACKAGE.sidePremiumSurcharge)}` : 'Standard side'}</div>
      </div>`;
  }).join('');

  const count = document.getElementById('side-count');
  if (count) count.textContent = `${selectedSides.size} / ${PACKAGE.sideCount} chosen`;
}

function renderFish() {
  const el = document.getElementById('fish-picks');
  if (!el) return;
  const options = [
    { name: 'included', label: PACKAGE.includedFish, sub: 'Included', price: 0 },
    ...PACKAGE.fishUpgrades.map(u => ({ name: u.name, label: u.name, sub: `Upgrade +${fmt(u.price)}`, price: u.price })),
  ];
  el.innerHTML = options.map(o => `
    <div class="pick pick-mini text-center${selectedFish === o.name ? ' active' : ''}" onclick="selectFish('${escJs(o.name)}')">
      <div class="pick-label" style="font-size:1.05rem">${esc(o.label)}</div>
      <div class="pick-suf">${esc(o.sub)}</div>
    </div>`).join('');
}

function renderMain() {
  const el = document.getElementById('main-picks');
  if (!el) return;
  const options = [
    { name: 'included', label: PACKAGE.includedMain, sub: 'Included', price: 0 },
    ...PACKAGE.mainUpgrades.map(u => ({ name: u.name, label: u.name, sub: `Upgrade +${fmt(u.price)}`, price: u.price })),
  ];
  el.innerHTML = options.map(o => `
    <div class="pick pick-mini text-center${selectedMain === o.name ? ' active' : ''}" onclick="selectMain('${escJs(o.name)}')">
      <div class="pick-label" style="font-size:1.05rem">${esc(o.label)}</div>
      <div class="pick-suf">${esc(o.sub)}</div>
    </div>`).join('');
}

// Extra main courses beyond the included one — full menu price, added as their own cart line.
function renderMainExtras() {
  const picks = document.getElementById('main-extra-picks');
  const list = document.getElementById('main-extra-list');
  if (!picks || !list) return;
  const items = categoryProducts(PACKAGE.mainsCategorySlug);

  picks.innerHTML = items.map(p => `
    <button type="button" onclick="addExtraMain('${escJs(p.name)}')"
      class="text-xs tracking-wide border border-charcoal/15 text-charcoal/65 px-3 py-1.5 rounded-full hover:border-gold hover:text-charcoal transition-colors">
      + ${esc(p.name)} <span class="text-charcoal/35">+${fmt(p.price)}</span>
    </button>`).join('');

  list.innerHTML = extraMains.map((name, i) => `
    <div class="flex items-center justify-between text-xs text-charcoal/60 font-light py-1">
      <span>${esc(name)}</span>
      <span class="flex items-center gap-2">
        ${fmt(productPrice(PACKAGE.mainsCategorySlug, name))}
        <button type="button" onclick="removeExtraMain(${i})" aria-label="Remove extra main" class="text-charcoal/40 hover:text-charcoal">&times;</button>
      </span>
    </div>`).join('');
}

function addExtraMain(name) { extraMains.push(name); renderAll(); }
function removeExtraMain(i) { extraMains.splice(i, 1); renderAll(); }

function renderSummary() {
  const el = document.getElementById('pkg-total');
  if (el) el.textContent = fmt(packageTotal());

  const lines = [];
  if (selectedFish !== 'included') {
    const u = PACKAGE.fishUpgrades.find(f => f.name === selectedFish);
    if (u) lines.push({ label: `${u.name} upgrade`, amt: u.price });
  }
  if (selectedMain !== 'included') {
    const u = PACKAGE.mainUpgrades.find(m => m.name === selectedMain);
    if (u) lines.push({ label: `${u.name} upgrade`, amt: u.price });
  }
  categoryProducts(PACKAGE.sidesCategorySlug).forEach(p => {
    if (selectedSides.has(p.name) && isPremiumSide(p)) lines.push({ label: `${p.name} (premium side)`, amt: PACKAGE.sidePremiumSurcharge });
  });

  const breakdown = document.getElementById('pkg-breakdown');
  if (breakdown) {
    breakdown.innerHTML =
      `<div class="sum-row"><span class="sum-label">Base package</span><span class="sum-val">${fmt(PACKAGE.basePrice)}</span></div>` +
      lines.map(l => `<div class="sum-row"><span class="sum-label">${esc(l.label)}</span><span class="sum-val">+${fmt(l.amt)}</span></div>`).join('');
  }

  const extrasEl = document.getElementById('pkg-extras-summary');
  if (extrasEl) {
    const hasExtras = extraSalads.length || extraMains.length;
    if (hasExtras) {
      const rows = [
        ...extraSalads.map(n => `<div class="sum-row"><span class="sum-label">Extra: ${esc(n)}</span><span class="sum-val">${fmt(productPrice(PACKAGE.saladsCategorySlug, n))}</span></div>`),
        ...extraMains.map(n => `<div class="sum-row"><span class="sum-label">Extra: ${esc(n)}</span><span class="sum-val">${fmt(productPrice(PACKAGE.mainsCategorySlug, n))}</span></div>`),
      ];
      extrasEl.innerHTML =
        `<p class="text-[10px] tracking-[.15em] uppercase text-charcoal/40 mb-1 mt-3">Extra items · added at menu price</p>` +
        rows.join('') +
        `<div class="flex justify-between items-baseline pt-2 mt-1 border-t border-charcoal/10">
           <span class="text-xs text-charcoal/50 font-light">Order total (package + extras)</span>
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
  renderSalads();
  renderSaladExtras();
  renderSides();
  renderFish();
  renderMain();
  renderMainExtras();
  renderSummary();
}

// ── Selection handlers ──
function toggleSalad(name) {
  if (selectedSalads.has(name)) selectedSalads.delete(name);
  else if (selectedSalads.size < PACKAGE.saladCount) selectedSalads.add(name);
  renderAll();
}

function toggleSide(name) {
  if (selectedSides.has(name)) selectedSides.delete(name);
  else if (selectedSides.size < PACKAGE.sideCount) selectedSides.add(name);
  renderAll();
}

function selectFish(name) { selectedFish = name; renderAll(); }
function selectMain(name) { selectedMain = name; renderAll(); }

// ── Add package to cart as a single line item ──
function addPackageToCart() {
  const errEl = document.getElementById('pkg-error');
  if (selectedSalads.size !== PACKAGE.saladCount) {
    errEl.textContent = `Please choose exactly ${PACKAGE.saladCount} salads (${selectedSalads.size} chosen).`;
    errEl.classList.remove('hidden');
    document.getElementById('salad-picks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (selectedSides.size !== PACKAGE.sideCount) {
    errEl.textContent = `Please choose exactly ${PACKAGE.sideCount} sides (${selectedSides.size} chosen).`;
    errEl.classList.remove('hidden');
    document.getElementById('side-picks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  errEl.classList.add('hidden');

  const lines = [];
  lines.push(`Salads: ${Array.from(selectedSalads).join(', ')}`);
  const sideNames = Array.from(selectedSides).map(name => {
    const p = categoryProducts(PACKAGE.sidesCategorySlug).find(x => x.name === name);
    return p && isPremiumSide(p) ? `${name} (+${fmt(PACKAGE.sidePremiumSurcharge)})` : name;
  });
  lines.push(`Sides: ${sideNames.join(', ')}`);
  lines.push(`Fish: ${selectedFish === 'included' ? PACKAGE.includedFish : selectedFish + ' (+' + fmt(PACKAGE.fishUpgrades.find(f => f.name === selectedFish).price) + ')'}`);
  lines.push(`Main: ${selectedMain === 'included' ? PACKAGE.includedMain : selectedMain + ' (+' + fmt(PACKAGE.mainUpgrades.find(m => m.name === selectedMain).price) + ')'}`);

  addItem(PACKAGE.name, packageTotal(), PACKAGE.serves, lines.join('\n'), false, [], []);

  extraSalads.forEach(name => {
    addItem(name, productPrice(PACKAGE.saladsCategorySlug, name), 'Extra · Shabbat Dinner', '', false, [], []);
  });
  extraMains.forEach(name => {
    addItem(name, productPrice(PACKAGE.mainsCategorySlug, name), 'Extra · Shabbat Dinner', '', false, [], []);
  });

  // Reset selections for a second package, if they want one.
  selectedSalads = new Set();
  selectedSides = new Set();
  selectedFish = 'included';
  selectedMain = 'included';
  extraSalads = [];
  extraMains = [];
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
  const badgeText = (badge ? badge + ' · ' : '') + 'Shabbat Package −5%';
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
  document.getElementById('pkg-serves').textContent = PACKAGE.serves;
  document.getElementById('pkg-base-price').textContent = fmt(PACKAGE.basePrice);
  loadPackageData();
});
