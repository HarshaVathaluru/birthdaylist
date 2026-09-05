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
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    
    const transaction = db.transaction((settings) => {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined && value !== null) {
          stmt.run(key, String(value).trim());
        }
      }
    });
    
    transaction(updates);

    // Sync in-memory environment variables immediately
    if (updates.resend_api_key) process.env.RESEND_API_KEY = String(updates.resend_api_key).trim();
    if (updates.from_email) process.env.FROM_EMAIL = String(updates.from_email).trim();
    if (updates.from_name) process.env.FROM_NAME = String(updates.from_name).trim();
    if (updates.smtp_host) process.env.SMTP_HOST = String(updates.smtp_host).trim();
    if (updates.smtp_port) process.env.SMTP_PORT = String(updates.smtp_port).trim();
    if (updates.smtp_user) process.env.SMTP_USER = String(updates.smtp_user).trim();
    if (updates.smtp_pass) process.env.SMTP_PASS = String(updates.smtp_pass).trim();

    res.json({ success: true, message: 'Settings saved and activated successfully!' });
  } catch (err) {
    console.error('[Settings PUT Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

router.post('/test-email', async (req, res) => {
  const { target_email } = req.body || {};
  try {
    const result = await emailService.sendTestEmail(target_email);
    res.json({ success: true, message: 'Test email dispatched successfully!', info: result });
  } catch (err) {
    console.error('[Settings Test Email Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to send test email' });
  }
});

module.exports = router;
