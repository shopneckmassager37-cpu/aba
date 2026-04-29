import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, address, zone, cart, subtotal, tax, delivery, driverTip, chefTip, total, notes } = req.body;

  const itemsHtml = (cart || [])
    .map(i => `<tr><td style="padding:4px 8px">${i.name}</td><td style="padding:4px 8px">×${i.qty}</td><td style="padding:4px 8px">$${(i.price * i.qty).toFixed(2)}</td></tr>`)
    .join('');

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'danielgitlin2011@gmail.com',
      subject: `New Chefaleh Order — ${name}`,
      html: `
        <h2 style="font-family:Georgia,serif">New Order from ${name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Zone:</strong> ${zone}</p>
        <hr/>
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
          <thead><tr style="background:#f5f5f5"><th style="padding:4px 8px;text-align:left">Item</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <hr/>
        <p>Subtotal: $${subtotal} &nbsp;|&nbsp; Tax: $${tax} &nbsp;|&nbsp; Delivery (${zone}): $${delivery}</p>
        <p>Driver Tip: $${driverTip} &nbsp;|&nbsp; Chef Tip: $${chefTip}</p>
        <p><strong>Total: $${total}</strong></p>
        ${notes ? `<hr/><p><strong>Notes:</strong> ${notes}</p>` : ''}
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
