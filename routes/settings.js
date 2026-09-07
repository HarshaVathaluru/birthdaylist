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
  try {
    const config = emailService.getEmailConfig();
    const hasBrevo = !!(config.brevoApiKey && config.brevoApiKey.startsWith('xkeysib-'));
    const hasResend = !!(config.resendApiKey && config.resendApiKey.startsWith('re_'));
    const hasSmtp = !!(config.host && config.user && config.pass);

    let providerLabel = 'Gmail SMTP Direct';
    if (config.provider === 'brevo') {
      providerLabel = '⚡ Brevo Cloud REST API (HTTPS Port 443 — Domain-Free)';
    } else if (config.provider === 'resend') {
      providerLabel = '⚡ Resend Cloud API (HTTPS Port 443)';
    }

    res.json({
      provider: config.provider,
      providerLabel: providerLabel,
      from_email: config.fromEmail,
      from_name: config.fromName,
      has_key: hasBrevo || hasResend,
      key_preview: hasBrevo ? `xkeysib-••••••••${config.brevoApiKey.slice(-4)}` : (hasResend ? `re_••••••••${config.resendApiKey.slice(-4)}` : (hasSmtp ? 'SMTP App Password Loaded' : 'None')),
      source: 'Stored securely in .env / Environment Variables',
      status: (hasBrevo || hasResend || hasSmtp) ? 'Connected & Active' : 'Pending Configuration'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    if (updates.resend_api_key !== undefined) {
      const keyVal = String(updates.resend_api_key).trim();
      process.env.RESEND_API_KEY = keyVal;
      if (keyVal.startsWith('xkeysib-')) {
        process.env.BREVO_API_KEY = keyVal;
      }
    }
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
