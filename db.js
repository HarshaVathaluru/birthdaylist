const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS birthdays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    photo TEXT,
    notes TEXT,
    reminder_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    birthday_id INTEGER,
    email TEXT NOT NULL,
    name TEXT,
    FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS circle_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_name TEXT NOT NULL,
    message_text TEXT NOT NULL,
    reply_to_id INTEGER,
    reply_to_name TEXT,
    reply_to_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations for reply support
try { db.exec("ALTER TABLE messages ADD COLUMN reply_to_id INTEGER;"); } catch (e) {}
try { db.exec("ALTER TABLE messages ADD COLUMN reply_to_name TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE messages ADD COLUMN reply_to_text TEXT;"); } catch (e) {}

// Automatic admin provisioning (Ensures online deployments like Render have working admin credentials)
function initAdminAccount() {
  try {
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const existing = db.prepare('SELECT * FROM admin WHERE username = ?').get(defaultUsername);

    if (!existing) {
      const passwordHash = bcrypt.hashSync(defaultPassword, 10);
      db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run(defaultUsername, passwordHash);
      console.log(`[Database] Initialized default admin credentials: ${defaultUsername}`);
    } else if (process.env.ADMIN_PASSWORD) {
      const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
      db.prepare('UPDATE admin SET password_hash = ? WHERE username = ?').run(passwordHash, defaultUsername);
    }
  } catch (err) {
    console.error('[Database] Error provisioning admin credentials:', err.message);
  }
}

// Initial default settings initialization (Resend API key + sender email)
function initDefaultSettings() {
  try {
    const insertOrIgnore = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    if (process.env.RESEND_API_KEY) {
      insertOrIgnore.run('resend_api_key', process.env.RESEND_API_KEY);
    }
    insertOrIgnore.run('from_email', process.env.FROM_EMAIL || 'celebrate@zen.ai');
    insertOrIgnore.run('from_name', process.env.FROM_NAME || 'Zenitude Celebrations');
  } catch (err) {
    console.error('[Database] Error provisioning default settings:', err.message);
  }
}

// Initial sample data seeding for fresh instances
function initSampleData() {
  try {
    const birthdayCount = db.prepare('SELECT COUNT(*) as count FROM birthdays').get().count;
    if (birthdayCount === 0) {
      const now = new Date();
      const formatMMDD = (date) => `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const in3Days = new Date(now);
      in3Days.setDate(now.getDate() + 3);
      
      const in7Days = new Date(now);
      in7Days.setDate(now.getDate() + 7);
      
      const in25Days = new Date(now);
      in25Days.setDate(now.getDate() + 25);
      
      const insertBirthday = db.prepare('INSERT INTO birthdays (name, date, notes) VALUES (?, ?, ?)');
      insertBirthday.run('Aarav Sharma', formatMMDD(now), 'Loves chocolate cake & photography 🎉');
      insertBirthday.run('Priya Patel', formatMMDD(in3Days), 'Gift idea: Books or coffee shop gift card');
      insertBirthday.run('Rahul Verma', formatMMDD(in7Days), 'Planning a surprise rooftop dinner');
      insertBirthday.run('Ananya Singh', formatMMDD(in25Days), "Don't forget flowers");
      console.log('[Database] Seeded initial sample birthdays.');
    }
  } catch (err) {
    console.error('[Database] Error seeding sample birthdays:', err.message);
  }
}

initAdminAccount();
initDefaultSettings();
initSampleData();

module.exports = db;
