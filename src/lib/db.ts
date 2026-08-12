import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from './constants';

const SOURCE_DB_PATH = path.join(process.cwd(), 'spendsense.db');
const RUNTIME_DB_PATH = path.join('/tmp', 'spendsense.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    if (!fs.existsSync(RUNTIME_DB_PATH)) {
      fs.copyFileSync(SOURCE_DB_PATH, RUNTIME_DB_PATH);
    }

    dbInstance = new DatabaseSync(RUNTIME_DB_PATH);

    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initTables(dbInstance);
  }

  return dbInstance;
}

export { DEFAULT_CATEGORIES, PAYMENT_METHODS };

function initTables(db: DatabaseSync) {
  // Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default Indian categories if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM categories');
  const result = countStmt.get() as { count: number };
  if (!result || result.count === 0) {
    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    for (const cat of DEFAULT_CATEGORIES) {
      insertCat.run(cat);
    }
  }

  // Transactions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      payment_method TEXT DEFAULT 'UPI',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `);

  // Migration check: Add payment_method column if existing database table lacks it
  try {
    const tableInfo = db.prepare("PRAGMA table_info(transactions)").all() as Array<{ name: string }>;
    const hasPaymentMethod = tableInfo.some((col) => col.name === 'payment_method');
    if (!hasPaymentMethod) {
      db.exec("ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'UPI';");
    }
  } catch (err) {
    // Ignore migration error if table created fresh
  }

  // Budgets Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 0),
      month TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, month)
    );
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
  `);
}
