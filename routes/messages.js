const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * 3-Day (72-Hour) Auto-Clear Policy:
 * Purges any message whose created_at is older than 3 days.
 */
function purgeOldMessages() {
  try {
    const result = db.prepare("DELETE FROM messages WHERE created_at < datetime('now', '-3 days')").run();
    if (result.changes > 0) {
      console.log(`[Auto-Clear Policy] Purged ${result.changes} expired message(s) older than 3 days.`);
    }
  } catch (err) {
    console.error('[Auto-Clear Policy] Error purging old messages:', err);
  }
}

// GET /api/messages - Fetch active messages within 3-day window
router.get('/', (req, res) => {
  try {
    purgeOldMessages();
    const messages = db.prepare(`
      SELECT id, sender_name, message_text, reply_to_id, reply_to_name, reply_to_text, created_at 
      FROM messages 
      ORDER BY created_at ASC
    `).all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages - Send a new message or reply
router.post('/', (req, res) => {
  const { name, message, reply_to_id, reply_to_name, reply_to_text } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const senderName = name.trim().slice(0, 60);
  const messageText = message.trim().slice(0, 1000);
  const replyId = reply_to_id ? Number(reply_to_id) : null;
  const replyName = reply_to_name ? String(reply_to_name).slice(0, 60) : null;
  const replyText = reply_to_text ? String(reply_to_text).slice(0, 150) : null;

  try {
    purgeOldMessages();
    const stmt = db.prepare('INSERT INTO messages (sender_name, message_text, reply_to_id, reply_to_name, reply_to_text) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(senderName, messageText, replyId, replyName, replyText);
    const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/messages/:id - Delete a single message
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  try {
    const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Message not found' });
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(id);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/messages - Purge all messages (Admin)
router.delete('/', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM messages').run();
    res.json({ success: true, count: result.changes, message: `Cleared ${result.changes} message(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, purgeOldMessages };
