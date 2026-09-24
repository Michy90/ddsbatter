// ============================================================
// ORDER ROUTES — DD's Batter
// Multi-step order form: cake | cupcake | small_chops | custom
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { sendOrderAlert } = require('../mailer');

// ── Step 1: Choose product type ──────────────────────────────
router.get('/', (req, res) => {
  res.render('order/step1', { title: 'Place an Order', error: null });
});

// ── Step 2a: Cake form ───────────────────────────────────────
router.get('/cake', (req, res) => {
  res.render('order/cake', { title: 'Order a Cake', errors: [], old: {} });
});

// ── Step 2b: Cupcake form ────────────────────────────────────
router.get('/cupcakes', (req, res) => {
  res.render('order/cupcakes', { title: 'Order Cupcakes', errors: [], old: {} });
});

// ── Step 2c: Small Chops form ────────────────────────────────
router.get('/small-chops', (req, res) => {
  res.render('order/small-chops', { title: 'Order Small Chops', errors: [], old: {} });
});

// ── Step 2d: Custom Cake form ────────────────────────────────
router.get('/custom', (req, res) => {
  res.render('order/custom', { title: 'Custom Cake Order', errors: [], old: {} });
});

// ── POST: Submit any order ───────────────────────────────────
router.post('/submit', async (req, res) => {
  const body = req.body;
  const errors = [];

  // ── Validate shared fields ───────────────────────────────
  if (!body.customer_name?.trim())  errors.push('Your name is required.');
  if (!body.customer_email?.trim()) errors.push('Your email is required.');
  if (!body.customer_phone?.trim()) errors.push('Your phone number is required.');
  if (!body.product_type)           errors.push('Product type is missing.');
  if (!body.delivery_method)        errors.push('Please select pickup or delivery.');
  if (body.delivery_method === 'delivery' && !body.delivery_address?.trim())
    errors.push('Delivery address is required.');

  // ── Validate event date (min 3 days ahead) ───────────────
  if (!body.event_date) {
    errors.push('Event date is required.');
  } else {
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(body.event_date);
    const diffDays  = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 3) errors.push('Orders must be placed at least 3 days in advance.');
  }

  // ── Product-specific validation ──────────────────────────
  if (body.product_type === 'cake' || body.product_type === 'cupcake') {
    if (!body.size)       errors.push('Please select a size.');
    if (!body.flavor)     errors.push('Please select a flavor.');
    if (!body.icing_type) errors.push('Please select an icing type.');
  }

  if (body.product_type === 'small_chops') {
    // at least one item must have qty > 0
    const items = buildSmallChopsItems(body);
    if (items.length === 0) errors.push('Please select at least one small chops item.');
  }

  if (body.product_type === 'custom') {
    if (!body.custom_details?.trim()) errors.push('Please describe your custom cake.');
  }

  if (errors.length > 0) {
    return res.render(`order/${body.product_type === 'small_chops' ? 'small-chops' : body.product_type}`, {
      title: 'Place an Order',
      errors,
      old: body
    });
  }

  // ── Build order ref ──────────────────────────────────────
  const ref = 'DDB-' + Date.now().toString(36).toUpperCase();

  // ── Build small chops JSON ───────────────────────────────
  let items_json = null;
  if (body.product_type === 'small_chops') {
    items_json = JSON.stringify(buildSmallChopsItems(body));
  }

  // ── Insert into DB ───────────────────────────────────────
  const stmt = db.prepare(`
    INSERT INTO orders (
      order_ref, customer_name, customer_email, customer_phone,
      product_type, size, flavor, icing_type, icing_color, layers,
      items_json, custom_details, quantity, serves, inscription,
      special_notes, delivery_method, delivery_address, event_date
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const result = stmt.run(
    ref,
    body.customer_name.trim(),
    body.customer_email.trim().toLowerCase(),
    body.customer_phone.trim(),
    body.product_type,
    body.size        || null,
    body.flavor      || null,
    body.icing_type  || null,
    body.icing_color || null,
    body.layers      || null,
    items_json,
    body.custom_details  || null,
    parseInt(body.quantity) || 1,
    body.serves      || null,
    body.inscription || null,
    body.special_notes   || null,
    body.delivery_method,
    body.delivery_address || null,
    body.event_date
  );

  // ── Send email alert ─────────────────────────────────────
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  try {
    await sendOrderAlert(order);
  } catch (e) {
    console.error('Email alert failed:', e.message);
    // Don't block the user if email fails
  }

  res.redirect(`/order/confirmation/${ref}`);
});

// ── Confirmation page ────────────────────────────────────────
router.get('/confirmation/:ref', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(req.params.ref);
  if (!order) return res.redirect('/');
  res.render('order/confirmation', { title: 'Order Received!', order });
});

// ── Helper: parse small chops selections from form body ──────
function buildSmallChopsItems(body) {
  const items = [];
  const chopsItems = [
    'chicken_samosa', 'beef_samosa', 'veggie_samosa',
    'chicken_spring_roll', 'beef_spring_roll', 'veggie_spring_roll',
    'chicken_puff', 'beef_puff', 'veggie_puff',
    'chicken_pie', 'meat_pie'
  ];

  for (const item of chopsItems) {
    const qty = parseInt(body[`qty_${item}`]) || 0;
    if (qty > 0) {
      const entry = { name: item.replace(/_/g, ' '), qty };
      if (body[`spice_${item}`]) entry.spice = body[`spice_${item}`];
      items.push(entry);
    }
  }
  return items;
}

module.exports = router;
