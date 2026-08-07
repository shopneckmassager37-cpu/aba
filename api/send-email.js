import { createHmac } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SUPABASE_URL = 'https://gubckjmffliwukroluxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1YmNram1mZmxpd3Vrcm9sdXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDA4NDYsImV4cCI6MjA5MzExNjg0Nn0.qDuyWCltbNlIPsDdX8tUzZMF1VJgPXipH9wageTqTQw';

const TAX_RATE = 0.07;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONFIRM_FIELDS = ['orderId', 'name', 'email', 'phone', 'address', 'zone', 'subtotal', 'tax', 'delivery', 'driverTip', 'chefTip', 'total', 'notes', 'items'];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function clampText(s, max) {
  // Strip control chars (incl. CR/LF) to prevent header injection when a field is used in a subject line.
  return String(s ?? '').replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').trim().slice(0, max);
}

function isReasonableAmount(n, max) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
}

function getConfirmSecret() {
  return process.env.ORDER_CONFIRM_SECRET || process.env.CONFIRM_SECRET || process.env.RESEND_API_KEY;
}

function canonicalizeConfirmPayload(payload) {
  return CONFIRM_FIELDS
    .map(field => `${field}=${encodeURIComponent(payload[field] ?? '')}`)
    .join('&');
}

function signConfirmPayload(payload) {
  const secret = getConfirmSecret();
  if (!secret) throw new Error('Missing order confirmation secret');
  return createHmac('sha256', secret).update(canonicalizeConfirmPayload(payload)).digest('hex');
}

