const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const adminAuth = require('../middleware/adminAuth');
const { getDb } = require('../db/database');
const { TICKET_CATALOG } = require('../data/tickets');

const router = express.Router();

// Constant-time comparison to avoid leaking the password via timing.
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppi tentativi di accesso. Riprova tra 15 minuti.' },
  skipSuccessfulRequests: true,
});

// POST /api/admin/login — exchange the admin password for an 8h admin token.
router.post('/login', loginLimiter, (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(503).json({ error: 'Pannello admin non configurato (ADMIN_PASSWORD mancante).' });
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string' || !safeEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'Password errata.' });
  }

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Everything below requires a valid admin token.
router.use(adminAuth);

// GET /api/admin/catalog — available ticket types.
router.get('/catalog', (req, res) => {
  res.json({ catalog: TICKET_CATALOG });
});

// GET /api/admin/stats — dashboard totals.
router.get('/stats', (req, res) => {
  const db = getDb();
  res.json({
    users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
    tickets: db.prepare('SELECT COUNT(*) AS c FROM tickets').get().c,
    activeTickets: db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE status = 'attivo'").get().c,
    revenue: db.prepare('SELECT COALESCE(SUM(price), 0) AS s FROM tickets').get().s,
  });
});

// GET /api/admin/users — all users with their ticket counts.
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at, COUNT(t.id) AS ticket_count
    FROM users u
    LEFT JOIN tickets t ON t.user_id = u.id
    GROUP BY u.id
    ORDER BY u.id
  `).all();
  res.json({ users });
});

// GET /api/admin/users/:id/tickets — a single user's tickets.
router.get('/users/:id/tickets', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID utente non valido.' });

  const db = getDb();
  if (!db.prepare('SELECT id FROM users WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Utente non trovato.' });
  }
  const tickets = db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY purchased_at DESC').all(id);
  res.json({ tickets });
});

// DELETE /api/admin/users/:id — delete a user (cascade removes tickets/tasks/settings).
router.delete('/users/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID utente non valido.' });

  const info = getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Utente non trovato.' });
  res.json({ deleted: true });
});

// POST /api/admin/users/:id/tickets — assign a ticket from the catalog to a user.
router.post('/users/:id/tickets', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID utente non valido.' });

  const ticketDef = TICKET_CATALOG.find(t => t.type === req.body.ticket_type);
  if (!ticketDef) return res.status(400).json({ error: 'Tipo biglietto non valido.' });

  const db = getDb();
  if (!db.prepare('SELECT id FROM users WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Utente non trovato.' });
  }

  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = ticketDef.validityMinutes
    ? new Date(now.getTime() + ticketDef.validityMinutes * 60000).toISOString()
    : null;
  const qrData = JSON.stringify({
    id: uuidv4(),
    type: ticketDef.type,
    userId: id,
    issuedAt: validFrom,
  });

  const result = db.prepare(
    `INSERT INTO tickets (user_id, ticket_type, ticket_name, price, valid_from, valid_until, qr_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, ticketDef.type, ticketDef.name, ticketDef.price, validFrom, validUntil, qrData);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ticket });
});

// DELETE /api/admin/tickets/:id — remove a single ticket.
router.delete('/tickets/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID biglietto non valido.' });

  const info = getDb().prepare('DELETE FROM tickets WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Biglietto non trovato.' });
  res.json({ deleted: true });
});

module.exports = router;
