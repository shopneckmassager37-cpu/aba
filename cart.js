const CART_KEY = 'chefaleh_cart';
const TAX_RATE = 0.07;

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  refreshCartUI();
}

function addItem(name, price, badge, instructions) {
  const cart = getCart();
  const found = cart.find(i => i.name === name);
  if (found) { 
    found.qty++; 
    if (instructions !== undefined) found.instructions = instructions; 
  } else { 
    cart.push({ name, price: parseFloat(price), badge, qty: 1, instructions: instructions || '' }); 
  }
  saveCart(cart);
  if (typeof openDrawer === 'function') openDrawer();
}

function setQty(name, qty) {
  let cart = getCart();
  qty = parseInt(qty);
  if (qty <= 0) cart = cart.filter(i => i.name !== name);
  else { const f = cart.find(i => i.name === name); if (f) f.qty = qty; }
  saveCart(cart);
}

function deck(name, delta, price, badge, instructions) {
  const cart = getCart();
  const found = cart.find(i => i.name === name);
  const newQty = found ? found.qty + delta : delta;
  if (newQty <= 0) {
    setQty(name, 0);
  } else if (found) {
    found.qty = newQty;
    if (instructions !== undefined) found.instructions = instructions;
    saveCart(cart);
  } else {
    addItem(name, price, badge, instructions || '');
  }
  if (typeof renderAll === 'function') renderAll();
}

function removeItem(name) {
  saveCart(getCart().filter(i => i.name !== name));
}

function getSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}

function getCount() {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  refreshCartUI();
}

function fmt(n) { return '$' + n.toFixed(2); }

/* ── UI helpers ── */
function refreshCartUI() {
  // nav badge
  document.querySelectorAll('.cart-count-badge').forEach(el => {
    const c = getCount();
    el.textContent = c;
    el.style.display = c > 0 ? 'flex' : 'none';
  });
  // drawer if exists
  if (typeof renderDrawer === 'function') renderDrawer();
}

// ── DRAWER ──
function openDrawer() {
  const d = document.getElementById('drawer');
  const o = document.getElementById('drawer-overlay');
  if (d) d.classList.add('open');
  if (o) o.classList.remove('hidden');
  renderDrawer();
}

function closeDrawer() {
  const d = document.getElementById('drawer');
  const o = document.getElementById('drawer-overlay');
  if (d) d.classList.remove('open');
  if (o) o.classList.add('hidden');
}

function renderDrawer() {
  const cart = getCart();
  const sub = getSubtotal();
  const tax = sub * TAX_RATE;
  const tot = sub + tax;
  const el = document.getElementById('drawer-items');
  if (!el) return;
  
  if (cart.length === 0) {
    el.innerHTML = '<p class="text-charcoal/40 text-sm font-light text-center py-8">Your cart is empty.</p>';
  } else {
    el.innerHTML = cart.map(i => `
      <div class="flex items-start gap-3 py-3 border-b border-charcoal/8">
        <div class="flex-1 min-w-0">
          <p class="text-sm text-charcoal font-light leading-snug">${i.name}</p>
          <p class="text-[11px] text-charcoal/40 font-light mt-0.5">${i.badge}</p>
          ${i.instructions ? `<p class="text-[10px] text-gold/70 font-light mt-0.5 italic">${i.instructions}</p>` : ''}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="deck('${i.name}',-1,${i.price},'${i.badge}')" class="w-6 h-6 border border-charcoal/15 text-charcoal hover:bg-charcoal hover:text-cream transition-all text-xs leading-none">−</button>
          <span class="text-xs font-light w-4 text-center">${i.qty}</span>
          <button onclick="deck('${i.name}',1,${i.price},'${i.badge}')"  class="w-6 h-6 border border-charcoal/15 text-charcoal hover:bg-gold hover:text-charcoal transition-all text-xs leading-none">+</button>
        </div>
        <span class="text-sm font-light text-charcoal w-14 text-right shrink-0">$${(i.price*i.qty).toFixed(2)}</span>
      </div>`).join('');
  }
  
  const d = (id,v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  d('d-sub', '$'+sub.toFixed(2));
  d('d-tax', '$'+tax.toFixed(2));
  d('d-tot', '$'+tot.toFixed(2));
}

function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const h1 = document.getElementById('ham1');
  const h2 = document.getElementById('ham2');
  const h3 = document.getElementById('ham3');
  if (!menu) return;
  const open = menu.classList.toggle('open');
  if (open) {
    if(h1) h1.style.transform = 'translateY(6.5px) rotate(45deg)';
    if(h2) h2.style.opacity = '0';
    if(h3) h3.style.transform = 'translateY(-6.5px) rotate(-45deg)';
  } else {
    if(h1) h1.style.transform = '';
    if(h2) h2.style.opacity = '';
    if(h3) h3.style.transform = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refreshCartUI();
  renderDrawer();
});
