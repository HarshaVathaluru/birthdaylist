const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// GET all circle members
router.get('/', (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM circle_members ORDER BY name ASC').all();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add single or batch circle members
router.post('/', authenticateToken, (req, res) => {
  const { name, email, raw_text } = req.body;

  try {
    const insertStmt = db.prepare(`
      INSERT INTO circle_members (name, email)
      VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name
    `);

    let addedCount = 0;

    if (raw_text) {
      const lines = String(raw_text).split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
      const transaction = db.transaction(() => {
        for (const line of lines) {
          const angleMatch = line.match(/^([^<]+)<([^>]+)>$/);
          if (angleMatch) {
            insertStmt.run(angleMatch[1].trim(), angleMatch[2].trim());
            addedCount++;
          } else if (line.includes(',')) {
            const parts = line.split(',');
            if (parts.length >= 2) {
              const p0 = parts[0].trim();
              const p1 = parts[1].trim();
              if (p1.includes('@')) {
                insertStmt.run(p0, p1);
                addedCount++;
              } else if (p0.includes('@')) {
                insertStmt.run(p1, p0);
                addedCount++;
              }
            }
          } else if (line.includes('@')) {
            insertStmt.run(null, line);
            addedCount++;
          }
        }
      });
      transaction();
      return res.json({ success: true, count: addedCount, message: `Saved ${addedCount} circle member(s)` });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    insertStmt.run(name ? String(name).trim() : null, String(email).trim());
    res.json({ success: true, message: 'Circle member added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE circle member
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM circle_members WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

