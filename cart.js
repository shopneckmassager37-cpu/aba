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
  injectWhatsAppButton();
});

function injectWhatsAppButton() {
  if (document.getElementById('whatsapp-btn')) return;
  const btn = document.createElement('a');
  btn.id = 'whatsapp-btn';
  btn.href = 'https://wa.me/13053076800';
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.innerHTML = `
    <div class="whatsapp-inner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.41 0 .01 5.403.006 12.039a11.9 11.9 0 001.611 6.02L0 24l6.105-1.602a11.834 11.834 0 005.937 1.606h.005c6.637 0 12.038-5.402 12.042-12.039a11.82 11.82 0 00-3.48-8.512z" fill="currentColor"/>
      </svg>
      <span>Chat with Us</span>
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    #whatsapp-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 100;
      text-decoration: none;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #whatsapp-btn:hover {
      transform: scale(1.05) translateY(-5px);
    }
    .whatsapp-inner {
      background: #25D366;
      color: white;
      padding: 12px 20px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px rgba(37, 211, 102, 0.3);
      font-family: 'Jost', sans-serif;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    @media (max-width: 768px) {
      #whatsapp-btn {
        bottom: 20px;
        right: 20px;
      }
      .whatsapp-inner span {
        display: none;
      }
      .whatsapp-inner {
        padding: 15px;
        border-radius: 50%;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(btn);
}
