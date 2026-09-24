// ============================================================
// DD's Batter — Main App Entry Point
// ============================================================

require('dotenv').config();

const express     = require('express');
const session     = require('express-session');
const SqliteStore = require('connect-sqlite3')(session);
const path        = require('path');

const app = express();

// ── View Engine ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static Files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sessions ─────────────────────────────────────────────────
app.use(session({
  store: new SqliteStore({ db: 'sessions.db', dir: path.join(__dirname) }),
  secret: process.env.SESSION_SECRET || 'ddsbatter-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Routes ───────────────────────────────────────────────────
const orderRoutes = require('./src/routes/orderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/order', orderRoutes);
app.use('/admin', adminRoutes);

// ── Public Pages ─────────────────────────────────────────────
app.get('/',        (req, res) => res.render('home',    { title: 'Home' }));
app.get('/menu',    (req, res) => res.render('menu',    { title: 'Menu' }));
app.get('/about',   (req, res) => res.render('about',   { title: 'About Us' }));
app.get('/contact', (req, res) => res.render('contact', { title: 'Contact' }));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send(`
    <div style="font-family:Georgia,serif;text-align:center;padding:60px;color:#7B1D3A">
      <h1>404</h1><p>Page not found.</p>
      <a href="/" style="color:#5C3317">← Back to DD's Batter</a>
    </div>
  `);
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎂 DD's Batter is live at http://localhost:${PORT}\n`);
});
