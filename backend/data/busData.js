// ATV Verona — Bus Lines & Stops Data
//
// Two-tier data source:
//  1. If backend/data/gtfs-data.json exists (written by the GTFS importer,
//     scripts/importGtfs.js) it is used — real stops, routes & frequencies.
//  2. Otherwise the bundled snapshot below is used as a fallback. It was
//     extracted from the official ATV urbano + extraurbano timetables.

'use strict';
const fs = require('fs');
const path = require('path');

const STATIC_BUS_STOPS = [
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
  { id: 'ISC_CENTRO', name: 'Isola della Scala Centro', lat: 45.2730, lng: 11.0050, city: 'Isola della Scala' },
  { id: 'BOV_CENTRO', name: 'Bovolone Centro', lat: 45.2585, lng: 11.1208, city: 'Bovolone' },
];

const STATIC_BUS_LINES = [
  { id: 'L11', number: '11', name: 'Linea 11', description: 'S.Michele Nord - P.Vescovo - p.Bra - Stazione P.N. - Chievo - S.Vito al Mantico - Bussolengo', color: '#1E5EFF', type: 'urbano', stopIds: ['VR_SANMICHELE', 'VR_BRA', 'VR_PN_FS', 'VR_CHIEVO', 'BSL_CENTRO'], frequency: 16 },
  { id: 'L12', number: '12', name: 'Linea 12', description: 'S.Michele Sud - P.Vescovo - p.Bra - Stazione P.N. - B.go Nuovo', color: '#E53E3E', type: 'urbano', stopIds: ['VR_SANMICHELE', 'VR_BRA', 'VR_PN_FS'], frequency: 17 },
  { id: 'L13', number: '13', name: 'Linea 13', description: 'Mizzole - Montorio - P.Vescovo - p.Bra - Stazione P.N. - Croce Bianca - Cason', color: '#38A169', type: 'urbano', stopIds: ['VR_BRA', 'VR_PN_FS'], frequency: 16 },
  { id: 'L21', number: '21', name: 'Linea 21', description: 'San Giovanni Lupatoto - Policlinico - Stazione P.N. - Ospedale - Parona - Negrar/Domegliara', color: '#D69E2E', type: 'urbano', stopIds: ['VR_POLICLINICO', 'VR_PN_FS', 'VR_BORGO'], frequency: 27 },
  { id: 'L22', number: '22', name: 'Linea 22', description: 'San Giovanni Lupatoto - Policlinico - Stazione P.N. - Ospedale - Villa Monga', color: '#805AD5', type: 'urbano', stopIds: ['VR_POLICLINICO', 'VR_PN_FS', 'VR_BORGO'], frequency: 29 },
  { id: 'L23', number: '23', name: 'Linea 23', description: 'S.Lucia - Stazione P.N. - Ospedale - Avesa', color: '#DD6B20', type: 'urbano', stopIds: ['VR_PN_FS', 'VR_BORGO'], frequency: 28 },
  { id: 'L24', number: '24', name: 'Linea 24', description: 'Quinzano - Ospedale - Stazione P.N. - S.Elisabetta - Quad. Europa - Caselle', color: '#0D9488', type: 'urbano', stopIds: ['VR_BORGO', 'VR_PN_FS'], frequency: 29 },
  { id: 'L30', number: '30', name: 'Linea 30', description: 'Via Carinelli - Stazione PN - Saval', color: '#DB2777', type: 'urbano', stopIds: ['VR_PN_FS'], frequency: 38 },
  { id: 'L31', number: '31', name: 'Linea 31', description: 'Saval - Castelvecchio - Ospedale - Porta Vescovo - Marzana', color: '#0EA5E9', type: 'urbano', stopIds: ['VR_BORGO'], frequency: 38 },
  { id: 'L32', number: '32', name: 'Linea 32', description: 'S.Massimo - c.Milano - S.Zeno - Castelvecchio - Ospedale - P.Vescovo - S.Felice Extra', color: '#65A30D', type: 'urbano', stopIds: ['VR_BORGO'], frequency: 40 },
  { id: 'L33', number: '33', name: 'Linea 33', description: 'S.Croce - P.Vescovo - Ospedale - Castelvecchio - S.Zeno - c.Milano - Basson', color: '#9333EA', type: 'urbano', stopIds: ['VR_BORGO'], frequency: 39 },
  { id: 'L41', number: '41', name: 'Linea 41', description: 'Marchesino - Cadidavid - Stazione P.N. - Ospedale - B.go Nuovo', color: '#F59E0B', type: 'urbano', stopIds: ['VR_PN_FS', 'VR_BORGO'], frequency: 25 },
  { id: 'L51', number: '51', name: 'Linea 51', description: 'Via Carinelli - P.Vescovo - p.Bra - Stazione P.N. - Sacra Famiglia', color: '#14B8A6', type: 'urbano', stopIds: ['VR_BRA', 'VR_PN_FS'], frequency: 40 },
  { id: 'L52', number: '52', name: 'Linea 52', description: 'Stallavena - Marzana - P.Vescovo - Stazione P.N. - Sacra Famiglia - Castel d\'Azzano - Alpo', color: '#EF4444', type: 'urbano', stopIds: ['VR_PN_FS'], frequency: 38 },
  { id: 'L61', number: '61', name: 'Linea 61', description: 'Navigatori - Ospedale - Stazione P.N. - Fiera - ZAI', color: '#1E5EFF', type: 'urbano', stopIds: ['VR_BORGO', 'VR_PN_FS'], frequency: 33 },
  { id: 'L62', number: '62', name: 'Linea 62', description: 'Navigatori - Ospedale - Castelvecchio - S.Lucia - Policlinico', color: '#E53E3E', type: 'urbano', stopIds: ['VR_BORGO', 'VR_POLICLINICO'], frequency: 40 },
  { id: 'L70', number: '70', name: 'Linea 70', description: 'Sommavalle/Valdonega - Ospedale - p.Viviani - Cimitero - Porto S.Pancrazio - Oltreadige', color: '#38A169', type: 'urbano', stopIds: ['VR_BORGO'], frequency: 15 },
  { id: 'L72', number: '72', name: 'Linea 72', description: 'Policlinico - Basso Acquar - Tribunale - p.Cittadella - S.Fermo - Biondella - S.Croce', color: '#D69E2E', type: 'urbano', stopIds: ['VR_POLICLINICO'], frequency: 30 },
  { id: 'L73', number: '73', name: 'Linea 73', description: 'Valdonega - p.Isolo - p.Cittadella - Stazione P.N. - S.Lucia', color: '#805AD5', type: 'urbano', stopIds: ['VR_ISOLO', 'VR_PN_FS'], frequency: 30 },
  { id: 'L74', number: '74', name: 'Linea 74', description: 'AMIA via Avesani - Stazione PN', color: '#DD6B20', type: 'urbano', stopIds: ['VR_PN_FS'], frequency: 42 },
  { id: 'L81', number: '81', name: 'Linea 81', description: 'P.Vescovo - Novaglie - S.Maria in Stelle - Sezano', color: '#0D9488', type: 'urbano', stopIds: [], frequency: 120 },
  { id: 'L90', number: '90', name: 'Linea 90', description: 'Basson - Croce Bianca - Stazione P.N. - p.Bra - P.Vescovo - S.Michele Nord', color: '#DB2777', type: 'urbano', stopIds: ['VR_PN_FS', 'VR_BRA', 'VR_SANMICHELE'], frequency: 35 },
  { id: 'L91', number: '91', name: 'Linea 91', description: 'S.Lucia - Stazione P.N. - S.Zeno - Ospedale - P.Vescovo - S.Croce - S.Felice Extra', color: '#0EA5E9', type: 'urbano', stopIds: ['VR_PN_FS', 'VR_BORGO'], frequency: 35 },
  { id: 'L92', number: '92', name: 'Linea 92', description: 'Marzana - Poiano - P.Vescovo - p.Bra - Stazione', color: '#65A30D', type: 'urbano', stopIds: ['VR_BRA'], frequency: 120 },
  { id: 'L93', number: '93', name: 'Linea 93', description: 'Domegliara/Negrar - Parona - Ospedale - Stazione P.N. - Policlinico - Cadidavid', color: '#9333EA', type: 'urbano', stopIds: ['VR_BORGO', 'VR_PN_FS', 'VR_POLICLINICO'], frequency: 34 },
  { id: 'L94', number: '94', name: 'Linea 94', description: 'S.Michele - Porto S.Pancrazio - Stazione P.N. - Ospedale - Saval', color: '#F59E0B', type: 'urbano', stopIds: ['VR_SANMICHELE', 'VR_PN_FS', 'VR_BORGO'], frequency: 34 },
  { id: 'L95', number: '95', name: 'Linea 95', description: 'Chievo - B.go Nuovo - Stazione P.N. - Ospedale - Valdonega - Torricelle', color: '#14B8A6', type: 'urbano', stopIds: ['VR_CHIEVO', 'VR_PN_FS', 'VR_BORGO'], frequency: 35 },
  { id: 'L96', number: '96', name: 'Linea 96', description: 'Quinzano - Ospedale - p.Viviani - p.Bra - Stazione P.N. - Palazzina', color: '#EF4444', type: 'urbano', stopIds: ['VR_BORGO', 'VR_BRA', 'VR_PN_FS'], frequency: 40 },
  { id: 'L97', number: '97', name: 'Linea 97', description: 'Avesa - Ospedale - p.Viviani - p.Bra - Stazione P.N.', color: '#1E5EFF', type: 'urbano', stopIds: ['VR_BORGO', 'VR_BRA', 'VR_PN_FS'], frequency: 40 },
  { id: 'L98', number: '98', name: 'Linea 98', description: 'Montorio - P.Vescovo - p.Bra - Stazione P.N. - S.Elisabetta', color: '#E53E3E', type: 'urbano', stopIds: ['VR_BRA', 'VR_PN_FS'], frequency: 34 },
  { id: 'LA', number: 'A', name: 'Linea A', description: 'Terranegra - Stazione FS - Casette - Ospedale', color: '#38A169', type: 'extraurbano', stopIds: ['VR_PN_FS', 'VR_BORGO'], frequency: 120 },
  { id: 'LB', number: 'B', name: 'Linea B', description: 'Autostazione - Porto', color: '#D69E2E', type: 'extraurbano', stopIds: [], frequency: 20 },
  { id: 'LC', number: 'C', name: 'Linea C', description: 'Terranegra - Stazione FS - Ospedale - Vangadizza', color: '#805AD5', type: 'extraurbano', stopIds: ['VR_PN_FS', 'VR_BORGO'], frequency: 100 },
  { id: 'LX02', number: 'X02', name: 'Linea X02', description: 'San Giovanni Ilarione - Verona', color: '#DD6B20', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 45 },
  { id: 'LX03', number: 'X03', name: 'Linea X03', description: 'Minerbe - Verona', color: '#0D9488', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 45 },
  { id: 'LX04', number: 'X04', name: 'Linea X04', description: 'Legnago - Verona', color: '#DB2777', type: 'extraurbano', stopIds: ['LGN_CENTRO', 'VR_PN_FS'], frequency: 42 },
  { id: 'LX05', number: 'X05', name: 'Linea X05', description: 'Garda - Verona', color: '#0EA5E9', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 20 },
  { id: 'LX06', number: 'X06', name: 'Linea X06', description: 'Caprino - Verona', color: '#65A30D', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 45 },
  { id: 'L101', number: '101', name: 'Linea 101', description: 'S. Lucia - Pescantina - Verona', color: '#9333EA', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 84 },
  { id: 'L102', number: '102', name: 'Linea 102', description: 'Pescantina - Bussolengo - Verona', color: '#F59E0B', type: 'extraurbano', stopIds: ['BSL_CENTRO', 'VR_PN_FS'], frequency: 41 },
  { id: 'L103', number: '103', name: 'Linea 103', description: 'Domegliara - San Pietro in Cariano - Verona', color: '#14B8A6', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 25 },
  { id: 'L104', number: '104', name: 'Linea 104', description: 'Fosse - S.Anna di Alfaedo - Negrar - Verona', color: '#EF4444', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 42 },
  { id: 'L105', number: '105', name: 'Linea 105', description: 'Fosse - Molina - Breonio - Fumane - Verona', color: '#1E5EFF', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 70 },
  { id: 'L107', number: '107', name: 'Linea 107', description: 'Fosse - S.Cristina - S.Rocco - Marano - S.Floriano', color: '#E53E3E', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L108', number: '108', name: 'Linea 108', description: 'Montecchio - Negrar - Verona', color: '#38A169', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 120 },
  { id: 'L109', number: '109', name: 'Linea 109', description: 'Erbezzo - Verona', color: '#D69E2E', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 120 },
  { id: 'L110', number: '110', name: 'Linea 110', description: 'Boscochiesanuova - Verona', color: '#805AD5', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 58 },
  { id: 'L111', number: '111', name: 'Linea 111', description: 'Alcenago - Stallavena - Verona', color: '#DD6B20', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 45 },
  { id: 'L112', number: '112', name: 'Linea 112', description: 'Arzerè - Lugo - Stallavena - Verona', color: '#0D9488', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 45 },
  { id: 'L113', number: '113', name: 'Linea 113', description: 'Fosse - Ceredo - Grezzana - Verona', color: '#DB2777', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 45 },
  { id: 'L115', number: '115', name: 'Linea 115', description: 'Velo - Roverè - Cerro - Romagnano - Verona', color: '#0EA5E9', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 120 },
  { id: 'L117', number: '117', name: 'Linea 117', description: 'S.Francesco - Velo - Roverè - S.Rocco - Verona', color: '#65A30D', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 120 },
  { id: 'L119', number: '119', name: 'Linea 119', description: 'Magrano - Moruri - Castagnè - Verona', color: '#9333EA', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 45 },
  { id: 'L120', number: '120', name: 'Linea 120', description: 'Pian di Castagnè/San Briccio - Ferrazze - Verona', color: '#F59E0B', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 120 },
  { id: 'L121', number: '121', name: 'Linea 121', description: 'Giazza - Badia Calavena - Tregnago - Strà - Verona', color: '#14B8A6', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 20 },
  { id: 'L123', number: '123', name: 'Linea 123', description: 'Velo - S.Mauro di Saline - Mezzane - Vago - Verona', color: '#EF4444', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 96 },
  { id: 'L130', number: '130', name: 'Linea 130', description: 'San Bonifacio - Soave - Strà - Verona', color: '#1E5EFF', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 28 },
  { id: 'L133', number: '133', name: 'Linea 133', description: 'San Bonifacio - Belfiore - Strà - Verona', color: '#E53E3E', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 88 },
  { id: 'L134', number: '134', name: 'Linea 134', description: 'Albaredo - Zevio - Mambrotta - Verona', color: '#38A169', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 99 },
  { id: 'L138', number: '138', name: 'Linea 138', description: 'Albaredo - Zevio - Verona', color: '#D69E2E', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 38 },
  { id: 'L139', number: '139', name: 'Linea 139', description: 'Zevio - Bosco - Palù - Verona', color: '#805AD5', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 100 },
  { id: 'L141', number: '141', name: 'Linea 141', description: 'Legnago - Roverchiara - Oppeano - Verona', color: '#DD6B20', type: 'extraurbano', stopIds: ['LGN_CENTRO', 'VR_PN_FS'], frequency: 112 },
  { id: 'L143', number: '143', name: 'Linea 143', description: 'Legnago - S.Pietro di Morubio - Bovolone - Raldon - Verona', color: '#0D9488', type: 'extraurbano', stopIds: ['LGN_CENTRO', 'BOV_CENTRO', 'VR_PN_FS'], frequency: 120 },
  { id: 'L144', number: '144', name: 'Linea 144', description: 'Legnago - Cerea - Bovolone - Verona', color: '#DB2777', type: 'extraurbano', stopIds: ['LGN_CENTRO', 'BOV_CENTRO', 'VR_PN_FS'], frequency: 20 },
  { id: 'L146', number: '146', name: 'Linea 146', description: 'Nogara - Isola d. Scala - Verona', color: '#0EA5E9', type: 'extraurbano', stopIds: ['ISC_CENTRO', 'VR_PN_FS'], frequency: 26 },
  { id: 'L148', number: '148', name: 'Linea 148', description: 'Mantova - Castelbelforte - Trevenzuolo - Vigasio - Verona', color: '#65A30D', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 76 },
  { id: 'L157', number: '157', name: 'Linea 157', description: 'Trevenzuolo - Bagnolo - Nogarole Rocca', color: '#9333EA', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L158', number: '158', name: 'Linea 158', description: 'Vigasio - Isolalta - Povegliano - Villafranca - Verona', color: '#F59E0B', type: 'extraurbano', stopIds: ['VF_CENTRO', 'VR_PN_FS'], frequency: 29 },
  { id: 'L159', number: '159', name: 'Linea 159', description: 'Belvedere - Mozzecane - Villafranca - Verona', color: '#14B8A6', type: 'extraurbano', stopIds: ['VF_CENTRO', 'VR_PN_FS'], frequency: 96 },
  { id: 'L160', number: '160', name: 'Linea 160', description: 'Valeggio - Villafranca - Sommacampagna - Verona', color: '#EF4444', type: 'extraurbano', stopIds: ['VF_CENTRO', 'VR_PN_FS'], frequency: 27 },
  { id: 'L161', number: '161', name: 'Linea 161', description: 'Salionze - Sona - Lugagnano - Verona', color: '#1E5EFF', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 43 },
  { id: 'L162', number: '162', name: 'Linea 162', description: 'Garda - Pastrengo - Bussolengo - Verona', color: '#E53E3E', type: 'extraurbano', stopIds: ['BSL_CENTRO', 'VR_PN_FS'], frequency: 88 },
  { id: 'L163', number: '163', name: 'Linea 163', description: 'Garda - Lazise - Colà - Palazzolo - Bussolengo', color: '#38A169', type: 'extraurbano', stopIds: ['BSL_CENTRO'], frequency: 78 },
  { id: 'L164', number: '164', name: 'Linea 164', description: 'Garda - Peschiera - Verona', color: '#D69E2E', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 66 },
  { id: 'L165', number: '165', name: 'Linea 165', description: 'Garda - Costermano - Cavaion - Calmasino', color: '#805AD5', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L173', number: '173', name: 'Linea 173', description: 'Caprino - Verona', color: '#DD6B20', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 54 },
  { id: 'L185', number: '185', name: 'Linea 185', description: 'Verona - Lazise - Garda', color: '#0D9488', type: 'extraurbano', stopIds: ['VR_PN_FS'], frequency: 120 },
  { id: 'L224', number: '224', name: 'Linea 224', description: 'Campofontana - Tregnago', color: '#DB2777', type: 'extraurbano', stopIds: [], frequency: 45 },
  { id: 'L225', number: '225', name: 'Linea 225', description: 'Vestenanova - Castelvero', color: '#0EA5E9', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L226', number: '226', name: 'Linea 226', description: 'S.Bortolo - Vestenanova - S.Giovanni Ilarione - Monteforte - San Bonifacio', color: '#65A30D', type: 'extraurbano', stopIds: [], frequency: 36 },
  { id: 'L227', number: '227', name: 'Linea 227', description: 'Arzignano - Vestenanova', color: '#9333EA', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L228', number: '228', name: 'Linea 228', description: 'Arzignano - S.Giovanni Ilarione', color: '#F59E0B', type: 'extraurbano', stopIds: [], frequency: 45 },
  { id: 'L229', number: '229', name: 'Linea 229', description: 'Tregnago - Cazzano di Tramigna - Soave', color: '#14B8A6', type: 'extraurbano', stopIds: [], frequency: 24 },
  { id: 'L233', number: '233', name: 'Linea 233', description: 'Roveredo di Guà - Cologna Veneta - San Bonifacio', color: '#EF4444', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L234', number: '234', name: 'Linea 234', description: 'Albaredo - Veronella - Cologna Veneta', color: '#1E5EFF', type: 'extraurbano', stopIds: [], frequency: 55 },
  { id: 'L236', number: '236', name: 'Linea 236', description: 'Montagnana - Cologna Veneta - Lonigo - San Bonifacio', color: '#E53E3E', type: 'extraurbano', stopIds: [], frequency: 37 },
  { id: 'L237', number: '237', name: 'Linea 237', description: 'Legnago - S.Zenone - Albaredo - San Bonifacio', color: '#38A169', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 120 },
  { id: 'L336', number: '336', name: 'Linea 336', description: 'Montagnana - Marega - Boschi S.Marco - Legnago', color: '#D69E2E', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 120 },
  { id: 'L338', number: '338', name: 'Linea 338', description: 'Albaredo - Bonavigo - Legnago', color: '#805AD5', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 120 },
  { id: 'L341', number: '341', name: 'Linea 341', description: 'Badia Polesine - Castelbaldo - Begosso - Legnago', color: '#DD6B20', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 120 },
  { id: 'L343', number: '343', name: 'Linea 343', description: 'Merlara - Urbana - Marega - Boschi S.Marco', color: '#0D9488', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L344', number: '344', name: 'Linea 344', description: 'Badia Polesine - Menà - Castagnaro', color: '#DB2777', type: 'extraurbano', stopIds: [], frequency: 59 },
  { id: 'L345', number: '345', name: 'Linea 345', description: 'Isola della Scala - Salizzole - Sanguinetto', color: '#0EA5E9', type: 'extraurbano', stopIds: ['ISC_CENTRO'], frequency: 120 },
  { id: 'L346', number: '346', name: 'Linea 346', description: 'Ostiglia - Maccacari - Gazzo - Nogara', color: '#65A30D', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L347', number: '347', name: 'Linea 347', description: 'Isola della Scala - Erbè - Sorgà - Bonferraro', color: '#9333EA', type: 'extraurbano', stopIds: ['ISC_CENTRO'], frequency: 115 },
  { id: 'L351', number: '351', name: 'Linea 351', description: 'Lonigo - Cologna Veneta - Minerbe - Legnago', color: '#F59E0B', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 120 },
  { id: 'L352', number: '352', name: 'Linea 352', description: 'Nogara - Gazzo - Maccacari - Sustinenza', color: '#14B8A6', type: 'extraurbano', stopIds: [], frequency: 83 },
  { id: 'L353', number: '353', name: 'Linea 353', description: 'Nogara - Sanguinetto - Cerea - Legnago', color: '#EF4444', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 120 },
  { id: 'L354', number: '354', name: 'Linea 354', description: 'Castelmassa - S. Pietro Polesine - Legnago', color: '#1E5EFF', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 120 },
  { id: 'L355', number: '355', name: 'Linea 355', description: 'Legnago - S. Pietro di Morubio - Bonavicina', color: '#E53E3E', type: 'extraurbano', stopIds: ['LGN_CENTRO'], frequency: 45 },
  { id: 'L356', number: '356', name: 'Linea 356', description: 'Bovolone - Salizzole - Isola della Scala', color: '#38A169', type: 'extraurbano', stopIds: ['BOV_CENTRO', 'ISC_CENTRO'], frequency: 120 },
  { id: 'L467', number: '467', name: 'Linea 467', description: 'Garda - Caprino', color: '#D69E2E', type: 'extraurbano', stopIds: [], frequency: 101 },
  { id: 'L470', number: '470', name: 'Linea 470', description: 'S.Zeno di Montagna - Costermano - Garda', color: '#805AD5', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L471', number: '471', name: 'Linea 471', description: 'Ferrara di Monte Baldo - Caprino - Rivoli', color: '#DD6B20', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L472', number: '472', name: 'Linea 472', description: 'Belluno Veronese - Rivoli/Caprino', color: '#0D9488', type: 'extraurbano', stopIds: [], frequency: 120 },
  { id: 'L483', number: '483', name: 'Linea 483', description: 'Malcesine - Garda - Peschiera - S.Benedetto', color: '#DB2777', type: 'extraurbano', stopIds: [], frequency: 58 },
  { id: 'L484', number: '484', name: 'Linea 484', description: 'Riva - Malcesine - Garda', color: '#0EA5E9', type: 'extraurbano', stopIds: [], frequency: 60 },
  { id: 'L499', number: '499', name: 'Linea 499', description: 'Spiazzi - Santuario Mad. Corona fino al 31/10/2019 e dal 01/04/2020', color: '#65A30D', type: 'extraurbano', stopIds: [], frequency: 30 },
  { id: 'L199', number: '199', name: 'Linea 199', description: 'Aeroporto - Verona Stazione P.N.', color: '#9333EA', type: 'aeroporto', stopIds: ['VF_AERO', 'VR_PN_FS'], frequency: 21 },
];

// ─── Active data set ───────────────────────────────────────────────────────
// Prefer GTFS-imported data; fall back to the bundled snapshot above.
const GTFS_FILE = path.join(__dirname, 'gtfs-data.json');

let busStops = STATIC_BUS_STOPS;
let busLines = STATIC_BUS_LINES;
let dataSource = 'bundled';

function loadData() {
  try {
    if (fs.existsSync(GTFS_FILE)) {
      const g = JSON.parse(fs.readFileSync(GTFS_FILE, 'utf8'));
      if (Array.isArray(g.stops) && g.stops.length &&
          Array.isArray(g.lines) && g.lines.length) {
        busStops = g.stops;
        busLines = g.lines;
        dataSource = 'gtfs (' + (g.generatedAt || 'unknown date') + ')';
        return;
      }
    }
  } catch (err) {
    console.warn('[busData] could not read gtfs-data.json:', err.message);
  }
  busStops = STATIC_BUS_STOPS;
  busLines = STATIC_BUS_LINES;
  dataSource = 'bundled';
}
loadData();

// Re-read gtfs-data.json after an import, without restarting the server.
function reload() {
  loadData();
  console.log('[busData] active source:', dataSource,
              '—', busStops.length, 'stops,', busLines.length, 'lines');
  return dataSource;
}

const getStops = () => busStops;
const getLines = () => busLines;
const getDataSource = () => dataSource;

// Generate simulated real-time arrivals for a stop
function getArrivalsForStop(stopId) {
  const now = Date.now();
  const arrivals = [];

  busLines.forEach(line => {
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
        destination: busStops.find(s => s.id === line.stopIds[line.stopIds.length - 1])?.name || '',
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

module.exports = { getStops, getLines, getArrivalsForStop, getDataSource, reload };
