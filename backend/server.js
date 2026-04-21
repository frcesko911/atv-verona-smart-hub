require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./db/database');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const ticketRoutes = require('./routes/tickets');
const busRoutes = require('./routes/bus');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Global Rate Limiter ───────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra un minuto.' },
});
app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  // Never expose internal error details to client
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'Errore interno del server.',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────
initDatabase();
app.listen(PORT, () => {
  console.log(`✅ ATV Backend avviato su http://localhost:${PORT}`);
});
