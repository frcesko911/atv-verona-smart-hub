const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../db/database');
const { getLines } = require('../data/busData');

const router = express.Router();
router.use(authMiddleware);

const LINE_ID_RE = /^[a-zA-Z0-9_-]{1,10}$/;

// Resolve a user's saved line ids into full line objects, ordered by when they
// were added. Lines that no longer exist in the dataset (e.g. after a GTFS
// re-import) are silently dropped.
function favouriteLinesFor(userId) {
  const rows = getDb().prepare(
    'SELECT line_id FROM favourite_lines WHERE user_id = ? ORDER BY created_at, rowid'
  ).all(userId);
  const lines = getLines();
  return rows.map(r => lines.find(l => l.id === r.line_id)).filter(Boolean);
}

// GET /api/favourites/lines — the user's favourite lines
router.get('/lines', (req, res) => {
  res.json({ lines: favouriteLinesFor(req.userId) });
});

// POST /api/favourites/lines — add a line to favourites
router.post('/lines', (req, res) => {
  const { lineId } = req.body;
  if (!lineId || typeof lineId !== 'string' || !LINE_ID_RE.test(lineId)) {
    return res.status(400).json({ error: 'ID linea non valido.' });
  }
  if (!getLines().some(l => l.id === lineId)) {
    return res.status(404).json({ error: 'Linea non trovata.' });
  }

  getDb().prepare(
    'INSERT OR IGNORE INTO favourite_lines (user_id, line_id) VALUES (?, ?)'
  ).run(req.userId, lineId);

  res.json({ lines: favouriteLinesFor(req.userId) });
});

// DELETE /api/favourites/lines/:lineId — remove a line from favourites
router.delete('/lines/:lineId', (req, res) => {
  const { lineId } = req.params;
  if (!LINE_ID_RE.test(lineId)) {
    return res.status(400).json({ error: 'ID linea non valido.' });
  }

  getDb().prepare(
    'DELETE FROM favourite_lines WHERE user_id = ? AND line_id = ?'
  ).run(req.userId, lineId);

  res.json({ lines: favouriteLinesFor(req.userId) });
});

module.exports = router;
