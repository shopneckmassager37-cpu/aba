const CART_KEY = 'chefaleh_cart';

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
  if (found) { found.qty++; if (instructions !== undefined) found.instructions = instructions; }
  else { cart.push({ name, price: parseFloat(price), badge, qty: 1, instructions: instructions || '' }); }
  saveCart(cart);
}

function setQty(name, qty) {
  let cart = getCart();
  qty = parseInt(qty);
  if (qty <= 0) cart = cart.filter(i => i.name !== name);
  else { const f = cart.find(i => i.name === name); if (f) f.qty = qty; }
  saveCart(cart);
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
  // order summary if exists
  if (typeof renderOrderSummary === 'function') renderOrderSummary();
}

document.addEventListener('DOMContentLoaded', refreshCartUI);
