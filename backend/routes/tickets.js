const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../db/database');
const { TICKET_CATALOG } = require('../data/tickets');
const { EXTRAURBAN_FARES, resolveFare } = require('../data/fares');

const router = express.Router();
router.use(authMiddleware);

// Everything a user is allowed to buy: the listed catalog plus the
// extraurban fare tiers issued through the fare calculator.
const PURCHASABLE = [...TICKET_CATALOG, ...EXTRAURBAN_FARES];

// GET /api/tickets/catalog — public catalog of available tickets
router.get('/catalog', (req, res) => {
  res.json({ catalog: TICKET_CATALOG });
});

// GET /api/tickets/fare?from=<city>&to=<city> — resolve the correct
// extraurban fare for a trip, used by the route planner's fare calculator.
router.get('/fare', (req, res) => {
  const { from, to } = req.query;
  const result = resolveFare(from, to);
  res.json({ fare: result.fare || null, reason: result.reason || null });
});

// GET /api/tickets — user's ticket wallet
router.get('/', (req, res) => {
  const db = getDb();
  const tickets = db.prepare(
    'SELECT * FROM tickets WHERE user_id = ? ORDER BY purchased_at DESC'
  ).all(req.userId);
  res.json({ tickets });
});

// POST /api/tickets — purchase a ticket
router.post('/', [
  body('ticket_type').trim().isLength({ min: 1, max: 50 }).escape()
    .withMessage('Tipo biglietto non valido.'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { ticket_type } = req.body;
  const ticketDef = PURCHASABLE.find(t => t.type === ticket_type);
  if (!ticketDef) return res.status(400).json({ error: 'Tipo biglietto non trovato nel catalogo.' });

  const db = getDb();
  const ticketId = uuidv4();
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = ticketDef.validityMinutes
    ? new Date(now.getTime() + ticketDef.validityMinutes * 60000).toISOString()
    : null;

  // QR data encodes ticket identity — not payment data
  const qrData = JSON.stringify({
    id: ticketId,
    type: ticket_type,
    userId: req.userId,
    issuedAt: validFrom,
  });

  const result = db.prepare(
    `INSERT INTO tickets (user_id, ticket_type, ticket_name, price, valid_from, valid_until, qr_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.userId, ticket_type, ticketDef.name, ticketDef.price, validFrom, validUntil, qrData);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ticket });
});

// PUT /api/tickets/:id/validate — mark ticket as validated
router.put('/:id/validate', param('id').isInt({ min: 1 }), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'ID non valido.' });

  const db = getDb();
  const ticket = db.prepare(
    'SELECT * FROM tickets WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);

  if (!ticket) return res.status(404).json({ error: 'Biglietto non trovato.' });
  if (ticket.status !== 'attivo') {
    return res.status(400).json({ error: `Biglietto già ${ticket.status}.` });
  }

  db.prepare(
    "UPDATE tickets SET status = 'validato' WHERE id = ? AND user_id = ?"
  ).run(req.params.id, req.userId);

  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  res.json({ ticket: updated });
});

module.exports = router;
