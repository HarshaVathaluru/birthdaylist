const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const emailService = require('../services/emailService');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

function normalizeDateStr(dateStr) {
  if (!dateStr) return '01-01';
  let str = String(dateStr).trim().toLowerCase();
  if (!str) return '01-01';

  // 1. Check for month names (e.g., '24 Sep', 'September 24', '24th September 1995', 'Sep-24')
  for (const [mName, mNum] of Object.entries(MONTH_MAP)) {
    const reg = new RegExp('(^|[^a-z])' + mName + '([^a-z]|$)', 'i');
    if (reg.test(str)) {
      const cleaned = str.replace(/(?:st|nd|rd|th)/gi, ' ');
      const nums = cleaned.match(/\d+/g);
      if (nums && nums.length > 0) {
        let day = parseInt(nums[0], 10);
        if (day > 31 && nums.length > 1) day = parseInt(nums[1], 10);
        if (day >= 1 && day <= 31) {
          return String(mNum).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        }
      }
    }
  }

  // 2. Handle ISO date strings (e.g., '1995-09-24T00:00:00.000Z')
  if (str.includes('t')) {
    str = str.split('t')[0];
  }

  // 3. 4-digit compact strings like '0924'
  if (/^\d{4}$/.test(str)) {
    const p1 = parseInt(str.substring(0, 2), 10);
    const p2 = parseInt(str.substring(2, 4), 10);
    if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
      return String(p1).padStart(2, '0') + '-' + String(p2).padStart(2, '0');
    }
  }

  // 4. Split on any separator: '-', '/', '.', or whitespace
  const parts = str.split(/[-/.\s]+/).filter(Boolean).map(p => parseInt(p, 10)).filter(n => !isNaN(n));
  if (parts.length === 0) return '01-01';

  if (parts.length >= 3) {
    let [p1, p2, p3] = parts;
    let month, day;

    if (p1 > 31) {
      // YYYY-MM-DD or YYYY-DD-MM
      if (p2 <= 12 && p3 <= 31) {
        month = p2; day = p3;
      } else if (p3 <= 12 && p2 <= 31) {
        month = p3; day = p2;
      } else {
        month = p2; day = p3;
      }
    } else if (p3 > 31) {
      // DD-MM-YYYY or MM-DD-YYYY
      if (p1 > 12 && p2 <= 12) {
        day = p1; month = p2;
      } else if (p2 > 12 && p1 <= 12) {
        month = p1; day = p2;
      } else {
        day = p1; month = p2;
      }
    } else {
      month = p1; day = p2;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }
  } else if (parts.length === 2) {
    let [p1, p2] = parts;
    let month, day;
    if (p1 > 12 && p2 <= 12) {
      day = p1; month = p2;
    } else if (p2 > 12 && p1 <= 12) {
      month = p1; day = p2;
    } else {
      month = p1; day = p2;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }
  }

  return '01-01';
}

