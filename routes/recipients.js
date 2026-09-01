const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/birthday/:birthdayId', (req, res) => {
  const recipients = db.prepare('SELECT * FROM recipients WHERE birthday_id = ?').all(req.params.birthdayId);
  res.json(recipients);
});

router.post('/', (req, res) => {
  const { birthday_id, email, name } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO recipients (birthday_id, email, name) VALUES (?, ?, ?)');
    const info = stmt.run(birthday_id, email, name);
    res.status(201).json({ id: info.lastInsertRowid, birthday_id, email, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { email, name } = req.body;
  try {
    db.prepare('UPDATE recipients SET email = ?, name = ? WHERE id = ?').run(email, name, req.params.id);
    res.json({ id: req.params.id, email, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM recipients WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
