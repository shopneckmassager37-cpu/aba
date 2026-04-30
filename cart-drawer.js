/* cart-drawer.js — shared cart drawer + order form for all pages */

const TAX_RATE = 0.07;
let drawerStep = 'cart'; // 'cart' | 'form' | 'done'
let deliveryFee = null;
let deliveryLabel = '';
let chefTipPct = 15;
let driverTipAmt = 10;

/* ── inject drawer HTML once DOM is ready ── */
document.addEventListener('DOMContentLoaded', () => {
  injectDrawer();
  refreshCartUI();
});

function injectDrawer() {
  if (document.getElementById('cd-overlay')) return;
  const html = `
<!-- CART DRAWER OVERLAY -->
<div id="cd-overlay" onclick="closeDrawer()"
  style="display:none;position:fixed;inset:0;background:rgba(26,26,26,.45);z-index:900;transition:opacity .3s"></div>

<!-- CART DRAWER PANEL -->
<div id="cd-panel"
  style="position:fixed;top:0;right:0;bottom:0;width:100%;max-width:440px;background:#F9F7F2;z-index:901;
         transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);
         display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(26,26,26,.18)">

  <!-- Header -->
  <div id="cd-header"
    style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;
           border-bottom:1px solid rgba(26,26,26,.1);background:#F9F7F2;flex-shrink:0">
    <div style="display:flex;align-items:center;gap:12px">
      <button id="cd-back" onclick="drawerGoCart()"
        style="display:none;background:none;border:none;cursor:pointer;padding:4px;color:#1A1A1A;opacity:.5;font-size:18px;line-height:1">←</button>
      <h3 id="cd-title"
        style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.25rem;font-weight:300;color:#1A1A1A">
        Your Cart</h3>
    </div>
    <button onclick="closeDrawer()"
      style="background:none;border:none;cursor:pointer;font-size:20px;color:#1A1A1A;opacity:.4;
             line-height:1;padding:4px;hover:opacity:1">✕</button>
  </div>

  <!-- Scrollable body -->
  <div id="cd-body" style="flex:1;overflow-y:auto;padding:0"></div>

  <!-- Footer -->
  <div id="cd-footer"
    style="border-top:1px solid rgba(26,26,26,.1);background:#EFEDE6;flex-shrink:0;padding:20px 24px"></div>
</div>

<!-- SPECIAL INSTRUCTIONS MODAL -->
<div id="instr-modal"
  style="display:none;position:fixed;inset:0;z-index:1000;align-items:center;justify-content:center;
         background:rgba(26,26,26,.6);padding:16px">
  <div style="background:#F9F7F2;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(26,26,26,.3)">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(26,26,26,.1)">
      <div>
        <h3 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.2rem;font-weight:300;color:#1A1A1A">Special Instructions</h3>
        <p id="modal-item-name" style="font-size:11px;color:rgba(26,26,26,.5);font-weight:300;margin-top:2px"></p>
      </div>
      <button onclick="closeModal()" style="background:none;border:none;cursor:pointer;font-size:20px;color:rgba(26,26,26,.4)">✕</button>
    </div>
    <div style="padding:20px 24px">
      <label style="display:block;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:rgba(26,26,26,.4);margin-bottom:8px">Notes for this item</label>
      <textarea id="modal-instr-text" rows="4"
        placeholder="Allergies, preparation preferences…"
        style="width:100%;border:1px solid rgba(26,26,26,.15);background:white;padding:12px 16px;
               font-size:13px;font-family:'Jost',sans-serif;font-weight:300;resize:none;outline:none;
               transition:border-color .2s;box-sizing:border-box"></textarea>
    </div>
    <div style="padding:0 24px 24px;display:flex;gap:12px">
      <button onclick="saveModal()"
        style="flex:1;background:#D4AF37;color:#1A1A1A;border:none;padding:14px;
               font-size:10px;letter-spacing:.15em;text-transform:uppercase;font-weight:500;
               cursor:pointer;font-family:'Jost',sans-serif;transition:background .2s">Save &amp; Add to Cart</button>
      <button onclick="closeModal()"
        style="padding:14px 20px;border:1px solid rgba(26,26,26,.15);background:none;
               font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:300;
               cursor:pointer;color:rgba(26,26,26,.5);font-family:'Jost',sans-serif">Cancel</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  renderDrawer();
}

/* ── open / close ── */
function openDrawer() {
  drawerStep = 'cart';
  renderDrawer();
  document.getElementById('cd-overlay').style.display = 'block';
  requestAnimationFrame(() => {
    document.getElementById('cd-panel').style.transform = 'translateX(0)';
  });
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('cd-panel').style.transform = 'translateX(100%)';
  document.getElementById('cd-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function drawerGoForm() {
  drawerStep = 'form';
  renderDrawer();
}

function drawerGoCart() {
  drawerStep = 'cart';
  renderDrawer();
}

/* ── main render ── */
function renderDrawer() {
  if (!document.getElementById('cd-body')) return;
  if (drawerStep === 'cart') renderCartStep();
  else if (drawerStep === 'form') renderFormStep();
  else if (drawerStep === 'done') renderDoneStep();
}

/* ── STEP 1: cart ── */
function renderCartStep() {
  const title = document.getElementById('cd-title');
  const back  = document.getElementById('cd-back');
  const body  = document.getElementById('cd-body');
  const foot  = document.getElementById('cd-footer');
  if (title) title.textContent = 'Your Cart';
  if (back)  back.style.display = 'none';

  const cart = getCart();
  const sub  = getSubtotal();
  const tax  = sub * TAX_RATE;

  if (cart.length === 0) {
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:220px;padding:32px;text-align:center">
        <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.4rem;font-weight:300;color:rgba(26,26,26,.3);margin-bottom:8px">Your cart is empty</p>
        <p style="font-size:12px;color:rgba(26,26,26,.3);font-weight:300">Browse the menu to add items</p>
      </div>`;
    foot.innerHTML = `
      <a href="menu.html"
        style="display:block;background:#D4AF37;color:#1A1A1A;text-align:center;padding:14px;
               font-size:10px;letter-spacing:.25em;text-transform:uppercase;font-weight:500;
               text-decoration:none;transition:background .3s">Browse Menu</a>`;
    return;
  }

  body.innerHTML = cart.map(i => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:16px 24px;border-bottom:1px solid rgba(26,26,26,.07)">
      <div style="flex:1;min-width:0">
        <p style="font-size:13px;color:#1A1A1A;font-weight:300;line-height:1.3">${i.name}</p>
        <p style="font-size:11px;color:rgba(26,26,26,.4);font-weight:300;margin-top:2px">${i.badge}</p>
        ${i.instructions ? `<p style="font-size:10px;color:#D4AF37;font-weight:300;margin-top:3px;font-style:italic">${i.instructions}</p>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <button onclick="deck('${i.name}',-1,${i.price},'${i.badge}')"
          style="width:28px;height:28px;border:1px solid rgba(26,26,26,.15);background:none;cursor:pointer;
                 font-size:14px;color:#1A1A1A;line-height:1;transition:background .2s;font-family:'Jost',sans-serif">−</button>
        <span style="font-size:13px;font-weight:300;width:18px;text-align:center;color:#1A1A1A">${i.qty}</span>
        <button onclick="deck('${i.name}',1,${i.price},'${i.badge}')"
          style="width:28px;height:28px;border:1px solid rgba(26,26,26,.15);background:none;cursor:pointer;
                 font-size:14px;color:#1A1A1A;line-height:1;transition:background .2s;font-family:'Jost',sans-serif">+</button>
      </div>
      <span style="font-size:13px;font-weight:300;color:#1A1A1A;width:56px;text-align:right;flex-shrink:0">
        $${(i.price * i.qty).toFixed(2)}</span>
    </div>`).join('');

  foot.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(26,26,26,.5);font-weight:300;margin-bottom:6px">
      <span>Subtotal</span><span>$${sub.toFixed(2)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(26,26,26,.5);font-weight:300;margin-bottom:12px">
      <span>Tax (7%)</span><span>$${tax.toFixed(2)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:15px;color:#1A1A1A;font-weight:500;
                padding-top:12px;border-top:1px solid rgba(26,26,26,.1);margin-bottom:16px;
                font-family:'Cormorant Garamond',Georgia,serif">
      <span>Estimated Total</span><span>$${(sub + tax).toFixed(2)}</span>
    </div>
    <button onclick="drawerGoForm()"
      style="width:100%;background:#1A1A1A;color:#F9F7F2;border:none;padding:16px;cursor:pointer;
             font-size:10px;letter-spacing:.25em;text-transform:uppercase;font-weight:500;
             font-family:'Jost',sans-serif;transition:background .3s">
      Proceed to Order →</button>`;

  /* update all badges */
  document.querySelectorAll('.cart-count-badge').forEach(el => {
    const c = getCount();
    el.textContent = c;
    el.style.display = c > 0 ? 'flex' : 'none';
  });
}

/* ── STEP 2: order form ── */
function renderFormStep() {
  const title = document.getElementById('cd-title');
  const back  = document.getElementById('cd-back');
  const body  = document.getElementById('cd-body');
  const foot  = document.getElementById('cd-footer');
  if (title) title.textContent = 'Your Order';
  if (back)  back.style.display = 'block';

  const sub      = getSubtotal();
  const tax      = sub * TAX_RATE;
  const chefTip  = sub * (chefTipPct / 100);
  const delivery = deliveryFee !== null ? deliveryFee : 0;
  const total    = sub + tax + chefTip + driverTipAmt + delivery;

  const field = (id, label, type, placeholder) => `
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:10px;letter-spacing:.15em;text-transform:uppercase;
                    color:rgba(26,26,26,.4);margin-bottom:6px">${label}</label>
      <input id="f-${id}" type="${type}" placeholder="${placeholder}"
        style="width:100%;border:1px solid rgba(26,26,26,.15);background:white;padding:11px 14px;
               font-size:13px;font-family:'Jost',sans-serif;font-weight:300;outline:none;
               transition:border-color .2s;box-sizing:border-box"/>
    </div>`;

  const zoneBtn = (fee, label, areas) => `
    <div class="zone-opt" data-fee="${fee}"
      onclick="selectZoneOpt(this,${fee},'${label}')"
      style="border:2px solid rgba(26,26,26,.1);padding:14px 16px;cursor:pointer;
             margin-bottom:8px;transition:border-color .2s,background .2s;background:white">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1rem;font-weight:300;color:#1A1A1A">${label}</span>
        <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;color:#D4AF37">$${fee}</span>
      </div>
      <p style="font-size:11px;color:rgba(26,26,26,.4);font-weight:300">${areas}</p>
    </div>`;

  const tipBtn = (val, label, group) => `
    <button class="tip-${group}" data-val="${val}"
      onclick="selectTip(this,'${group}',${val})"
      style="padding:9px 14px;border:1px solid rgba(26,26,26,.15);background:white;cursor:pointer;
             font-size:12px;font-family:'Jost',sans-serif;font-weight:300;color:#1A1A1A;
             transition:all .2s">${label}</button>`;

  body.innerHTML = `
    <div style="padding:20px 24px">

      <!-- Order summary mini -->
      <div style="background:white;border:1px solid rgba(26,26,26,.08);padding:14px 16px;margin-bottom:24px">
        <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(26,26,26,.4);margin-bottom:10px">Cart Summary</p>
        ${getCart().map(i => `
          <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(26,26,26,.6);
                      font-weight:300;margin-bottom:5px">
            <span>${i.name} × ${i.qty}</span>
            <span>$${(i.price*i.qty).toFixed(2)}</span>
          </div>`).join('')}
      </div>

      <!-- Contact -->
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;
                color:#1A1A1A;margin-bottom:14px">Contact</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
        ${field('fn','First Name *','text','Sarah')}
        ${field('ln','Last Name *','text','Cohen')}
      </div>
      ${field('em','Email *','email','sarah@example.com')}
      ${field('ph','Phone *','tel','(555) 000-0000')}

      <div style="height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);margin:20px 0"></div>

      <!-- Delivery Zone -->
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;
                color:#1A1A1A;margin-bottom:14px">Delivery Zone</p>
      ${zoneBtn(15,'Zone 1 — Local','Miami Beach · Surfside · Bal Harbour · North Bay Village')}
      ${zoneBtn(30,'Zone 2 — Extended','Aventura · Sunny Isles · North Miami Beach · Hollywood · Hallandale')}
      ${zoneBtn(60,'Zone 3 — Long Range','Fort Lauderdale · Pompano Beach · Boca Raton')}

      <div style="height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);margin:20px 0"></div>

      <!-- Address -->
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;
                color:#1A1A1A;margin-bottom:14px">Delivery Address</p>
      ${field('addr','Street Address *','text','123 Maple Street')}
      ${field('apt','Apt / Suite','text','Apt 4B')}
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:0 10px">
        ${field('city','City *','text','Miami Beach')}
        ${field('state','State *','text','FL')}
        ${field('zip','ZIP *','text','33139')}
      </div>

      <div style="height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);margin:20px 0"></div>

      <!-- Driver tip -->
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;
                color:#1A1A1A;margin-bottom:6px">Driver Tip</p>
      <p style="font-size:11px;color:rgba(26,26,26,.4);font-weight:300;margin-bottom:12px">Fixed amount</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px">
        ${tipBtn(0,'No Tip','driver')}
        ${tipBtn(3,'$3','driver')}
        ${tipBtn(5,'$5','driver')}
        ${tipBtn(10,'$10','driver')}
        ${tipBtn(15,'$15','driver')}
        ${tipBtn(20,'$20','driver')}
      </div>

      <div style="height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);margin:20px 0"></div>

      <!-- Chef tip -->
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;
                color:#1A1A1A;margin-bottom:6px">Chef Tip</p>
      <p style="font-size:11px;color:rgba(26,26,26,.4);font-weight:300;margin-bottom:12px">% of order subtotal</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px">
        ${tipBtn(0,'No Tip','chef')}
        ${tipBtn(10,'10%','chef')}
        ${tipBtn(15,'15%','chef')}
        ${tipBtn(20,'20%','chef')}
        ${tipBtn(25,'25%','chef')}
      </div>

      <div style="height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);margin:20px 0"></div>

      <!-- Notes -->
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;
                color:#1A1A1A;margin-bottom:14px">Special Notes</p>
      <textarea id="f-notes" rows="3" placeholder="Allergies, gate code, delivery instructions…"
        style="width:100%;border:1px solid rgba(26,26,26,.15);background:white;padding:12px 14px;
               font-size:13px;font-family:'Jost',sans-serif;font-weight:300;resize:none;outline:none;
               box-sizing:border-box;transition:border-color .2s"></textarea>

      <p style="font-size:10px;color:rgba(26,26,26,.3);font-weight:300;margin-top:16px;line-height:1.6">
        By submitting, you agree to our terms. Order confirmed upon payment only.<br/>
        No cancellations after Wednesday 4:00 PM.
      </p>
    </div>`;

  /* restore tip selections */
  requestAnimationFrame(() => {
    highlightTip('driver', driverTipAmt);
    highlightTip('chef',   chefTipPct);
    if (deliveryFee !== null) {
      document.querySelectorAll('.zone-opt').forEach(el => {
        if (parseInt(el.dataset.fee) === deliveryFee) applyZoneStyle(el, true);
      });
    }
  });

  const sub2 = getSubtotal();
  const chefTip2 = sub2 * (chefTipPct/100);
  const delivery2 = deliveryFee !== null ? deliveryFee : 0;
  const total2 = sub2 + (sub2*TAX_RATE) + chefTip2 + driverTipAmt + delivery2;

  foot.innerHTML = `
    <div id="form-totals" style="font-size:11px;color:rgba(26,26,26,.5);font-weight:300;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span>Subtotal</span><span>$${sub2.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span>Tax (7%)</span><span>$${(sub2*TAX_RATE).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span>Delivery</span><span id="fd-delivery">${deliveryFee !== null ? '$'+deliveryFee.toFixed(2) : '—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span>Driver Tip</span><span id="fd-driver">$${driverTipAmt.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Chef Tip</span><span id="fd-chef">${chefTipPct > 0 ? '$'+chefTip2.toFixed(2) : '$0.00'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:14px;color:#1A1A1A;font-weight:500;
                  padding-top:10px;border-top:1px solid rgba(26,26,26,.1);
                  font-family:'Cormorant Garamond',Georgia,serif">
        <span>Total</span><span id="fd-total">$${total2.toFixed(2)}</span>
      </div>
    </div>
    <button onclick="submitOrder()"
      style="width:100%;background:#D4AF37;color:#1A1A1A;border:none;padding:16px;cursor:pointer;
             font-size:10px;letter-spacing:.25em;text-transform:uppercase;font-weight:500;
             font-family:'Jost',sans-serif;transition:background .3s" id="submit-btn">
      Submit Order</button>
    <p style="font-size:10px;color:rgba(26,26,26,.3);text-align:center;margin-top:10px;font-weight:300">
      Orders close Wednesday at 4:00 PM</p>`;
}

/* ── STEP 3: done ── */
function renderDoneStep() {
  const title = document.getElementById('cd-title');
  const back  = document.getElementById('cd-back');
  const body  = document.getElementById('cd-body');
  const foot  = document.getElementById('cd-footer');
  if (title) title.textContent = 'Order Received';
  if (back)  back.style.display = 'none';

  body.innerHTML = `
    <div style="padding:32px 24px;text-align:center">
      <div style="width:56px;height:56px;border:2px solid #D4AF37;display:flex;align-items:center;
                  justify-content:center;margin:0 auto 20px;font-size:22px;color:#D4AF37">✓</div>
      <p style="font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#D4AF37;
                font-weight:300;margin-bottom:8px">Order Submitted</p>
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.6rem;font-weight:300;
                 color:#1A1A1A;margin-bottom:12px">Pending Payment</h2>
      <p style="font-size:13px;color:rgba(26,26,26,.55);font-weight:300;line-height:1.7;margin-bottom:28px">
        Complete payment below to confirm your spot. Delivery confirmed via email once payment clears.</p>

      <div style="text-align:left;border:1px solid rgba(26,26,26,.1);margin-bottom:16px">
        <div style="padding:20px;border-bottom:1px solid rgba(26,26,26,.08)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;color:#1A1A1A">Pay via Zelle</p>
            <span style="font-size:9px;letter-spacing:.1em;background:rgba(212,175,55,.1);
                         color:#D4AF37;padding:4px 8px;text-transform:uppercase">Preferred</span>
          </div>
          <p style="font-size:12px;color:rgba(26,26,26,.5);font-weight:300;margin-bottom:4px">Send to:</p>
          <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;color:#1A1A1A;margin-bottom:4px">chefaleh@gmail.com</p>
          <p style="font-size:11px;color:rgba(26,26,26,.35);font-weight:300">Include your name &amp; order number in memo.</p>
        </div>
        <div style="padding:20px">
          <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:300;color:#1A1A1A;margin-bottom:6px">Pay via Venmo</p>
          <p style="font-size:12px;color:rgba(26,26,26,.5);font-weight:300;margin-bottom:4px">Send to:</p>
          <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;color:#1A1A1A;margin-bottom:4px">@Chefaleh</p>
          <p style="font-size:11px;color:rgba(26,26,26,.35);font-weight:300">Set to Friends &amp; Family. Include name &amp; order number.</p>
        </div>
      </div>

      <div id="done-summary" style="text-align:left;border:1px solid rgba(212,175,55,.25);
           background:rgba(212,175,55,.04);padding:16px;font-size:12px;color:rgba(26,26,26,.6);font-weight:300"></div>
    </div>`;

  foot.innerHTML = `
    <button onclick="closeDrawer()"
      style="width:100%;background:#1A1A1A;color:#F9F7F2;border:none;padding:14px;cursor:pointer;
             font-size:10px;letter-spacing:.25em;text-transform:uppercase;font-weight:500;
             font-family:'Jost',sans-serif">Close</button>`;

  buildDoneSummary();
}

function buildDoneSummary() {
  const el = document.getElementById('done-summary');
  if (!el) return;
  const cart = getCart();
  const sub = getSubtotal();
  const tax = sub * TAX_RATE;
  const chefTip = sub * (chefTipPct/100);
  const delivery = deliveryFee || 0;
  const total = sub + tax + chefTip + driverTipAmt + delivery;
  el.innerHTML = `
    <p style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:rgba(26,26,26,.35);margin-bottom:10px">Order Summary</p>
    ${cart.map(i=>`<div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span>
    </div>`).join('')}
    <div style="border-top:1px solid rgba(212,175,55,.2);margin-top:10px;padding-top:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Delivery</span><span>$${delivery.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Driver Tip</span><span>$${driverTipAmt.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Chef Tip</span><span>$${chefTip.toFixed(2)}</span></div>
    </div>
    <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(212,175,55,.2);
                margin-top:8px;padding-top:10px;font-size:14px;color:#1A1A1A;
                font-family:'Cormorant Garamond',Georgia,serif">
      <span>Total Due</span><span>$${total.toFixed(2)}</span>
    </div>`;
}

/* ── zone / tip helpers ── */
function applyZoneStyle(el, sel) {
  el.style.borderColor  = sel ? '#D4AF37' : 'rgba(26,26,26,.1)';
  el.style.background   = sel ? 'rgba(212,175,55,.05)' : 'white';
}

function selectZoneOpt(el, fee, label) {
  document.querySelectorAll('.zone-opt').forEach(z => applyZoneStyle(z, false));
  applyZoneStyle(el, true);
  deliveryFee   = fee;
  deliveryLabel = label;
  updateFormTotals();
}

function highlightTip(group, val) {
  document.querySelectorAll('.tip-'+group).forEach(b => {
    const active = parseFloat(b.dataset.val) === val;
    b.style.background   = active ? '#D4AF37' : 'white';
    b.style.borderColor  = active ? '#D4AF37' : 'rgba(26,26,26,.15)';
    b.style.color        = active ? '#1A1A1A' : '#1A1A1A';
  });
}

function selectTip(el, group, val) {
  if (group === 'driver') driverTipAmt = val;
  else chefTipPct = val;
  highlightTip(group, val);
  updateFormTotals();
}

function updateFormTotals() {
  const sub      = getSubtotal();
  const tax      = sub * TAX_RATE;
  const chefTip  = sub * (chefTipPct/100);
  const delivery = deliveryFee !== null ? deliveryFee : 0;
  const total    = sub + tax + chefTip + driverTipAmt + delivery;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('fd-delivery', deliveryFee !== null ? '$'+delivery.toFixed(2) : '—');
  set('fd-driver',   '$'+driverTipAmt.toFixed(2));
  set('fd-chef',     chefTipPct > 0 ? '$'+chefTip.toFixed(2) : '$0.00');
  set('fd-total',    '$'+total.toFixed(2));
}

/* ── submit ── */
function submitOrder() {
  const req = [
    {id:'fn',label:'First Name'},{id:'ln',label:'Last Name'},
    {id:'em',label:'Email'},{id:'ph',label:'Phone'},
    {id:'addr',label:'Street Address'},{id:'city',label:'City'},
    {id:'state',label:'State'},{id:'zip',label:'ZIP'}
  ];
  let ok = true;
  req.forEach(r => {
    const el = document.getElementById('f-'+r.id);
    if (!el) return;
    if (!el.value.trim()) { el.style.borderColor='#C0392B'; ok=false; }
    else el.style.borderColor = '';
  });
  if (!ok)               { alert('Please fill in all required fields.'); return; }
  if (deliveryFee === null) { alert('Please select a delivery zone.'); return; }
  if (getCart().length === 0) { alert('Your cart is empty.'); return; }

  const btn = document.getElementById('submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  const cart     = getCart();
  const sub      = getSubtotal();
  const tax      = sub * TAX_RATE;
  const chefTip  = sub * (chefTipPct/100);
  const delivery = deliveryFee || 0;
  const total    = sub + tax + chefTip + driverTipAmt + delivery;

  const val = id => { const e = document.getElementById('f-'+id); return e ? e.value : ''; };

  const body = {
    name:     val('fn') + ' ' + val('ln'),
    email:    val('em'),
    phone:    val('ph'),
    address:  [val('addr'), val('apt'), val('city'), val('state'), val('zip')].filter(Boolean).join(', '),
    zone:     deliveryLabel,
    cart,
    subtotal: sub.toFixed(2),
    tax:      tax.toFixed(2),
    delivery: delivery.toFixed(2),
    driverTip: driverTipAmt.toFixed(2),
    chefTip:  chefTip.toFixed(2),
    total:    total.toFixed(2),
    notes:    val('notes')
  };

  fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      clearCart();
      drawerStep = 'done';
      renderDrawer();
    })
    .catch(err => {
      alert('Failed to send order: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Submit Order'; }
    });
}

/* ── modal (special instructions) ── */
let _modalItem = null;

function openModal(item) {
  _modalItem = item;
  const nameEl = document.getElementById('modal-item-name');
  const textEl = document.getElementById('modal-instr-text');
  if (nameEl) nameEl.textContent = item.name;
  if (textEl) {
    const existing = getCart().find(i => i.name === item.name);
    textEl.value = existing ? existing.instructions || '' : '';
  }
  const modal = document.getElementById('instr-modal');
  if (modal) modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('instr-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  _modalItem = null;
}

function saveModal() {
  if (!_modalItem) return;
  const text = (document.getElementById('modal-instr-text')?.value || '').trim();
  deck(_modalItem.name, 1, _modalItem.price, _modalItem.badge, text);
  closeModal();
}
