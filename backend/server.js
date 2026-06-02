require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./db/database');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const busRoutes = require('./routes/bus');
const settingsRoutes = require('./routes/settings');
const favouritesRoutes = require('./routes/favourites');
const adminRoutes = require('./routes/admin');

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

// Origins explicitly allowed via env var (comma-separated)
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// The native Capacitor app WebView origin — always allowed (prod included).
// A browser page can't forge a capacitor:///ionic:// Origin, so this stays
// safe even in production.
const appOrigin = /^(capacitor|ionic):\/\/localhost$/;

// localhost and LAN IPs — dev only
const localOrigin = /^(https?:\/\/localhost(:\d+)?|https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?|https?:\/\/192\.168\.\d+\.\d+(:\d+)?|https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?)$/;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                       // mobile app, curl, server-to-server
    if (appOrigin.test(origin)) return cb(null, true);        // native Capacitor app
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production' && localOrigin.test(origin)) {
      return cb(null, true);                                  // local dev / LAN
    }
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use((req, res, next) => {
  console.log("\n➡️", req.method, req.url);
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
app.use('/api/tickets', ticketRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/favourites', favouritesRoutes);
app.use('/api/admin', adminRoutes);

// ─── Admin Panel (static UI at /admin) ────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'public')));

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

// ─── GTFS auto-import ──────────────────────────────────────────────────────
// When GTFS feed URLs are configured, refresh the bus dataset on boot and
// then weekly. Runs in the background — failures never block the server,
// which keeps serving the bundled snapshot until an import succeeds.
function scheduleGtfsImport() {
  if (!process.env.GTFS_URL_URBANO && !process.env.GTFS_URL_EXTRAURBANO) {
    console.log('[gtfs] no feed URLs configured — using bundled bus data');
    return;
  }
  const { importGtfs } = require('./scripts/importGtfs');
  const busData = require('./data/busData');
  const runImport = () => {
    importGtfs()
      .then(() => busData.reload())
      .catch(err => console.warn('[gtfs] import skipped:', err.message));
  };
  runImport();                                       // on boot
  setInterval(runImport, 7 * 24 * 60 * 60 * 1000);   // weekly
}

// ─── Start ────────────────────────────────────────────────────────────────
initDatabase();
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  scheduleGtfsImport();
});
