const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const emailService = require('../services/emailService');

// Public preview endpoint for email templates (accessible directly via browser new tab)
router.get('/preview-email', (req, res) => {
  const type = req.query.type || 'intimation';
  const sampleBirthday = {
    name: 'Aarav Sharma',
    date: '09-15',
    notes: 'Loves chocolate truffles, photography & road trips! 🎉',
    photo: null
  };

  let html = '';
  if (type === 'celebrant') {
    html = emailService.generateBirthdayPersonWishEmailHtml(sampleBirthday);
  } else if (type === 'upcoming') {
    html = emailService.generateCircleIntimationEmailHtml(sampleBirthday, 2, 'Maya Patel');
  } else {
    html = emailService.generateCircleIntimationEmailHtml(sampleBirthday, 0, 'Maya Patel');
  }

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Protect remaining settings endpoints
router.use(authenticateToken);

router.get('/', (req, res) => {
  const settingsArray = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  for (const row of settingsArray) {
    settingsObj[row.key] = row.value;
  }
  res.json(settingsObj);
});

router.put('/', (req, res) => {
  const updates = req.body;
  try {
    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    
    const transaction = db.transaction((settings) => {
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, String(value));
      }
    });
    
    transaction(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/test-email', async (req, res) => {
  const { target_email } = req.body;
  try {
    const result = await emailService.sendTestEmail(target_email);
    res.json({ success: true, message: 'Test email dispatched successfully!', info: result });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send test email' });
  }
});

module.exports = router;
