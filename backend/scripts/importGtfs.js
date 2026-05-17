'use strict';
/**
 * GTFS importer for ATV Verona.
 *
 * Downloads the official ATV GTFS feeds, parses them, and writes
 * backend/data/gtfs-data.json — which busData.js picks up automatically
 * (see busData.loadData / reload).
 *
 * Feed URLs are configured via environment variables:
 *   GTFS_URL_URBANO       — urban network GTFS .zip
 *   GTFS_URL_EXTRAURBANO  — extra-urban network GTFS .zip
 * If neither is set the import is skipped and the bundled snapshot is kept.
 *
 * Run manually:        npm run import-gtfs
 * Runs automatically:  on server boot + weekly (see server.js).
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const OUT_FILE = path.join(__dirname, '..', 'data', 'gtfs-data.json');

const FEEDS = [
  { type: 'urbano',      url: process.env.GTFS_URL_URBANO },
  { type: 'extraurbano', url: process.env.GTFS_URL_EXTRAURBANO },
];

const PALETTE = ['#1E5EFF', '#E53E3E', '#38A169', '#D69E2E', '#805AD5', '#DD6B20',
  '#0D9488', '#DB2777', '#0EA5E9', '#65A30D', '#9333EA', '#F59E0B', '#14B8A6', '#EF4444'];

const TYPE_RANK = { urbano: 0, extraurbano: 1, aeroporto: 2 };

// ─── Minimal RFC 4180 CSV parser (GTFS files are CSV) ──────────────────────
function parseCsv(text) {
  text = text.replace(/^﻿/, ''); // strip BOM
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''))
    .map(r => {
      const o = {};
      head.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
      return o;
    });
}

function readGtfsZip(buffer) {
  const zip = new AdmZip(buffer);
  const get = (name) => {
    const entry = zip.getEntry(name);
    return entry ? parseCsv(zip.readAsText(entry)) : [];
  };
  return {
    stops: get('stops.txt'),
    routes: get('routes.txt'),
    trips: get('trips.txt'),
    stopTimes: get('stop_times.txt'),
  };
}

function timeToMinutes(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  return m ? (+m[1]) * 60 + (+m[2]) : null;
}

function sanitizeId(prefix, raw, maxLen) {
  const s = (prefix + String(raw).replace(/[^a-zA-Z0-9]/g, '')).slice(0, maxLen);
  return s.length > prefix.length ? s : prefix + 'X';
}

async function downloadFeed(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4B) {
    throw new Error(`response is not a ZIP file (${buf.length} bytes) — check the URL`);
  }
  return buf;
}

// ─── Map GTFS feeds onto the app's { stops, lines } model ──────────────────
function buildModel(feeds) {
  const stopMap = new Map();        // app stop id -> stop object
  const stopRemap = new Map();      // "type:gtfsStopId" -> app stop id
  const rawLines = [];
  let colorIdx = 0;

  for (const { type, gtfs } of feeds) {
    // stops (skip any without valid coordinates)
    for (const s of gtfs.stops) {
      const lat = parseFloat(s.stop_lat);
      const lng = parseFloat(s.stop_lon);
      if (!isFinite(lat) || !isFinite(lng)) continue;
      const appId = sanitizeId('S', type[0].toUpperCase() + s.stop_id, 20);
      stopRemap.set(type + ':' + s.stop_id, appId);
      if (!stopMap.has(appId)) {
        stopMap.set(appId, {
          id: appId,
          name: s.stop_name || appId,
          lat, lng,
          city: s.stop_desc || '',
        });
      }
    }

    // stop_times indexed by trip, ordered by stop_sequence
    const timesByTrip = new Map();
    for (const st of gtfs.stopTimes) {
      if (!timesByTrip.has(st.trip_id)) timesByTrip.set(st.trip_id, []);
      timesByTrip.get(st.trip_id).push(st);
    }
    for (const arr of timesByTrip.values()) {
      arr.sort((a, b) => (+a.stop_sequence) - (+b.stop_sequence));
    }

    // trips indexed by route
    const tripsByRoute = new Map();
    for (const t of gtfs.trips) {
      if (!tripsByRoute.has(t.route_id)) tripsByRoute.set(t.route_id, []);
      tripsByRoute.get(t.route_id).push(t);
    }

    for (const r of gtfs.routes) {
      const routeTrips = tripsByRoute.get(r.route_id) || [];
      // focus on one direction for a coherent stop sequence
      let dirTrips = routeTrips.filter(t => t.direction_id === '0');
      if (!dirTrips.length) dirTrips = routeTrips;

      // representative trip = the one with the most stops
      let repTrip = null, repLen = -1;
      for (const t of dirTrips) {
        const len = (timesByTrip.get(t.trip_id) || []).length;
        if (len > repLen) { repLen = len; repTrip = t; }
      }
      const stopIds = [];
      if (repTrip) {
        for (const st of timesByTrip.get(repTrip.trip_id) || []) {
          const appId = stopRemap.get(type + ':' + st.stop_id);
          if (appId && !stopIds.includes(appId)) stopIds.push(appId);
        }
      }

      // frequency = average headway of first-stop departures
      const deps = [];
      for (const t of dirTrips) {
        const sts = timesByTrip.get(t.trip_id);
        if (sts && sts.length) {
          const m = timeToMinutes(sts[0].departure_time || sts[0].arrival_time);
          if (m != null) deps.push(m);
        }
      }
      const uniq = [...new Set(deps)].sort((a, b) => a - b);
      let frequency = uniq.length >= 2
        ? Math.round((uniq[uniq.length - 1] - uniq[0]) / (uniq.length - 1))
        : (type === 'urbano' ? 15 : 45);
      frequency = Math.max(type === 'urbano' ? 5 : 20, Math.min(120, frequency));

      const number = r.route_short_name || r.route_id;
      const longName = r.route_long_name || ('Linea ' + number);
      const lineType = /aerop|airport/i.test(longName + ' ' + number) ? 'aeroporto' : type;
      const color = /^[0-9a-fA-F]{6}$/.test(r.route_color || '')
        ? '#' + r.route_color
        : PALETTE[colorIdx++ % PALETTE.length];

      rawLines.push({
        id: sanitizeId('L', number, 10),
        number: String(number),
        name: 'Linea ' + number,
        description: longName,
        color,
        type: lineType,
        stopIds,
        frequency,
      });
    }
  }

  // ensure unique line ids
  const seen = new Set();
  const lines = rawLines.map(l => {
    let id = l.id, n = 1;
    while (seen.has(id)) id = (l.id.slice(0, 8) + (++n)).slice(0, 10);
    seen.add(id);
    return { ...l, id };
  });

  // sort: urbano, extraurbano, aeroporto — then by number
  lines.sort((a, b) =>
    (TYPE_RANK[a.type] - TYPE_RANK[b.type]) ||
    ((parseInt(a.number, 10) || 9999) - (parseInt(b.number, 10) || 9999)) ||
    a.number.localeCompare(b.number));

  return { stops: [...stopMap.values()], lines };
}

async function importGtfs() {
  const configured = FEEDS.filter(f => f.url);
  if (!configured.length) {
    throw new Error('no feed URLs configured (set GTFS_URL_URBANO / GTFS_URL_EXTRAURBANO)');
  }

  const feeds = [];
  for (const f of configured) {
    console.log(`[gtfs] downloading ${f.type}: ${f.url}`);
    const buf = await downloadFeed(f.url);
    const gtfs = readGtfsZip(buf);
    console.log(`[gtfs]   ${f.type}: ${gtfs.stops.length} stops, ${gtfs.routes.length} routes, ${gtfs.trips.length} trips`);
    feeds.push({ type: f.type, gtfs });
  }

  const model = buildModel(feeds);
  if (!model.stops.length || !model.lines.length) {
    throw new Error('parsed feed produced no usable stops or lines');
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'ATV Verona GTFS',
    stops: model.stops,
    lines: model.lines,
  };
  fs.writeFileSync(OUT_FILE + '.tmp', JSON.stringify(payload, null, 2));
  fs.renameSync(OUT_FILE + '.tmp', OUT_FILE);
  console.log(`[gtfs] wrote ${model.stops.length} stops, ${model.lines.length} lines -> data/gtfs-data.json`);
  return payload;
}

module.exports = { importGtfs };

// Run standalone: `node scripts/importGtfs.js` (or `npm run import-gtfs`)
if (require.main === module) {
  require('dotenv').config();
  importGtfs()
    .then(() => process.exit(0))
    .catch(err => { console.error('[gtfs] import failed:', err.message); process.exit(1); });
}
