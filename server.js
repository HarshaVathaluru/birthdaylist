require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db'); // Initializes DB
const emailService = require('./services/emailService');

// Import routes
const authRoutes = require('./routes/auth');
const birthdaysRoutes = require('./routes/birthdays');
const recipientsRoutes = require('./routes/recipients');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { router: messagesRoutes, purgeOldMessages } = require('./routes/messages');

const circleMembersRoutes = require('./routes/circleMembers');

// HTML Routes
app.get(['/intent', '/our-intent', '/intent.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intent.html'));
});

app.get(['/chat', '/circle-chat', '/chat.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
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

// Start Cron Job & 3-Day Message Auto-Clear Policy
emailService.startCronJob();
purgeOldMessages();
setInterval(purgeOldMessages, 60 * 60 * 1000); // Check and purge expired messages hourly

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Endpoints available at http://localhost:${PORT}/api`);
});
