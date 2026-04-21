const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../db/database');

const router = express.Router();
router.use(authMiddleware);

// GET /api/settings
router.get('/', (req, res) => {
  const db = getDb();
  const settings = db.prepare(
    'SELECT home_stop_id, notifications_enabled, language FROM user_settings WHERE user_id = ?'
  ).get(req.userId);

  res.json({ settings: settings || {} });
});

// PUT /api/settings
router.put('/', [
  body('home_stop_id').optional({ nullable: true }).trim().isLength({ max: 20 }).escape(),
  body('notifications_enabled').optional().isBoolean(),
  body('language').optional().isIn(['it', 'en']),
  body('api_key_atv').optional({ nullable: true }).trim().isLength({ max: 100 }).escape(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { home_stop_id, notifications_enabled, language, api_key_atv } = req.body;
  const db = getDb();

  db.prepare(
    `INSERT INTO user_settings (user_id, home_stop_id, notifications_enabled, language, api_key_atv)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       home_stop_id = excluded.home_stop_id,
       notifications_enabled = excluded.notifications_enabled,
       language = excluded.language,
       api_key_atv = excluded.api_key_atv`
  ).run(
    req.userId,
    home_stop_id ?? null,
    notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : 1,
    language ?? 'it',
    api_key_atv ?? null,
  );

  res.json({ success: true });
});

module.exports = router;
