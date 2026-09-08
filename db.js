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
    email TEXT,
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

  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'celebrations',
    caption TEXT,
    author_name TEXT,
    date_str TEXT,
    photo_data TEXT,
    badge_tag TEXT,
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

// Initial default settings initialization (Brevo / Resend API key + sender email)
function initDefaultSettings() {
  try {
    const insertOrReplace = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
    const defaultKey = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || '';
    if (defaultKey) {
      insertOrReplace.run('resend_api_key', defaultKey);
      insertOrReplace.run('brevo_api_key', defaultKey);
    }
    insertOrReplace.run('from_email', process.env.FROM_EMAIL || 'zenitudecelebrations@gmail.com');
    insertOrReplace.run('from_name', process.env.FROM_NAME || 'Zenitude Celebrations');
    insertOrReplace.run('smtp_host', process.env.SMTP_HOST || 'smtp.gmail.com');
    insertOrReplace.run('smtp_port', process.env.SMTP_PORT || '465');
    insertOrReplace.run('smtp_user', process.env.SMTP_USER || 'zenitudecelebrations@gmail.com');
    if (process.env.SMTP_PASS) {
      insertOrReplace.run('smtp_pass', process.env.SMTP_PASS);
    }
  } catch (err) {
    console.error('[Database] Error provisioning default settings:', err.message);
  }
}

// Initial sample data seeding for fresh instances
function initSampleData() {
  try {
    // Note: Fake birthdays are never seeded to ensure only genuine user-added birthdays exist.

    const memoryCount = db.prepare('SELECT COUNT(*) as count FROM memories').get().count;
    if (memoryCount === 0) {
      const insertMemory = db.prepare('INSERT INTO memories (title, category, caption, author_name, date_str, photo_data, badge_tag) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insertMemory.run('Workspace Celebration & Cake Toast', 'celebrations', 'The whole circle gathered together to share delicious cake, joyful memories, and heartfelt wishes.', 'Circle Member', 'Sept 2026', null, 'BIRTHDAY SURPRISE');
      insertMemory.run('Q3 Milestone Breakthrough Celebration', 'milestones', "Celebrating the team's record milestone achievement with celebratory cheers and virtual circle shoutouts.", 'Karan Mehta', 'August 2026', null, 'PRODUCT LAUNCH');
      insertMemory.run('Autumn Circle Meet & Gratitude Circle', 'gatherings', 'A cozy evening reflecting on personal growth, milestones, and sharing genuine appreciation across our teams.', 'Rohan Verma', 'July 2026', null, 'TEAM GATHERING');
      insertMemory.run("Priya's Milestone Welcome & Cake Party", 'celebrations', 'Welcoming Priya to our workspace family with personalized celebration notes and cupcakes.', 'Ananya Singh', 'June 2026', null, 'ANNUAL GALA');
      console.log('[Database] Seeded initial sample memories.');
    }

    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
    if (messageCount === 0) {
      const insertMsg = db.prepare("INSERT INTO messages (sender_name, message_text, created_at) VALUES (?, ?, datetime('now'))");
      insertMsg.run('Maya Patel', 'Wishing a wonderful and joyful Birthday to Aarav! 🎂🎉 May this year bring happiness, success, and many memorable moments!');
      insertMsg.run('Rohan Verma', 'Happy Birthday Aarav! 🥳 Have a great day and enjoy the celebrations!');
      insertMsg.run('Ananya Singh', 'Warmest birthday wishes from all of us! 🌟✨ Let’s celebrate together!');
      console.log('[Database] Seeded initial celebration messages for today.');
    }

    const memberCount = db.prepare('SELECT COUNT(*) as count FROM circle_members').get().count;
    if (memberCount === 0) {
      const insertMember = db.prepare("INSERT OR IGNORE INTO circle_members (name, email) VALUES (?, ?)");
      insertMember.run('Zenitude Team Circle', process.env.FROM_EMAIL || 'zenitudecelebrations@gmail.com');
      console.log('[Database] Seeded default circle member.');
    }
  } catch (err) {
    console.error('[Database] Error seeding sample data:', err.message);
  }
}

// Migration: Ensure birthdays table has email and remind_days_before columns
try {
  db.exec("ALTER TABLE birthdays ADD COLUMN email TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE birthdays ADD COLUMN remind_days_before INTEGER DEFAULT 2;");
} catch (e) {}

initAdminAccount();
initDefaultSettings();
initSampleData();

module.exports = db;
