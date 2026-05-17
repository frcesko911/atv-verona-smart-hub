const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getLines, getStops, getArrivalsForStop } = require('../data/busData');

const router = express.Router();
router.use(authMiddleware);

// GET /api/bus/lines
router.get('/lines', (req, res) => {
  res.json({ lines: getLines() });
});

// GET /api/bus/stops
router.get('/stops', (req, res) => {
  const { q } = req.query;
  if (q && typeof q === 'string' && q.length > 0) {
    const query = q.toLowerCase().slice(0, 60); // limit query length
    const filtered = getStops().filter(s =>
      s.name.toLowerCase().includes(query)
    );
    return res.json({ stops: filtered.slice(0, 20) });
  }
  res.json({ stops: getStops() });
});

// GET /api/bus/arrivals/:stopId
router.get('/arrivals/:stopId', (req, res) => {
  const { stopId } = req.params;
  // Validate stopId format
  if (!/^[a-zA-Z0-9_-]{1,20}$/.test(stopId)) {
    return res.status(400).json({ error: 'ID fermata non valido.' });
  }

  const stop = getStops().find(s => s.id === stopId);
  if (!stop) return res.status(404).json({ error: 'Fermata non trovata.' });

  const arrivals = getArrivalsForStop(stopId);
  res.json({ stop, arrivals, lastUpdate: new Date().toISOString() });
});

// GET /api/bus/line/:lineId/stops — all stops on a line
router.get('/line/:lineId/stops', (req, res) => {
  const { lineId } = req.params;
  if (!/^[a-zA-Z0-9_-]{1,10}$/.test(lineId)) {
    return res.status(400).json({ error: 'ID linea non valido.' });
  }

  const line = getLines().find(l => l.id === lineId);
  if (!line) return res.status(404).json({ error: 'Linea non trovata.' });

  const stops = line.stopIds.map(id => getStops().find(s => s.id === id)).filter(Boolean);
  res.json({ line, stops });
});

// GET /api/bus/plan?from=stopId&to=stopId
router.get('/plan', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Parametri from e to obbligatori.' });
  if (!/^[a-zA-Z0-9_-]{1,20}$/.test(from) || !/^[a-zA-Z0-9_-]{1,20}$/.test(to)) {
    return res.status(400).json({ error: 'ID fermata non valido.' });
  }

  const fromStop = getStops().find(s => s.id === from);
  const toStop = getStops().find(s => s.id === to);
  if (!fromStop || !toStop) return res.status(404).json({ error: 'Fermata non trovata.' });

  // Demo route planning — find a line connecting both stops
  const directLine = getLines().find(l =>
    l.stopIds.includes(from) && l.stopIds.includes(to)
  );

  const duration = Math.floor(Math.random() * 20) + 10; // demo: 10-30 min
  const departureTime = new Date(Date.now() + 5 * 60000);

  if (directLine) {
    return res.json({
      routes: [{
        type: 'diretto',
        lines: [directLine.id],
        lineName: `Linea ${directLine.number}`,
        from: fromStop.name,
        to: toStop.name,
        departureTime: departureTime.toISOString(),
        arrivalTime: new Date(departureTime.getTime() + duration * 60000).toISOString(),
        duration,
        transfers: 0,
      }],
    });
  }

  // Suggest a connection via Porta Nuova
  res.json({
    routes: [{
      type: 'con_cambio',
      lines: ['11', '21'],
      lineName: 'Linea 11 → Linea 21 (cambio a Porta Nuova)',
      from: fromStop.name,
      to: toStop.name,
      departureTime: departureTime.toISOString(),
      arrivalTime: new Date(departureTime.getTime() + (duration + 10) * 60000).toISOString(),
      duration: duration + 10,
      transfers: 1,
    }],
  });
});

module.exports = router;
