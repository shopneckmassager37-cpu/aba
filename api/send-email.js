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

  const itemsHtmlCustomer = (cart || [])
    .map(i => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;font-family:Georgia,serif;font-size:15px;color:#1a1a1a">${i.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;color:#999;font-size:13px;text-align:center">×${i.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0ede6;text-align:right;font-size:14px;color:#1a1a1a">$${(i.price * i.qty).toFixed(2)}</td>
      </tr>`)
    .join('');

  try {
    // 1. Email to owner with full order details
    await resend.emails.send({
      from: 'Chefaleh Orders <orders@chefaleh.com>',
      to: 'avicamgitlin@gmail.com',
      subject: `🧾 New Order — ${name} · $${total}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
          <div style="background:#1a1a1a;padding:28px 32px">
            <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0;font-size:24px;font-weight:400;letter-spacing:4px">CHEFALEH</h1>
            <p style="color:rgba(255,255,255,.5);margin:6px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase">New Order Received</p>
          </div>

          <div style="padding:32px">
            <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;color:#1a1a1a;margin:0 0 20px">Order from ${name}</h2>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafaf8;border:1px solid #ede9e1">
              <tr><td style="padding:10px 14px;font-size:13px;color:#666;width:120px">Name</td><td style="padding:10px 14px;font-size:14px;font-weight:600">${name}</td></tr>
              <tr style="background:#f5f2ea"><td style="padding:10px 14px;font-size:13px;color:#666">Phone</td><td style="padding:10px 14px;font-size:14px">${phone}</td></tr>
              <tr><td style="padding:10px 14px;font-size:13px;color:#666">Email</td><td style="padding:10px 14px;font-size:14px">${email}</td></tr>
              <tr style="background:#f5f2ea"><td style="padding:10px 14px;font-size:13px;color:#666">Address</td><td style="padding:10px 14px;font-size:14px">${address}</td></tr>
              <tr><td style="padding:10px 14px;font-size:13px;color:#666">Zone</td><td style="padding:10px 14px;font-size:14px">${zone}</td></tr>
              ${notes ? `<tr style="background:#f5f2ea"><td style="padding:10px 14px;font-size:13px;color:#666">Notes</td><td style="padding:10px 14px;font-size:14px;font-style:italic">${notes}</td></tr>` : ''}
            </table>

            <h3 style="font-family:Georgia,serif;font-size:16px;font-weight:400;color:#1a1a1a;margin:0 0 8px">Items Ordered</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <thead>
                <tr style="background:#1a1a1a">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400">Item</th>
                  <th style="padding:10px 12px;font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:center">Qty</th>
                  <th style="padding:10px 12px;font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-weight:400;text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <table style="width:100%;border-collapse:collapse;max-width:280px;margin-left:auto">
              <tr><td style="padding:6px 12px;font-size:13px;color:#666">Subtotal</td><td style="padding:6px 12px;text-align:right;font-size:13px">$${subtotal}</td></tr>
              <tr><td style="padding:6px 12px;font-size:13px;color:#666">Tax (7%)</td><td style="padding:6px 12px;text-align:right;font-size:13px">$${tax}</td></tr>
              <tr><td style="padding:6px 12px;font-size:13px;color:#666">Delivery</td><td style="padding:6px 12px;text-align:right;font-size:13px">$${delivery}</td></tr>
              <tr><td style="padding:6px 12px;font-size:13px;color:#666">Chef Tip</td><td style="padding:6px 12px;text-align:right;font-size:13px">$${chefTip}</td></tr>
              <tr><td style="padding:6px 12px;font-size:13px;color:#666">Driver Tip</td><td style="padding:6px 12px;text-align:right;font-size:13px">$${driverTip}</td></tr>
              <tr style="border-top:2px solid #D4AF37">
                <td style="padding:12px;font-size:16px;font-family:Georgia,serif;font-weight:400">Total</td>
                <td style="padding:12px;text-align:right;font-size:18px;font-family:Georgia,serif;color:#D4AF37;font-weight:600">$${total}</td>
              </tr>
            </table>
          </div>

          <div style="background:#f5f2ea;padding:20px 32px;text-align:center">
            <p style="font-size:12px;color:#999;margin:0">Reply to this email to contact the customer: <a href="mailto:${email}" style="color:#D4AF37">${email}</a></p>
          </div>
        </div>
      `,
      reply_to: email,
    });

    // 2. Confirmation email to customer — pending manual approval
    if (email) {
      await resend.emails.send({
        from: 'Chefaleh <orders@chefaleh.com>',
        to: email,
        subject: `Your Chefaleh Order is Pending Confirmation`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
            <div style="background:#1a1a1a;padding:32px;text-align:center">
              <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0;font-size:26px;font-weight:400;letter-spacing:5px">CHEFALEH</h1>
              <p style="color:rgba(255,255,255,.45);margin:8px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase">Private Chef · Home Delivery</p>
            </div>

            <div style="padding:40px 32px;text-align:center">
              <div style="display:inline-block;background:#faf7ec;border:1px solid #D4AF37;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;margin-bottom:20px">⏳</div>
              <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1a1a1a;margin:0 0 10px">Order Received</h2>
              <p style="font-size:14px;color:#888;margin:0 0 32px;line-height:1.6">Thank you, ${name}. Your order has been received and is <strong style="color:#1a1a1a">pending confirmation</strong>.<br/>We'll be in touch shortly to confirm availability and arrange payment.</p>
            </div>

            <div style="padding:0 32px 32px">
              <h3 style="font-family:Georgia,serif;font-size:16px;font-weight:400;color:#1a1a1a;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #ede9e1">Your Order</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tbody>${itemsHtmlCustomer}</tbody>
              </table>

              <table style="width:100%;border-collapse:collapse;max-width:260px;margin-left:auto">
                <tr><td style="padding:5px 8px;font-size:12px;color:#999">Subtotal</td><td style="padding:5px 8px;text-align:right;font-size:12px;color:#666">$${subtotal}</td></tr>
                <tr><td style="padding:5px 8px;font-size:12px;color:#999">Tax</td><td style="padding:5px 8px;text-align:right;font-size:12px;color:#666">$${tax}</td></tr>
                <tr><td style="padding:5px 8px;font-size:12px;color:#999">Delivery (${zone})</td><td style="padding:5px 8px;text-align:right;font-size:12px;color:#666">$${delivery}</td></tr>
                <tr><td style="padding:5px 8px;font-size:12px;color:#999">Tips</td><td style="padding:5px 8px;text-align:right;font-size:12px;color:#666">$${(parseFloat(chefTip)+parseFloat(driverTip)).toFixed(2)}</td></tr>
                <tr style="border-top:1px solid #D4AF37">
                  <td style="padding:10px 8px;font-size:15px;font-family:Georgia,serif">Total</td>
                  <td style="padding:10px 8px;text-align:right;font-size:17px;font-family:Georgia,serif;color:#D4AF37;font-weight:600">$${total}</td>
                </tr>
              </table>

              <div style="margin-top:28px;background:#faf9f5;border-left:3px solid #D4AF37;padding:16px 20px">
                <p style="font-size:13px;color:#666;margin:0;line-height:1.6">
                  <strong style="color:#1a1a1a">Next steps:</strong> We will review your order and send you a separate confirmation email with payment instructions. Your order is not final until payment is received.
                </p>
              </div>

              <div style="margin-top:24px;text-align:center">
                <p style="font-size:13px;color:#888">Questions? Reply to this email or contact us directly.</p>
              </div>
            </div>

            <div style="background:#1a1a1a;padding:20px 32px;text-align:center">
              <p style="font-size:11px;color:rgba(255,255,255,.3);margin:0;letter-spacing:1px">CHEFALEH · PRIVATE CHEF DELIVERY</p>
            </div>
          </div>
        `,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
