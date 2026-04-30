import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, address, zone, cart, subtotal, tax, delivery, driverTip, chefTip, total, notes } = req.body;

  const itemsHtml = (cart || [])
    .map(i => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;font-family:Georgia,serif;font-size:15px">${i.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;color:#888;font-size:14px;text-align:center">×${i.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;text-align:right;font-size:14px">$${(i.price * i.qty).toFixed(2)}</td>
      </tr>`)
    .join('');

  // Build confirm URL — passes all order data as query params
  const confirmParams = new URLSearchParams({
    name, email, phone, address, zone,
    subtotal, tax, delivery, driverTip, chefTip, total,
    notes: notes || '',
    items: JSON.stringify((cart || []).map(i => ({ name: i.name, qty: i.qty, price: i.price, badge: i.badge || '' })))
  });
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const confirmUrl = `${baseUrl}/api/confirm-order?${confirmParams.toString()}`;

  try {
    await resend.emails.send({
      from: 'Chefaleh Orders <orders@chefaleh.com>',
      to: 'chefaleh@chefaleh.com',
      reply_to: email,
      subject: `🧾 New Order — ${name} · $${total}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff">
          <div style="background:#1a1a1a;padding:28px 32px">
            <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0;font-size:22px;font-weight:400;letter-spacing:4px">CHEFALEH</h1>
            <p style="color:rgba(255,255,255,.45);margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase">New Order Received</p>
          </div>

          <div style="padding:32px">
            <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;color:#1a1a1a;margin:0 0 20px">Order from ${name}</h2>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafaf8;border:1px solid #ede9e1">
              <tr><td style="padding:9px 14px;font-size:12px;color:#999;width:110px;text-transform:uppercase;letter-spacing:1px">Name</td><td style="padding:9px 14px;font-size:14px;font-weight:600">${name}</td></tr>
              <tr style="background:#f5f2ea"><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Phone</td><td style="padding:9px 14px;font-size:14px"><a href="tel:${phone}" style="color:#1a1a1a">${phone}</a></td></tr>
              <tr><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Email</td><td style="padding:9px 14px;font-size:14px"><a href="mailto:${email}" style="color:#D4AF37">${email}</a></td></tr>
              <tr style="background:#f5f2ea"><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Address</td><td style="padding:9px 14px;font-size:14px">${address}</td></tr>
              <tr><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Zone</td><td style="padding:9px 14px;font-size:14px">${zone}</td></tr>
              ${notes ? `<tr style="background:#f5f2ea"><td style="padding:9px 14px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Notes</td><td style="padding:9px 14px;font-size:14px;font-style:italic;color:#555">${notes}</td></tr>` : ''}
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
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Subtotal</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${subtotal}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Tax (7%)</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${tax}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Delivery</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${delivery}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Chef Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${chefTip}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Driver Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${driverTip}</td></tr>
              <tr style="border-top:2px solid #D4AF37">
                <td style="padding:12px 10px;font-size:16px;font-family:Georgia,serif">Total</td>
                <td style="padding:12px 10px;text-align:right;font-size:18px;font-family:Georgia,serif;color:#D4AF37;font-weight:600">$${total}</td>
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
            <p style="font-size:11px;color:#bbb;margin:14px 0 0">This will send a confirmation email to: ${email}</p>
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
