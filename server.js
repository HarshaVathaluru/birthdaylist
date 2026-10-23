require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./db'); // Initializes DB
const emailService = require('./services/emailService');

// Import routes
const authRoutes = require('./routes/auth');
const birthdaysRoutes = require('./routes/birthdays');
const recipientsRoutes = require('./routes/recipients');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Allows saving high-resolution memory photos & avatars)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static directories
app.use(express.static(path.join(__dirname, 'public')));
const uploadsDir = (db && db.uploadsDir) ? db.uploadsDir : (process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const { router: messagesRoutes, purgeOldMessages } = require('./routes/messages');

const circleMembersRoutes = require('./routes/circleMembers');
const memoriesRoutes = require('./routes/memories');
const aiRoutes = require('./routes/ai');

// HTML Routes
app.get(['/intent', '/our-intent', '/intent.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intent.html'));
});

app.get(['/founder', '/founder.html', '/motive', '/our-motive', '/motive.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'founder.html'));
});

app.get(['/chat', '/circle-chat', '/chat.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get(['/memories', '/memories.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'memories.html'));
});

app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/birthdays', birthdaysRoutes);
app.use('/api/recipients', recipientsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/circle-members', circleMembersRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/ai', aiRoutes);

// Start Cron Job & 3-Day Message Auto-Clear Policy (Runs in persistent servers like Render/VPS)
if (require.main === module && !process.env.VERCEL) {
  emailService.startCronJob();
  purgeOldMessages();
  setInterval(purgeOldMessages, 60 * 60 * 1000); // Check and purge expired messages hourly
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Endpoints available at http://localhost:${PORT}/api`);
  });
}

module.exports = app;
