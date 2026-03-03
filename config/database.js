const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../pos.db'));

const initDB = () => {
  db.serialize(async () => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT,
      role TEXT CHECK(role IN ('ADMIN', 'CASHIER'))
    )`);

    // Products Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL CHECK(price > 0),
      quantity INTEGER NOT NULL CHECK(quantity >= 0),
      category TEXT,
      barcode TEXT UNIQUE
    )`);

    // Sales Table
    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total REAL NOT NULL,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // SaleItems Table
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )`);

    // Seed Data
    const hash = await bcrypt.hash('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, passwordHash, role) VALUES ('admin', ?, 'ADMIN')`, [hash]);
    
    const cashierHash = await bcrypt.hash('cashier123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, passwordHash, role) VALUES ('cashier', ?, 'CASHIER')`, [cashierHash]);

    const products = [];

    products.forEach(p => {
      db.run(`INSERT OR IGNORE INTO products (name, price, quantity, category, barcode) VALUES (?, ?, ?, ?, ?)`, p);
    });
  });
};

// Promisified query helper
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = { db, initDB, query, run };
