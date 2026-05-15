// ATV Verona — Bus Lines & Stops Demo Data
// Based on real ATV Verona network (limited set for initial release)

const BUS_STOPS = [
  { id: 'VR_PN_FS', name: 'Verona Porta Nuova FS', lat: 45.4295, lng: 10.9823, city: 'Verona' },
  { id: 'VR_BRA', name: 'Piazza Bra', lat: 45.4388, lng: 10.9938, city: 'Verona' },
  { id: 'VR_ERBE', name: 'Piazza Erbe', lat: 45.4423, lng: 10.9980, city: 'Verona' },
  { id: 'VR_ISOLO', name: 'Piazza Isolo', lat: 45.4456, lng: 10.9994, city: 'Verona' },
  { id: 'VR_BORGO', name: 'Borgo Trento - Ospedale', lat: 45.4601, lng: 10.9843, city: 'Verona' },
  { id: 'VR_STADIO', name: 'Stadio Bentegodi', lat: 45.4354, lng: 10.9694, city: 'Verona' },
  { id: 'VR_CHIEVO', name: 'Chievo - Via Sommavalle', lat: 45.4410, lng: 10.9612, city: 'Verona' },
  { id: 'VR_PALASPORT', name: 'Pala Expo - AGSM', lat: 45.4265, lng: 10.9741, city: 'Verona' },
  { id: 'VR_SANMICHELE', name: 'San Michele Extra', lat: 45.4189, lng: 11.0121, city: 'Verona' },
  { id: 'VR_POLICLINICO', name: 'Policlinico Borgo Roma', lat: 45.4097, lng: 10.9878, city: 'Verona' },
  { id: 'BSL_CENTRO', name: 'Bussolengo Centro', lat: 45.4695, lng: 10.8491, city: 'Bussolengo' },
  { id: 'BSL_FS', name: 'Bussolengo FS', lat: 45.4672, lng: 10.8443, city: 'Bussolengo' },
  { id: 'VF_AERO', name: 'Aeroporto Catullo', lat: 45.3955, lng: 10.8883, city: 'Villafranca' },
  { id: 'VF_CENTRO', name: 'Villafranca Centro', lat: 45.3522, lng: 10.8462, city: 'Villafranca' },
  { id: 'LGN_FS', name: 'Legnago FS', lat: 45.1951, lng: 11.3037, city: 'Legnago' },
  { id: 'LGN_CENTRO', name: 'Legnago Centro', lat: 45.1941, lng: 11.3098, city: 'Legnago' },
  { id: 'VR_ARSENALE', name: 'Arsenale - Rigaste', lat: 45.4482, lng: 10.9888, city: 'Verona' },
  { id: 'VR_FILIPPINI', name: 'Filippini - Via Carducci', lat: 45.4389, lng: 10.9862, city: 'Verona' },
];

const BUS_LINES = [
  {
    id: 'L11',
    number: '11',
    name: 'Linea 11',
    description: 'Porta Nuova FS → Borgo Trento Ospedale',
    color: '#1E5EFF',
    type: 'urbano',
    stopIds: ['VR_PN_FS', 'VR_BRA', 'VR_ERBE', 'VR_ISOLO', 'VR_ARSENALE', 'VR_BORGO'],
    frequency: 10, // minutes
  },
  {
    id: 'L12',
    number: '12',
    name: 'Linea 12',
    description: 'Porta Nuova FS → Stadio Bentegodi',
    color: '#E53E3E',
    type: 'urbano',
    stopIds: ['VR_PN_FS', 'VR_BRA', 'VR_FILIPPINI', 'VR_PALASPORT', 'VR_STADIO'],
    frequency: 12,
  },
  {
    id: 'L13',
    number: '13',
    name: 'Linea 13',
    description: 'Porta Nuova FS → Chievo',
    color: '#38A169',
    type: 'urbano',
    stopIds: ['VR_PN_FS', 'VR_BRA', 'VR_FILIPPINI', 'VR_CHIEVO'],
    frequency: 15,
  },
  {
    id: 'L21',
    number: '21',
    name: 'Linea 21',
    description: 'Verona ↔ Bussolengo',
    color: '#D69E2E',
    type: 'suburbano',
    stopIds: ['VR_PN_FS', 'VR_STADIO', 'VR_CHIEVO', 'BSL_FS', 'BSL_CENTRO'],
    frequency: 20,
  },
  {
    id: 'L31',
    number: '31',
    name: 'Linea 31 — AeroBus',
    description: 'Verona Porta Nuova FS → Aeroporto Catullo',
    color: '#805AD5',
    type: 'aeroporto',
    stopIds: ['VR_PN_FS', 'VR_BRA', 'VF_CENTRO', 'VF_AERO'],
    frequency: 20,
  },
  {
    id: 'L51',
    number: '51',
    name: 'Linea 51',
    description: 'Verona ↔ Legnago',
    color: '#DD6B20',
    type: 'suburbano',
    stopIds: ['VR_PN_FS', 'VR_SANMICHELE', 'VR_POLICLINICO', 'LGN_CENTRO', 'LGN_FS'],
    frequency: 30,
  },
];

// Generate simulated real-time arrivals for a stop
function getArrivalsForStop(stopId) {
  const now = Date.now();
  const arrivals = [];

  BUS_LINES.forEach(line => {
    if (!line.stopIds.includes(stopId)) return;

    const stopIndex = line.stopIds.indexOf(stopId);
    const travelTimeToStop = stopIndex * 3; // ~3 min per stop

    // Generate next 3 departures
    for (let i = 0; i < 3; i++) {
      const baseEta = (i + 1) * line.frequency + Math.floor(Math.random() * 4) - 2;
      const delayMinutes = Math.floor(Math.random() * 6) - 1; // -1 to +4 min

      let status = 'in_orario';
      if (delayMinutes > 1) status = 'in_ritardo';
      if (delayMinutes < 0) status = 'in_anticipo';

      const etaMs = now + (baseEta + travelTimeToStop) * 60000;

      arrivals.push({
        lineId: line.id,
        lineNumber: line.number,
        lineName: line.name,
        lineColor: line.color,
        destination: BUS_STOPS.find(s => s.id === line.stopIds[line.stopIds.length - 1])?.name || '',
        etaMinutes: baseEta + travelTimeToStop + delayMinutes,
        etaTime: new Date(etaMs).toISOString(),
        delayMinutes,
        status,
      });
    }
  });

  // Sort by ETA
  arrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);
  return arrivals.slice(0, 10);
}

module.exports = { BUS_STOPS, BUS_LINES, getArrivalsForStop };
