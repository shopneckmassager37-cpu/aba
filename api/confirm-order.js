import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const { name, email, phone, address, zone, subtotal, tax, delivery, driverTip, chefTip, total, notes, items } = req.query;

  if (!email || !name) {
    return res.status(400).send('Missing required fields');
  }

  let parsedItems = [];
  try { parsedItems = JSON.parse(items || '[]'); } catch {}

  const itemsHtml = parsedItems
    .map(i => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f0ede6;font-family:Georgia,serif;font-size:15px;color:#1a1a1a">${i.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0ede6;color:#999;font-size:13px;text-align:center">×${i.qty}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0ede6;text-align:right;font-size:14px;color:#1a1a1a">$${(parseFloat(i.price) * parseInt(i.qty)).toFixed(2)}</td>
      </tr>`)
    .join('');

  try {
    await resend.emails.send({
      from: 'Chefaleh <orders@chefaleh.com>',
      to: email,
      subject: `Your Chefaleh Order is Confirmed 🎉`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">

          <!-- Header -->
          <div style="background:#1a1a1a;padding:36px 32px;text-align:center">
            <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0 0 8px;font-size:26px;font-weight:400;letter-spacing:5px">CHEFALEH</h1>
            <p style="color:rgba(255,255,255,.4);margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase">Private Chef · Home Delivery</p>
          </div>

          <!-- Hero message -->
          <div style="padding:44px 32px 32px;text-align:center;border-bottom:1px solid #f0ede6">
            <div style="font-size:36px;margin-bottom:16px">✅</div>
            <h2 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1a1a1a;margin:0 0 12px">Order Confirmed</h2>
            <p style="font-size:15px;color:#666;margin:0;line-height:1.7;max-width:400px;margin:0 auto">
              Thank you, <strong style="color:#1a1a1a">${name}</strong>. Your order has been confirmed and is being prepared with care.
            </p>
          </div>

          <!-- Order details -->
          <div style="padding:32px">
            <h3 style="font-family:Georgia,serif;font-size:17px;font-weight:400;color:#1a1a1a;margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid #ede9e1">
              Order Summary
            </h3>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <thead>
                <tr style="background:#1a1a1a">
                  <th style="padding:9px 14px;text-align:left;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400">Item</th>
                  <th style="padding:9px 14px;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:center">Qty</th>
                  <th style="padding:9px 14px;font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <!-- Totals -->
            <table style="width:100%;border-collapse:collapse;max-width:260px;margin-left:auto">
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Subtotal</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${subtotal}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Tax (7%)</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${tax}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Delivery (${zone})</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${delivery}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Chef Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${chefTip}</td></tr>
              <tr><td style="padding:5px 10px;font-size:12px;color:#999">Driver Tip</td><td style="padding:5px 10px;text-align:right;font-size:13px">$${driverTip}</td></tr>
              <tr style="border-top:2px solid #D4AF37">
                <td style="padding:12px 10px;font-size:16px;font-family:Georgia,serif;color:#1a1a1a">Total</td>
                <td style="padding:12px 10px;text-align:right;font-size:20px;font-family:Georgia,serif;color:#D4AF37;font-weight:600">$${total}</td>
              </tr>
            </table>

            <!-- Delivery info -->
            <div style="margin-top:28px;background:#faf9f5;border:1px solid #ede9e1;padding:18px 20px">
              <p style="font-size:12px;color:#999;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Delivery To</p>
              <p style="font-size:14px;color:#1a1a1a;margin:0">${address}</p>
              ${notes ? `<p style="font-size:13px;color:#888;margin:10px 0 0;font-style:italic">Note: ${notes}</p>` : ''}
            </div>

            <!-- Next steps -->
            <div style="margin-top:20px;background:#faf7ec;border-left:3px solid #D4AF37;padding:16px 20px">
              <p style="font-size:13px;color:#555;margin:0;line-height:1.65">
                <strong style="color:#1a1a1a">Payment instructions</strong> will be sent to you separately. Please complete payment to finalize your order.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#1a1a1a;padding:22px 32px;text-align:center">
            <p style="font-size:11px;color:rgba(255,255,255,.3);margin:0;letter-spacing:1px">CHEFALEH · PRIVATE CHEF DELIVERY</p>
            <p style="font-size:11px;color:rgba(255,255,255,.2);margin:6px 0 0">Questions? Reply to this email.</p>
          </div>

        </div>
      `,
    });

    // Return a simple success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Order Confirmed</title>
        <style>
          body { font-family: Georgia, serif; background: #F9F7F2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .box { background: #fff; border: 1px solid #ede9e1; padding: 48px 56px; text-align: center; max-width: 440px; }
          h1 { color: #D4AF37; font-size: 1.75rem; font-weight: 400; letter-spacing: 3px; margin: 0 0 12px; }
          p { color: #666; font-size: .95rem; line-height: 1.7; margin: 0 0 8px; font-family: Arial, sans-serif; }
          .name { color: #1a1a1a; font-weight: 600; }
          .email { color: #D4AF37; font-size: .85rem; }
        </style>
      </head>
      <body>
        <div class="box">
          <div style="font-size:2.5rem;margin-bottom:16px">✅</div>
          <h1>CONFIRMED</h1>
          <p>Confirmation sent to <span class="name">${name}</span></p>
          <p class="email">${email}</p>
          <p style="margin-top:20px;font-size:.8rem;color:#bbb">You can close this tab.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
}
