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

app.set('trust proxy', 1);

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

// Extra origins allowed via env var (comma-separated), e.g. the deployed frontend URL
const extraOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Cordova/mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    // Allow any explicitly configured frontend URL
    if (extraOrigins.some(o => origin === o)) return callback(null, true);
    // Allow any localhost or local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const localOrigin = /^(capacitor:\/\/localhost|https?:\/\/localhost(:\d+)?|https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?|https?:\/\/192\.168\.\d+\.\d+(:\d+)?|https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?)$/;
    if (localOrigin.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use((req, res, next) => {
  console.log("\n➡️", req.method, req.url);
  console.log("AUTH:", req.headers.authorization);
  next();
});

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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
