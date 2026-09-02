const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/memories - Fetch all memories
router.get('/', (req, res) => {
  try {
    const memories = db.prepare('SELECT * FROM memories ORDER BY created_at DESC').all();
    res.json(memories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/memories - Add a new memory
router.post('/', (req, res) => {
  const { title, category, caption, author_name, date_str, photo_data, badge_tag } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Memory title is required' });
  }

  const memoryTitle = title.trim().slice(0, 100);
  const memoryCategory = (category || 'celebrations').toLowerCase().trim();
  const memoryCaption = (caption || '').trim().slice(0, 600);
  const memoryAuthor = (author_name || 'Circle Member').trim().slice(0, 50);
  const memoryDate = (date_str || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })).trim();
  const memoryPhoto = photo_data || null;
  const memoryBadge = (badge_tag || 'TEAM HIGHLIGHT').trim().toUpperCase().slice(0, 30);

  try {
    const stmt = db.prepare(`
      INSERT INTO memories (title, category, caption, author_name, date_str, photo_data, badge_tag)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(memoryTitle, memoryCategory, memoryCaption, memoryAuthor, memoryDate, memoryPhoto, memoryBadge);
    const newMemory = db.prepare('SELECT * FROM memories WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newMemory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/memories/purge/older-than?days=30
router.delete('/purge/older-than', (req, res) => {
  const days = parseInt(req.query.days || req.body.days, 10) || 30;
  try {
    const result = db.prepare(`DELETE FROM memories WHERE created_at < datetime('now', '-' || ? || ' days')`).run(days);
    res.json({
      purgedCount: result.changes,
      message: `Successfully deleted ${result.changes} memory/memories older than ${days} days.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/memories/purge/all
router.delete('/purge/all', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM memories').run();
    res.json({
      purgedCount: result.changes,
      message: `Successfully deleted all ${result.changes} memories.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/memories/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM memories WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json({ message: 'Memory deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

