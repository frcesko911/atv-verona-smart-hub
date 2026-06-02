// ATV Verona — Extraurban fare tiers (Tariffe extraurbane)
//
// Each tier is bounded by two things: the maximum validity time from
// validation, and the geographic extension (zones/distance from the
// Comune di Verona). From Tariffa 2 onward the ticket also includes urban
// integration on the Verona city network, provided the trip starts or ends
// in Verona.
//
// The full extraurban network reaches up to T8/T9 for very long routes
// (e.g. Lago di Garda); the first four tiers cover almost the whole province
// and the first belt, which is what the in-app fare calculator handles.

'use strict';

const EXTRAURBAN_FARES = [
  {
    type: 'extra_t1', tier: 'T1', name: 'Biglietto Extraurbano T1',
    description: 'Corsa semplice extraurbana, 60 minuti. Nessuna integrazione urbana.',
    price: 1.50, validityMinutes: 60, urbanIntegration: false,
    zone: 'extra_t1', icon: '🚌',
  },
  {
    type: 'extra_t2', tier: 'T2', name: 'Biglietto Extraurbano T2',
    description: 'Prima cintura, 75 minuti. Integrazione urbana Verona inclusa.',
    price: 2.30, validityMinutes: 75, urbanIntegration: true,
    zone: 'extra_t2', icon: '🚌',
  },
  {
    type: 'extra_t3', tier: 'T3', name: 'Biglietto Extraurbano T3',
    description: 'Seconda cintura, 90 minuti. Integrazione urbana Verona inclusa.',
    price: 3.20, validityMinutes: 90, urbanIntegration: true,
    zone: 'extra_t3', icon: '🚌',
  },
  {
    type: 'extra_t4', tier: 'T4', name: 'Biglietto Extraurbano T4',
    description: 'Medio raggio, 105 minuti. Integrazione urbana Verona inclusa.',
    price: 3.90, validityMinutes: 105, urbanIntegration: true,
    zone: 'extra_t4', icon: '🚌',
  },
];

const FARES_BY_TIER = Object.fromEntries(EXTRAURBAN_FARES.map(f => [f.tier, f]));

// Locality (the non-Verona endpoint) → fare tier, by distance from the
// Comune di Verona. Keys are normalised (lowercase) city names so they line
// up with the `city` field on bus stops.
const LOCALITY_TIER = {
  // T2 — prima cintura urbana
  'alpo': 'T2',
  'caselle di sommacampagna': 'T2',
  'sommacampagna': 'T2',
  "castel d'azzano": 'T2',
  'san giovanni lupatoto': 'T2',
  // T3 — seconda cintura provinciale
  'bussolengo': 'T3',
  'buttapietra': 'T3',
  'grezzana': 'T3',
  'negrar': 'T3',
  'negrar di valpolicella': 'T3',
  'pescantina': 'T3',
  'san pietro in cariano': 'T3',
  'villafranca': 'T3',
  'villafranca di verona': 'T3',
  // T4 — medio raggio / Valpolicella, Est veronese
  'domegliara': 'T4',
  "sant'ambrogio di valpolicella": 'T4',
  'isola della scala': 'T4',
};

const VERONA = 'verona';

function norm(s) {
  return (s || '').trim().toLowerCase();
}

// Resolve the correct extraurban fare for a trip between two localities.
// Returns { fare } when a tier applies, otherwise { reason } explaining why:
//   'incomplete'        — one of the endpoints is missing
//   'urban'             — both endpoints are in Verona (use an urban ticket)
//   'no_verona'         — neither endpoint is Verona (calculator is anchored
//                         on trips to/from the capoluogo)
//   'unknown_locality'  — the locality is outside the T1–T4 range / unmapped
function resolveFare(fromCity, toCity) {
  const from = norm(fromCity);
  const to = norm(toCity);
  if (!from || !to) return { reason: 'incomplete' };

  const fromVR = from === VERONA;
  const toVR = to === VERONA;

  if (fromVR && toVR) return { reason: 'urban' };
  if (!fromVR && !toVR) return { reason: 'no_verona' };

  const other = fromVR ? to : from;
  const tier = LOCALITY_TIER[other];
  if (!tier) return { reason: 'unknown_locality' };

  return { fare: FARES_BY_TIER[tier] };
}

module.exports = { EXTRAURBAN_FARES, LOCALITY_TIER, resolveFare };
