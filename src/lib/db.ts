import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from './constants';

const SOURCE_DB_PATH = path.join(process.cwd(), 'spendsense.db');
const RUNTIME_DB_PATH = path.join(
  process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd(),
  'spendsense-runtime.db'
);
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

function addColumnIfMissing(db: DatabaseSync, table: string, column: string, definition: string) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!info.some((col) => col.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
      console.log(`[db] Migration: Added column ${column} to ${table}`);
    }
  } catch (err) {
    console.error(`[db] Migration error adding ${column} to ${table}:`, err);
  }
}

function initTables(db: DatabaseSync) {
  // ─── Categories Table ────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  addColumnIfMissing(db, 'categories', 'user_id', 'TEXT');

  // Seed default Indian categories (shared, user_id IS NULL)
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL');
  const result = countStmt.get() as { count: number };
  if (!result || result.count === 0) {
    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    for (const cat of DEFAULT_CATEGORIES) {
      insertCat.run(cat);
    }
  }

  // ─── Transactions Table ──────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      payment_method TEXT DEFAULT 'UPI',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  addColumnIfMissing(db, 'transactions', 'user_id', 'TEXT');
  addColumnIfMissing(db, 'transactions', 'payment_method', "TEXT DEFAULT 'UPI'");

  // Indexes (safe to run individually)
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);'); } catch (_) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);'); } catch (_) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);'); } catch (_) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);'); } catch (_) {}

  // ─── Budgets Table ───────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      category TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 0),
      month TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  addColumnIfMissing(db, 'budgets', 'user_id', 'TEXT');

  try { db.exec('CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);'); } catch (_) {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);'); } catch (_) {}
}