function calculateDaysUntil(dateStr) {
  if (!dateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const norm = normalizeDateStr(dateStr);
  const [month, day] = norm.split('-').map(Number);
  
  let nextBday = new Date(today.getFullYear(), month - 1, day);
  nextBday.setHours(0, 0, 0, 0);
  
  if (nextBday < today) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBday - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

// Auto-normalize any existing database entries
try {
  const existingList = db.prepare('SELECT id, date FROM birthdays').all();
  for (const row of existingList) {
    const norm = normalizeDateStr(row.date);
    if (norm !== row.date) {
      db.prepare('UPDATE birthdays SET date = ? WHERE id = ?').run(norm, row.id);
    }
  }
} catch (e) {}

// GET all birthdays
router.get('/', (req, res) => {
  const birthdays = db.prepare('SELECT * FROM birthdays').all();
  
  const result = birthdays.map(b => {
    const recipients = db.prepare('SELECT * FROM recipients WHERE birthday_id = ?').all(b.id);
    return {
      ...b,
      date: normalizeDateStr(b.date),
      photo: b.photo ? `/uploads/${b.photo}` : null,
      days_until: calculateDaysUntil(b.date),
      recipients
    };
  });
  
  result.sort((a, b) => a.days_until - b.days_until);
  res.json(result);
});

// GET single birthday
router.get('/:id', (req, res) => {
  const birthday = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(req.params.id);
  if (!birthday) {
    return res.status(404).json({ error: 'Birthday not found' });
  }
  
  const recipients = db.prepare('SELECT * FROM recipients WHERE birthday_id = ?').all(birthday.id);
  res.json({
    ...birthday,
    date: normalizeDateStr(birthday.date),
    photo: birthday.photo ? `/uploads/${birthday.photo}` : null,
    days_until: calculateDaysUntil(birthday.date),
    recipients
  });
});

function parseRecipientsInput(input) {
  if (!input) return [];
  let list = input;
  if (typeof input === 'string') {
    try {
      list = JSON.parse(input);
    } catch (e) {
      list = input.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(list)) return [];

  const results = [];
  for (const item of list) {
    if (!item) continue;
    if (typeof item === 'object' && item.email) {
      const email = String(item.email).trim();
      const name = item.name ? String(item.name).trim() : null;
      if (email && email.includes('@')) results.push({ name, email });
    } else if (typeof item === 'string') {
      const line = item.trim();
      // Match "Name <email@domain.com>"
      const angleMatch = line.match(/^([^<]+)<([^>]+)>$/);
      if (angleMatch) {
        results.push({ name: angleMatch[1].trim(), email: angleMatch[2].trim() });
      } else if (line.includes(',')) {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const p0 = parts[0].trim();
          const p1 = parts[1].trim();
          if (p1.includes('@')) {
            results.push({ name: p0, email: p1 });
          } else if (p0.includes('@')) {
            results.push({ name: p1, email: p0 });
          }
        }
      } else if (line.includes('@')) {
        results.push({ name: null, email: line });
      }
    }
  }
  return results;
}

// POST new birthday
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
  const { name, email, date, remind_days_before, notes, reminder_enabled, recipients } = req.body;
  const photo = req.file ? req.file.filename : null;
  const reminder = reminder_enabled === 'false' || reminder_enabled === '0' ? 0 : 1;
  const normalizedDate = normalizeDateStr(date);
  const celebrantEmail = email ? email.trim() : null;
  const alertDays = parseInt(remind_days_before || 2, 10);

  try {
    const stmt = db.prepare('INSERT INTO birthdays (name, email, date, remind_days_before, photo, notes, reminder_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, celebrantEmail, normalizedDate, alertDays, photo, notes, reminder);
    const birthdayId = info.lastInsertRowid;

    if (recipients) {
      const contactList = parseRecipientsInput(recipients);
      const recStmt = db.prepare('INSERT INTO recipients (birthday_id, email, name) VALUES (?, ?, ?)');
      for (const c of contactList) {
        if (c.email) recStmt.run(birthdayId, c.email, c.name);
      }
    }
    
    const newBirthday = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(birthdayId);
    res.status(201).json({
      ...newBirthday,
      date: normalizeDateStr(newBirthday.date),
      days_until: calculateDaysUntil(newBirthday.date)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update birthday
router.put('/:id', authenticateToken, upload.single('photo'), (req, res) => {
  const { name, email, date, remind_days_before, notes, reminder_enabled, recipients } = req.body;
  const id = req.params.id;
  const reminder = reminder_enabled === 'false' || reminder_enabled === '0' ? 0 : 1;
  const normalizedDate = normalizeDateStr(date);
  const celebrantEmail = email ? email.trim() : null;
  const alertDays = parseInt(remind_days_before || 2, 10);
  
  const existing = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Birthday not found' });
  }

  let photo = existing.photo;
  if (req.file) {
    photo = req.file.filename;
    if (existing.photo) {
      const oldPath = path.join(__dirname, '..', 'uploads', existing.photo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  try {
    const stmt = db.prepare('UPDATE birthdays SET name = ?, email = ?, date = ?, remind_days_before = ?, photo = ?, notes = ?, reminder_enabled = ? WHERE id = ?');
    stmt.run(name, celebrantEmail, normalizedDate, alertDays, photo, notes, reminder, id);

    if (recipients !== undefined) {
      db.prepare('DELETE FROM recipients WHERE birthday_id = ?').run(id);
      const contactList = parseRecipientsInput(recipients);
      const recStmt = db.prepare('INSERT INTO recipients (birthday_id, email, name) VALUES (?, ?, ?)');
      for (const c of contactList) {
        if (c.email) recStmt.run(id, c.email, c.name);
      }
    }
    
    const updated = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(id);
    res.json({
      ...updated,
      date: normalizeDateStr(updated.date),
      days_until: calculateDaysUntil(updated.date)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE birthday
router.delete('/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  
  const existing = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Birthday not found' });
  }

  try {
    db.prepare('DELETE FROM birthdays WHERE id = ?').run(id);
    if (existing.photo) {
      const oldPath = path.join(__dirname, '..', 'uploads', existing.photo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST send birthday email with rich HTML template to recipients
router.post('/:id/send-email', async (req, res) => {
  const id = req.params.id;
  const { message } = req.body;

  const birthday = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(id);
  if (!birthday) {
    return res.status(404).json({ error: 'Birthday person not found' });
  }

  const daysUntil = emailService.calculateDaysUntil(birthday.date);
  const result = await emailService.sendBirthdayReminder(birthday, [], daysUntil, message);

  if (result.success) {
    res.json({ success: true, message: `Celebration email dispatched to ${result.recipientCount} recipient${result.recipientCount !== 1 ? 's' : ''}!` });
  } else {
    res.status(500).json({ error: result.error || 'Failed to dispatch email. Please check your Brevo / Cloud API settings in .env.' });
  }
});

// POST bulk import birthdays
router.post('/bulk-import', authenticateToken, (req, res) => {
  const { birthdays } = req.body;
  if (!Array.isArray(birthdays) || birthdays.length === 0) {
    return res.status(400).json({ error: 'Array of birthdays required' });
  }

  try {
    const insertBirthdayStmt = db.prepare(`
      INSERT INTO birthdays (name, email, date, remind_days_before, notes, reminder_enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateBirthdayStmt = db.prepare(`
      UPDATE birthdays 
      SET email = COALESCE(?, email), 
          date = ?, 
          remind_days_before = ?, 
          notes = COALESCE(?, notes), 
          reminder_enabled = ?
      WHERE id = ?
    `);
    const findExistingStmt = db.prepare(`
      SELECT id FROM birthdays 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
         OR (email IS NOT NULL AND email != '' AND LOWER(TRIM(email)) = LOWER(TRIM(?)))
    `);
    const insertRecipientStmt = db.prepare(`
      INSERT INTO recipients (birthday_id, email, name)
      VALUES (?, ?, ?)
    `);

    let importedCount = 0;
    let updatedCount = 0;

    const importTransaction = db.transaction((list) => {
      for (const item of list) {
        if (!item.name || !item.date) continue;
        const name = String(item.name).trim();
        const date = normalizeDateStr(String(item.date).trim());
        const email = item.email ? String(item.email).trim() : null;
        const notes = item.notes ? String(item.notes).trim() : null;
        const alertDays = item.remind_days_before ? parseInt(item.remind_days_before, 10) : (item.advance_days ? parseInt(item.advance_days, 10) : 2);
        const reminder = item.reminder_enabled !== undefined ? (item.reminder_enabled ? 1 : 0) : (item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1);

        const existing = findExistingStmt.get(name, email || '');
        let birthdayId;
        if (existing) {
          updateBirthdayStmt.run(email, date, alertDays, notes, reminder, existing.id);
          birthdayId = existing.id;
          updatedCount++;
        } else {
          const info = insertBirthdayStmt.run(name, email, date, alertDays, notes, reminder);
          birthdayId = info.lastInsertRowid;
          importedCount++;
        }

        if (Array.isArray(item.recipients)) {
          for (const r of item.recipients) {
            const rEmail = typeof r === 'string' ? r.trim() : (r.email ? String(r.email).trim() : '');
            const rName = typeof r === 'object' && r.name ? String(r.name).trim() : null;
            if (rEmail) {
              insertRecipientStmt.run(birthdayId, rEmail, rName);
            }
          }
        } else if (typeof item.recipients === 'string' && item.recipients.trim()) {
          const emails = item.recipients.split(';').map(e => e.trim()).filter(Boolean);
          for (const em of emails) {
            insertRecipientStmt.run(birthdayId, em, null);
          }
        }
      }
    });

    importTransaction(birthdays);
    const total = importedCount + updatedCount;
    res.json({ 
      success: true, 
      count: total, 
      importedCount,
      updatedCount,
      message: `Successfully processed ${total} celebrant record(s) (${importedCount} new, ${updatedCount} updated)!` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET export CSV
router.get('/export/csv', authenticateToken, (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM birthdays ORDER BY name ASC').all();
    const rows = [
      ['Name', 'Email', 'Date', 'AdvanceAlertDays', 'Notes', 'ReminderEnabled'].join(',')
    ];

    for (const b of list) {
      const escapedName = `"${(b.name || '').replace(/"/g, '""')}"`;
      const escapedEmail = `"${(b.email || '').replace(/"/g, '""')}"`;
      const escapedNotes = `"${(b.notes || '').replace(/"/g, '""')}"`;
      const alertDays = b.remind_days_before || 2;
      rows.push([escapedName, escapedEmail, b.date, alertDays, escapedNotes, b.reminder_enabled].join(','));
    }

    const csvContent = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Zenitude_Birthdays.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
