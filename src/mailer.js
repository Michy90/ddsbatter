// ============================================================
// MAILER MODULE — DD's Batter
// Sends email alert to owner when a new order is placed.
// Configure GMAIL_USER and GMAIL_PASS in .env before hosting.
// ============================================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_PASS || 'your-app-password'
  }
});

/**
 * Send new order notification to the bakery owner.
 * @param {Object} order - the full order object from the DB
 */
async function sendOrderAlert(order) {
  // Parse small chops items if present
  let itemsHtml = '';
  if (order.items_json) {
    try {
      const items = JSON.parse(order.items_json);
      itemsHtml = items.map(i => `<li>${i.name} x${i.qty}${i.spice ? ' — Spice: ' + i.spice : ''}${i.variant ? ' — ' + i.variant : ''}</li>`).join('');
    } catch (e) { itemsHtml = order.items_json; }
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; border: 2px solid #7B1D3A; border-radius: 10px; overflow: hidden;">
      <div style="background: #7B1D3A; padding: 20px; text-align: center;">
        <h1 style="color: #F5ECD7; margin: 0; font-size: 24px;">DD's Batter</h1>
        <p style="color: #E8A4A4; margin: 5px 0 0;">New Order Received!</p>
      </div>
      <div style="padding: 24px; background: #FFF9F2;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #5C3317; width: 40%;">Order Ref</td><td style="padding: 8px;">#${order.order_ref}</td></tr>
          <tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317;">Customer</td><td style="padding: 8px;">${order.customer_name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #5C3317;">Email</td><td style="padding: 8px;">${order.customer_email}</td></tr>
          <tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317;">Phone</td><td style="padding: 8px;">${order.customer_phone}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #5C3317;">Product</td><td style="padding: 8px;">${order.product_type.replace('_', ' ').toUpperCase()}</td></tr>
          ${order.size ? `<tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317;">Size</td><td style="padding: 8px;">${order.size}</td></tr>` : ''}
          ${order.flavor ? `<tr><td style="padding: 8px; font-weight: bold; color: #5C3317;">Flavor</td><td style="padding: 8px;">${order.flavor}</td></tr>` : ''}
          ${order.icing_type ? `<tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317;">Icing</td><td style="padding: 8px;">${order.icing_type} — ${order.icing_color || 'no color specified'}</td></tr>` : ''}
          ${order.layers ? `<tr><td style="padding: 8px; font-weight: bold; color: #5C3317;">Layers</td><td style="padding: 8px;">${order.layers}</td></tr>` : ''}
          ${order.inscription ? `<tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317;">Inscription</td><td style="padding: 8px;">${order.inscription}</td></tr>` : ''}
          ${itemsHtml ? `<tr><td style="padding: 8px; font-weight: bold; color: #5C3317; vertical-align:top;">Items</td><td style="padding: 8px;"><ul style="margin:0;padding-left:16px;">${itemsHtml}</ul></td></tr>` : ''}
          ${order.custom_details ? `<tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317; vertical-align:top;">Custom Details</td><td style="padding: 8px;">${order.custom_details}</td></tr>` : ''}
          <tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317;">Delivery</td><td style="padding: 8px;">${order.delivery_method === 'delivery' ? 'Delivery to: ' + order.delivery_address : 'Pickup'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #5C3317;">Event Date</td><td style="padding: 8px;"><strong>${order.event_date}</strong></td></tr>
          ${order.special_notes ? `<tr style="background:#F5ECD7"><td style="padding: 8px; font-weight: bold; color: #5C3317; vertical-align:top;">Special Notes</td><td style="padding: 8px;">${order.special_notes}</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.SITE_URL || 'http://localhost:3000'}/admin/orders"
             style="background: #7B1D3A; color: #F5ECD7; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View in Admin Dashboard
          </a>
        </div>
      </div>
      <div style="background: #5C3317; padding: 12px; text-align: center;">
        <p style="color: #F5ECD7; margin: 0; font-size: 12px;">DD's Batter — Cakes • Small Chops • Pastries</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"DD's Batter Orders" <${process.env.GMAIL_USER || 'your-email@gmail.com'}>`,
    to:   process.env.NOTIFY_EMAIL || process.env.GMAIL_USER || 'your-email@gmail.com',
    subject: `🎂 New Order #${order.order_ref} — ${order.customer_name}`,
    html
  });
}

module.exports = { sendOrderAlert };
