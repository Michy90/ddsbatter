// ============================================================
// DATABASE MODULE — DD's Batter
// Central SQLite database. All modules read/write from here.
// ============================================================

const Database = require('better-sqlite3');
const path     = require('path');
const bcrypt   = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'ddsbatter.db');
const db      = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── ORDERS ───────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref       TEXT    NOT NULL UNIQUE,
    customer_name   TEXT    NOT NULL,
    customer_email  TEXT    NOT NULL,
    customer_phone  TEXT    NOT NULL,
    product_type    TEXT    NOT NULL,  -- cake | cupcake | small_chops | custom
    -- Cake / Cupcake fields
    size            TEXT,
    flavor          TEXT,
    icing_type      TEXT,
    icing_color     TEXT,
    layers          TEXT,
    -- Small chops fields
    items_json      TEXT,             -- JSON array of selected items + qty
    -- Custom cake fields
    custom_details  TEXT,
    -- Shared
    quantity        INTEGER DEFAULT 1,
    serves          TEXT,
    inscription     TEXT,
    special_notes   TEXT,
    delivery_method TEXT    NOT NULL, -- pickup | delivery
    delivery_address TEXT,
    event_date      TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending',
    -- pending | confirmed | in_progress | ready | delivered | cancelled
    admin_notes     TEXT,
    created_at      TEXT    DEFAULT (datetime('now'))
  )
`);

// ── ADMIN ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Seed default admin if none exists
const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('ddsadmin');
if (!existingAdmin) {
  const hashed = bcrypt.hashSync('DDs@2024!', 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('ddsadmin', hashed);
  console.log('✅ Default admin created — username: ddsadmin  password: DDs@2024!');
}

module.exports = db;
