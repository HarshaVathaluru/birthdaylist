const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('Seeding database...');

// 1. Create default admin
const adminPassword = bcrypt.hashSync('admin123', 10);
try {
  db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run('admin', adminPassword);
  console.log('Admin user created (username: admin, password: admin123)');
} catch (e) {
  if (e.message.includes('UNIQUE constraint failed')) {
    console.log('Admin user already exists.');
  } else {
    console.error('Error creating admin:', e);
  }
}

// 2. Insert sample birthdays relative to today for demo
const now = new Date();
const formatMMDD = (date) => `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const todayDate = formatMMDD(now);

const in3Days = new Date(now);
in3Days.setDate(now.getDate() + 3);
const in3DaysDate = formatMMDD(in3Days);

const in7Days = new Date(now);
in7Days.setDate(now.getDate() + 7);
const in7DaysDate = formatMMDD(in7Days);

const in25Days = new Date(now);
in25Days.setDate(now.getDate() + 25);
const in25DaysDate = formatMMDD(in25Days);

const in60Days = new Date(now);
in60Days.setDate(now.getDate() + 60);
const in60DaysDate = formatMMDD(in60Days);

const birthdays = [
  { name: 'Aarav Sharma', date: todayDate, notes: 'Loves chocolate cake & photography 🎉' },
  { name: 'Priya Patel', date: in3DaysDate, notes: 'Gift idea: Books or coffee shop gift card' },
  { name: 'Rahul Verma', date: in7DaysDate, notes: 'Planning a surprise rooftop dinner' },
  { name: 'Ananya Singh', date: in25DaysDate, notes: "Don't forget flowers" },
  { name: 'Vikram Reddy', date: in60DaysDate, notes: 'Prefers quiet celebration with close friends' }
];

const insertBirthday = db.prepare('INSERT INTO birthdays (name, date, notes) VALUES (?, ?, ?)');
const insertedBdays = [];

// Clear existing to avoid duplicates if run multiple times
db.prepare('DELETE FROM birthdays').run();
db.prepare('DELETE FROM recipients').run();

for (const b of birthdays) {
  const info = insertBirthday.run(b.name, b.date, b.notes);
  insertedBdays.push({ id: info.lastInsertRowid, name: b.name });
}
console.log('Sample birthdays inserted.');

// 3. Insert sample recipients
const insertRecipient = db.prepare('INSERT INTO recipients (birthday_id, email, name) VALUES (?, ?, ?)');
if (insertedBdays.length > 0) {
  insertRecipient.run(insertedBdays[0].id, 'friend1@example.com', 'Rahul (Friend)');
  insertRecipient.run(insertedBdays[0].id, 'family@example.com', 'Sharma Family');
  insertRecipient.run(insertedBdays[1].id, 'colleague@example.com', 'Office Team');
}
console.log('Sample recipients inserted.');

// 4. Insert default settings
const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('smtp_configured', 'false');
insertSetting.run('reminders_enabled', 'true');
console.log('Default settings inserted.');

console.log('Database seeded successfully!');
