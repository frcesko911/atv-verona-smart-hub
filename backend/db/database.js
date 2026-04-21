const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/atv.db';

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let db;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

function initDatabase() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      home_stop_id TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date TEXT DEFAULT NULL,
      priority TEXT NOT NULL DEFAULT 'media',
      category TEXT NOT NULL DEFAULT 'personale',
      status TEXT NOT NULL DEFAULT 'in_corso',
      completion_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CHECK (priority IN ('bassa','media','alta')),
      CHECK (category IN ('scuola','personale','viaggio','lavoro')),
      CHECK (status IN ('in_corso','completato'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticket_type TEXT NOT NULL,
      ticket_name TEXT NOT NULL,
      price REAL NOT NULL,
      purchased_at TEXT DEFAULT (datetime('now')),
      valid_from TEXT DEFAULT NULL,
      valid_until TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'attivo',
      qr_data TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CHECK (status IN ('attivo','validato','scaduto'))
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      home_stop_id TEXT DEFAULT NULL,
      notifications_enabled INTEGER DEFAULT 1,
      language TEXT DEFAULT 'it',
      api_key_atv TEXT DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Database inizializzato.');
  return db;
}

module.exports = { getDb, initDatabase };
