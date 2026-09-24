// ============================================================
// ADMIN ROUTES — DD's Batter
// Login, dashboard, order management
// ============================================================

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../database');
const { requireAdmin } = require('../middleware/adminAuth');

// ── Login page ───────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin/orders');
  res.render('admin/login', { title: 'Admin Login', error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password.' });
  }
  req.session.adminId       = admin.id;
  req.session.adminUsername = admin.username;
  res.redirect('/admin/orders');
});

// ── Logout ───────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── Orders dashboard ─────────────────────────────────────────
router.get('/orders', requireAdmin, (req, res) => {
  const filter = req.query.status || 'all';
  const search = req.query.search || '';

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (filter !== 'all') {
    query += ' AND status = ?';
    params.push(filter);
  }
  if (search.trim()) {
    query += ' AND (customer_name LIKE ? OR order_ref LIKE ? OR customer_phone LIKE ?)';
    const s = `%${search.trim()}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY created_at DESC';

  const orders = db.prepare(query).all(...params);

  // Counts for tabs
  const counts = db.prepare(`
    SELECT status, COUNT(*) as cnt FROM orders GROUP BY status
  `).all().reduce((acc, r) => { acc[r.status] = r.cnt; return acc; }, {});
  counts.all = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;

  res.render('admin/orders', {
    title: 'Admin — Orders',
    orders, filter, search, counts
  });
});

// ── Order detail ─────────────────────────────────────────────
router.get('/orders/:id', requireAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.redirect('/admin/orders');

  let items = [];
  if (order.items_json) {
    try { items = JSON.parse(order.items_json); } catch (e) {}
  }

  res.render('admin/order-detail', { title: `Order #${order.order_ref}`, order, items });
});

// ── Update order status ──────────────────────────────────────
router.post('/orders/:id/status', requireAdmin, (req, res) => {
  const { status, admin_notes } = req.body;
  const validStatuses = ['pending', 'confirmed', 'in_progress', 'ready', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.redirect('/admin/orders');

  db.prepare('UPDATE orders SET status = ?, admin_notes = ? WHERE id = ?')
    .run(status, admin_notes || null, req.params.id);

  res.redirect(`/admin/orders/${req.params.id}`);
});

module.exports = router;
