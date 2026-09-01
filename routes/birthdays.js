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

function calculateDaysUntil(monthDayStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [month, day] = monthDayStr.split('-').map(Number);
  
  let nextBday = new Date(today.getFullYear(), month - 1, day);
  
  if (nextBday < today) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBday - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

// GET all birthdays
router.get('/', (req, res) => {
  const birthdays = db.prepare('SELECT * FROM birthdays').all();
  
  const result = birthdays.map(b => {
    const recipients = db.prepare('SELECT * FROM recipients WHERE birthday_id = ?').all(b.id);
    return {
      ...b,
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
  const { name, date, notes, reminder_enabled, recipients } = req.body;
  const photo = req.file ? req.file.filename : null;
  const reminder = reminder_enabled === 'false' || reminder_enabled === '0' ? 0 : 1;

  try {
    const stmt = db.prepare('INSERT INTO birthdays (name, date, photo, notes, reminder_enabled) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, date, photo, notes, reminder);
    const birthdayId = info.lastInsertRowid;

    if (recipients) {
      const contactList = parseRecipientsInput(recipients);
      const recStmt = db.prepare('INSERT INTO recipients (birthday_id, email, name) VALUES (?, ?, ?)');
      for (const c of contactList) {
        if (c.email) recStmt.run(birthdayId, c.email, c.name);
      }
    }
    
    const newBirthday = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(birthdayId);
    res.status(201).json(newBirthday);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update birthday
router.put('/:id', authenticateToken, upload.single('photo'), (req, res) => {
  const { name, date, notes, reminder_enabled, recipients } = req.body;
  const id = req.params.id;
  const reminder = reminder_enabled === 'false' || reminder_enabled === '0' ? 0 : 1;
  
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
    const stmt = db.prepare('UPDATE birthdays SET name = ?, date = ?, photo = ?, notes = ?, reminder_enabled = ? WHERE id = ?');
    stmt.run(name, date, photo, notes, reminder, id);

    if (recipients !== undefined) {
      db.prepare('DELETE FROM recipients WHERE birthday_id = ?').run(id);
      const contactList = parseRecipientsInput(recipients);
      const recStmt = db.prepare('INSERT INTO recipients (birthday_id, email, name) VALUES (?, ?, ?)');
      for (const c of contactList) {
        if (c.email) recStmt.run(id, c.email, c.name);
      }
    }
    
    const updated = db.prepare('SELECT * FROM birthdays WHERE id = ?').get(id);
    res.json(updated);
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
    res.json({ success: true, message: `Celebration email dispatched to ${result.recipientCount} circle recipient${result.recipientCount !== 1 ? 's' : ''}!` });
  } else {
    res.status(500).json({ error: result.error || 'Failed to dispatch email. Please check your Resend/SMTP settings in Admin.' });
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
      INSERT INTO birthdays (name, date, notes, reminder_enabled)
      VALUES (?, ?, ?, ?)
    `);
    const insertRecipientStmt = db.prepare(`
      INSERT INTO recipients (birthday_id, email, name)
      VALUES (?, ?, ?)
    `);

    let importedCount = 0;

    const importTransaction = db.transaction((list) => {
      for (const item of list) {
        if (!item.name || !item.date) continue;
        const name = String(item.name).trim();
        const date = String(item.date).trim();
        const notes = item.notes ? String(item.notes).trim() : null;
        const reminder = item.reminder_enabled !== undefined ? (item.reminder_enabled ? 1 : 0) : 1;

        const info = insertBirthdayStmt.run(name, date, notes, reminder);
        const birthdayId = info.lastInsertRowid;
        importedCount++;

        if (Array.isArray(item.recipients)) {
          for (const r of item.recipients) {
            const email = typeof r === 'string' ? r.trim() : (r.email ? String(r.email).trim() : '');
            const rName = typeof r === 'object' && r.name ? String(r.name).trim() : null;
            if (email) {
              insertRecipientStmt.run(birthdayId, email, rName);
            }
          }
        } else if (typeof item.recipients === 'string' && item.recipients.trim()) {
          const emails = item.recipients.split(';').map(e => e.trim()).filter(Boolean);
          for (const email of emails) {
            insertRecipientStmt.run(birthdayId, email, null);
          }
        }
      }
    });

    importTransaction(birthdays);
    res.json({ success: true, count: importedCount, message: `Successfully imported ${importedCount} birthday record(s)!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET export CSV
router.get('/export/csv', authenticateToken, (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM birthdays ORDER BY name ASC').all();
    const rows = [
      ['Name', 'Date', 'Notes', 'ReminderEnabled', 'Recipients'].join(',')
    ];

    for (const b of list) {
      const recs = db.prepare('SELECT email FROM recipients WHERE birthday_id = ?').all(b.id);
      const emailList = recs.map(r => r.email).join('; ');
      const escapedName = `"${(b.name || '').replace(/"/g, '""')}"`;
      const escapedNotes = `"${(b.notes || '').replace(/"/g, '""')}"`;
      const escapedEmails = `"${emailList.replace(/"/g, '""')}"`;
      rows.push([escapedName, b.date, escapedNotes, b.reminder_enabled, escapedEmails].join(','));
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
