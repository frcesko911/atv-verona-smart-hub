const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');

const router = express.Router();

// Names: letters (incl. accents), spaces, hyphens, apostrophes — no digits/symbols
const NAME_REGEX = /^[\p{L}][\p{L} '-]*$/u;

// Strict rate limit for auth routes — 5 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppi tentativi. Riprova tra 15 minuti.' },
  skipSuccessfulRequests: true,
});

const registerValidation = [
  body('firstName').trim().isLength({ min: 2, max: 50 })
    .withMessage('Il nome deve essere tra 2 e 50 caratteri.')
    .matches(NAME_REGEX)
    .withMessage('Il nome può contenere solo lettere, spazi, trattini e apostrofi.'),
  body('lastName').trim().isLength({ min: 2, max: 50 })
    .withMessage('Il cognome deve essere tra 2 e 50 caratteri.')
    .matches(NAME_REGEX)
    .withMessage('Il cognome può contenere solo lettere, spazi, trattini e apostrofi.'),
  body('email').isEmail().normalizeEmail()
    .withMessage('Indirizzo email non valido.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La password deve avere almeno 8 caratteri.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La password deve contenere almeno una lettera maiuscola, una minuscola e un numero.'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email non valida.'),
  body('password').notEmpty().withMessage('Password obbligatoria.'),
];

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { firstName, lastName, email, password } = req.body;
  const name = `${firstName} ${lastName}`;
  const db = getDb();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email già registrata.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    ).run(name, email, passwordHash);

    // Create default settings for user
    db.prepare(
      'INSERT INTO user_settings (user_id) VALUES (?)'
    ).run(result.lastInsertRowid);

    const token = jwt.sign(
      { userId: result.lastInsertRowid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, name, email },
    });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Errore durante la registrazione.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password } = req.body;
  const db = getDb();

  try {
    const user = db.prepare(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?'
    ).get(email);

    // Use constant-time comparison to prevent timing attacks
    const dummyHash = '$2b$12$invalidhashforcomparison000000000000000000000000000';
    const hashToCompare = user ? user.password_hash : dummyHash;
    const match = await bcrypt.compare(password, hashToCompare);

    if (!user || !match) {
      return res.status(401).json({ error: 'Email o password non corretti.' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Errore durante il login.' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, name, email, home_stop_id, created_at FROM users WHERE id = ?'
  ).get(req.userId);

  if (!user) return res.status(404).json({ error: 'Utente non trovato.' });
  res.json({ user });
});

// PUT /api/auth/me
router.put('/me', require('../middleware/auth'), [
  body('name').trim().isLength({ min: 2, max: 101 })
    .withMessage('Il nome deve essere tra 2 e 101 caratteri.')
    .matches(NAME_REGEX)
    .withMessage('Il nome può contenere solo lettere, spazi, trattini e apostrofi.'),
  body('email').isEmail().normalizeEmail()
    .withMessage('Indirizzo email non valido.'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { name, email } = req.body;
  const db = getDb();

  try {
    const existing = db.prepare(
      'SELECT id FROM users WHERE email = ? AND id != ?'
    ).get(email, req.userId);
    if (existing) {
      return res.status(409).json({ error: 'Email già registrata.' });
    }

    db.prepare(
      'UPDATE users SET name = ?, email = ? WHERE id = ?'
    ).run(name, email, req.userId);

    res.json({ user: { id: req.userId, name, email } });
  } catch (err) {
    console.error('[update profile]', err.message);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento del profilo.' });
  }
});

module.exports = router;
