const express = require('express');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../db/database');

const router = express.Router();
router.use(authMiddleware);

const taskValidation = [
  body('title').trim().isLength({ min: 1, max: 100 }).escape()
    .withMessage('Il titolo è obbligatorio (max 100 caratteri).'),
  body('description').optional().trim().isLength({ max: 500 }).escape(),
  body('due_date').optional({ nullable: true }).isISO8601().withMessage('Data non valida.'),
  body('priority').isIn(['bassa', 'media', 'alta']).withMessage('Priorità non valida.'),
  body('category').isIn(['scuola', 'personale', 'viaggio', 'lavoro']).withMessage('Categoria non valida.'),
];

// GET /api/tasks
router.get('/', (req, res) => {
  const db = getDb();
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.userId);
  res.json({ tasks });
});

// POST /api/tasks
router.post('/', taskValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { title, description = '', due_date = null, priority = 'media', category = 'personale' } = req.body;
  const db = getDb();

  const result = db.prepare(
    `INSERT INTO tasks (user_id, title, description, due_date, priority, category)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.userId, title, description, due_date, priority, category);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ task });
});

// PUT /api/tasks/:id
router.put('/:id', [
  param('id').isInt({ min: 1 }),
  ...taskValidation,
  body('status').optional().isIn(['in_corso', 'completato']),
  body('completion_notes').optional().trim().isLength({ max: 500 }).escape(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const db = getDb();
  const task = db.prepare(
    'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);

  if (!task) return res.status(404).json({ error: 'Attività non trovata.' });

  const { title, description, due_date, priority, category, status, completion_notes } = req.body;

  db.prepare(
    `UPDATE tasks SET title=?, description=?, due_date=?, priority=?, category=?,
     status=?, completion_notes=?, updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(title, description ?? '', due_date ?? null, priority, category,
        status ?? 'in_corso', completion_notes ?? '', req.params.id, req.userId);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', param('id').isInt({ min: 1 }), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'ID non valido.' });

  const db = getDb();
  const result = db.prepare(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.userId);

  if (result.changes === 0) return res.status(404).json({ error: 'Attività non trovata.' });
  res.json({ success: true });
});

module.exports = router;