async function fetchVisibleProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=name,price,visible`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error('Could not load menu for validation');
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const name = clampText(body.name, 100);
  const phone = clampText(body.phone, 40);
  const email = clampText(body.email, 200);
  const address = clampText(body.address, 300);
  const zoneLabel = clampText(body.zone, 60);
  const notes = clampText(body.notes, 500);
  const deliveryDate = clampText(body.deliveryDate, 60);
  const rawCart = Array.isArray(body.cart) ? body.cart : [];

  if (!name || !phone || !EMAIL_RE.test(email) || !address) {
    return res.status(400).json({ error: 'Missing or invalid contact details' });
  }
  if (!rawCart.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const delivery = parseFloat(body.delivery);
  const driverTip = parseFloat(body.driverTip);
  const chefTip = parseFloat(body.chefTip);
  if (!isReasonableAmount(delivery, 200) || !isReasonableAmount(driverTip, 500) || !isReasonableAmount(chefTip, 2000)) {
    return res.status(400).json({ error: 'Invalid order totals' });
  }

  // Recompute the subtotal/tax server-side from real menu prices — never trust client-sent prices.
  let catalog;
  try {
    catalog = await fetchVisibleProducts();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
  const byName = new Map(catalog.filter(p => p.visible !== false).map(p => [p.name, p.price]));

  const cart = [];
  for (const item of rawCart) {
    const price = byName.get(item?.name);
    const qty = parseInt(item?.qty, 10);
    if (price === undefined || !Number.isFinite(qty) || qty <= 0 || qty > 100) {
      return res.status(400).json({ error: `Unknown or invalid item: ${clampText(item?.name, 100)}` });
    }
    cart.push({
      name: item.name,
      qty,
      price,
      badge: clampText(item.badge, 60),
      instructions: clampText(item.instructions, 300),
    });
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + delivery + driverTip + chefTip;

  const itemsHtml = cart
    .map(i => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;font-family:Georgia,serif;font-size:15px">
          ${escapeHtml(i.name)}
          ${i.instructions ? `<div style="font-size:12px;color:#D4AF37;font-style:italic;margin-top:2px">Note: ${escapeHtml(i.instructions)}</div>` : ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;color:#888;font-size:14px;text-align:center">×${i.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;text-align:right;font-size:14px">$${(i.price * i.qty).toFixed(2)}</td>
      </tr>`)
    .join('');

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeAddress = escapeHtml(address);
  const safeZone = escapeHtml(zoneLabel);
  const safeNotes = escapeHtml(notes);
  const safeDeliveryDate = escapeHtml(deliveryDate || 'Next Friday');
  const fmt = n => n.toFixed(2);
  const orderId = `CHF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const confirmPayload = {
    orderId,
    name, email, phone, address, zone: zoneLabel,
    subtotal: fmt(subtotal), tax: fmt(tax), delivery: fmt(delivery),
    driverTip: fmt(driverTip), chefTip: fmt(chefTip), total: fmt(total),
    notes,
    items: JSON.stringify(cart.map(i => ({
      name: i.name,
      qty: i.qty,
      price: i.price,
      badge: i.badge || '',
      instructions: i.instructions || ''
    })))
  };
  const confirmParams = new URLSearchParams({
    ...confirmPayload,
    token: signConfirmPayload(confirmPayload)
  });
  const baseUrl = process.env.SITE_URL
    || (process.env.VERCEL_ENV === 'production' ? 'https://chefaleh.com' : null)
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000';
  const confirmUrl = `${baseUrl}/api/confirm-order?${confirmParams.toString()}`;

  try {
    // Send payment instructions email to customer immediately
    await resend.emails.send({
      from: 'Chefaleh <orders@chefaleh.com>',
      to: email,
      subject: `Thank You for Your Order — Payment Instructions`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">

          <!-- Header -->
          <div style="background:#1a1a1a;padding:36px 32px;text-align:center">
            <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:5px">CHEFALEH</h1>
            <p style="color:rgba(255,255,255,.4);margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase">Private Chef · Home Delivery</p>
          </div>

          <!-- Thank you -->
          <div style="padding:44px 32px 32px;text-align:center;border-bottom:1px solid #f0ede6">
            <div style="font-size:36px;margin-bottom:16px">🙏</div>
            <h2 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1a1a1a;margin:0 0 12px">Thank You, ${safeName}!</h2>
            <p style="font-size:15px;color:#666;margin:0 auto;line-height:1.8;max-width:420px">
              We've received your order and are excited to cook for you. To complete your reservation, please send payment using one of the options below.
            </p>
          </div>

          <!-- Amount due -->
          <div style="padding:32px 32px 0;text-align:center">
            <p style="font-size:12px;color:#999;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Amount Due</p>
            <div style="font-family:Georgia,serif;font-size:48px;color:#D4AF37;font-weight:600;line-height:1">$${fmt(total)}</div>
            <p style="font-size:12px;color:#bbb;margin:8px 0 0">Please include your name in the payment note</p>
          </div>

          <!-- Payment methods -->
          <div style="padding:32px">
            <h3 style="font-family:Georgia,serif;font-size:17px;font-weight:400;color:#1a1a1a;margin:0 0 16px;padding-bottom:10px;border-bottom:1px solid #ede9e1;text-align:center;letter-spacing:2px;text-transform:uppercase;font-size:12px;color:#999">How to Pay</h3>

            <!-- Venmo -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid #f0ede6">
              <div>
                <p style="margin:0 0 3px;font-size:15px;font-family:Georgia,serif;color:#1a1a1a">Venmo</p>
                <p style="margin:0;font-size:13px;color:#D4AF37">@Avicam</p>
              </div>
              <a href="https://venmo.com/u/Avicam" style="display:inline-block;background:#1a1a1a;color:#D4AF37;padding:10px 22px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none">Open Venmo</a>
            </div>

            <!-- Zelle -->
            <div style="padding:16px 0;border-bottom:1px solid #f0ede6">
              <p style="margin:0 0 3px;font-size:15px;font-family:Georgia,serif;color:#1a1a1a">Zelle</p>
              <p style="margin:0;font-size:13px;color:#888">avicam@gmail.com</p>
            </div>

            <!-- Crowded -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 0">
              <div>
                <p style="margin:0 0 3px;font-size:15px;font-family:Georgia,serif;color:#1a1a1a">Crowded</p>
                <p style="margin:0;font-size:13px;color:#888">Online payment link</p>
              </div>
              <a href="https://collect.crowded.me/collection/d0b9a878-479d-47db-9d48-6f14cddd9393" style="display:inline-block;background:#D4AF37;color:#1a1a1a;padding:10px 22px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none">Pay Now</a>
            </div>
          </div>

          <!-- Instructions -->
          <div style="margin:0 32px 32px;background:#faf9f5;border:1px solid #ede9e1;padding:20px 24px">
            <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px">Important</p>
            <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;color:#555;line-height:2">
              <li style="padding:2px 0">— Include your name in the payment note</li>
              <li style="padding:2px 0">— Your order is confirmed only after payment is received</li>
              <li style="padding:2px 0">— A confirmation email will be sent to you once approved</li>
            </ul>
          </div>

          <!-- Order summary -->
          <div style="padding:0 32px 32px">
            <h3 style="font-family:Georgia,serif;font-size:17px;font-weight:400;color:#1a1a1a;margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid #ede9e1">Your Order</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <thead>
                <tr style="background:#1a1a1a">
                  <th style="padding:9px 14px;text-align:left;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400">Item</th>
                  <th style="padding:9px 14px;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:center">Qty</th>
                  <th style="padding:9px 14px;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <table style="width:100%;border-collapse:collapse;max-width:260px;margin-left:auto">
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Subtotal</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(subtotal)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Tax (7%)</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(tax)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Delivery (${safeZone})</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(delivery)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Chef Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(chefTip)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Driver Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(driverTip)}</td></tr>
              <tr style="border-top:2px solid #D4AF37">
                <td style="padding:12px 10px;font-size:16px;font-family:Georgia,serif;color:#1a1a1a">Total</td>
                <td style="padding:12px 10px;text-align:right;font-size:20px;font-family:Georgia,serif;color:#D4AF37;font-weight:600">$${fmt(total)}</td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div style="background:#1a1a1a;padding:22px 32px;text-align:center">
            <p style="font-size:11px;color:rgba(255,255,255,.3);margin:0;letter-spacing:1px">CHEFALEH · PRIVATE CHEF DELIVERY</p>
            <p style="font-size:11px;color:rgba(255,255,255,.2);margin:6px 0 0">Questions? Email us at <a href="mailto:chefaleh@chefaleh.com" style="color:#D4AF37;text-decoration:none">chefaleh@chefaleh.com</a></p>
          </div>

        </div>
      `,
    });

    // Send order notification to admin
    await resend.emails.send({
      from: 'Chefaleh Orders <orders@chefaleh.com>',
      to: 'chefaleh@chefaleh.com',
      reply_to: email,
      subject: `🧾 New Order — ${name} · $${fmt(total)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff">
          <div style="background:#1a1a1a;padding:28px 32px">
            <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0;font-size:22px;font-weight:400;letter-spacing:4px">CHEFALEH</h1>
            <p style="color:rgba(255,255,255,.45);margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase">New Order Received</p>
          </div>

          <div style="padding:32px">
            <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;color:#1a1a1a;margin:0 0 20px">Order from ${safeName}</h2>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafaf8;border:1px solid #ede9e1">
              <tr><td style="padding:9px 14px;font-size:12px;color:#999;width:110px;text-transform:uppercase;letter-spacing:1px">Name</td><td style="padding:9px 14px;font-size:14px;font-weight:600">${safeName}</td></tr>
              <tr style="background:#f5f2ea"><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Phone</td><td style="padding:9px 14px;font-size:14px"><a href="tel:${safePhone}" style="color:#1a1a1a">${safePhone}</a></td></tr>
              <tr><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Email</td><td style="padding:9px 14px;font-size:14px"><a href="mailto:${safeEmail}" style="color:#D4AF37">${safeEmail}</a></td></tr>
              <tr><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Address</td><td style="padding:9px 14px;font-size:14px">${safeAddress}</td></tr>
              <tr style="background:#f5f2ea"><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Delivery For</td><td style="padding:9px 14px;font-size:14px;font-weight:700;color:#D4AF37">${safeDeliveryDate}</td></tr>
              <tr><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Zone</td><td style="padding:9px 14px;font-size:14px">${safeZone}</td></tr>
              ${notes ? `<tr style="background:#f5f2ea"><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Notes</td><td style="padding:9px 14px;font-size:14px;font-style:italic;color:#555">${safeNotes}</td></tr>` : ''}
            </table>

            <h3 style="font-family:Georgia,serif;font-size:15px;font-weight:400;color:#1a1a1a;margin:0 0 8px">Items Ordered</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <thead>
                <tr style="background:#1a1a1a">
                  <th style="padding:9px 12px;text-align:left;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400">Item</th>
                  <th style="padding:9px 12px;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:center">Qty</th>
                  <th style="padding:9px 12px;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <table style="width:100%;border-collapse:collapse;max-width:260px;margin-left:auto">
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Subtotal</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(subtotal)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Tax (7%)</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(tax)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Delivery</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(delivery)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Chef Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(chefTip)}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Driver Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${fmt(driverTip)}</td></tr>
              <tr style="border-top:2px solid #D4AF37">
                <td style="padding:12px 10px;font-size:16px;font-family:Georgia,serif">Total</td>
                <td style="padding:12px 10px;text-align:right;font-size:18px;font-family:Georgia,serif;color:#D4AF37;font-weight:600">$${fmt(total)}</td>
              </tr>
            </table>
          </div>

          <!-- CONFIRM BUTTON -->
          <div style="padding:0 32px 36px;text-align:center">
            <p style="font-size:13px;color:#888;margin:0 0 18px">When you're ready to confirm this order, click the button below to send the customer their confirmation email.</p>
            <a href="${confirmUrl}"
               style="display:inline-block;background:#D4AF37;color:#1a1a1a;padding:14px 36px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none">
              ✓ Confirm Order &amp; Notify Customer
            </a>
            <p style="font-size:11px;color:#bbb;margin:14px 0 0">This will send a confirmation email to: ${safeEmail}</p>
          </div>

          <div style="background:#f5f2ea;padding:16px 32px;text-align:center">
            <p style="font-size:11px;color:#aaa;margin:0">Reply to this email to contact the customer directly</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
