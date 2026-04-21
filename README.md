# ATV Verona Smart Hub 🚌

Un assistente smart unificato per la mobilità e la produttività a Verona. Questo progetto nasce per semplificare l'esperienza del trasporto pubblico ATV, integrando in un'unica interfaccia moderna la gestione degli spostamenti e delle attività quotidiane.

## 🌟 Caratteristiche Principali

- **Dashboard Real-time**: Visualizzazione immediata delle prossime partenze dalle fermate preferite.
- **Tracking Autobus**: Monitoraggio degli arrivi con indicazione di ritardi o anticipi (implementato con sistema di simulazione basato su rete reale).
- **Biglietteria Digitale**: Catalogo completo dei titoli di viaggio ATV con sistema di generazione QR Code e validazione in-app.
- **Travel Planner**: Pianificazione intelligente dei percorsi urbani ed extraurbani.
- **Productivity Hub**: Sistema di To-Do list integrato per gestire impegni scolastici, lavorativi e personali durante gli spostamenti.
- **Sicurezza**: Autenticazione crittografata e protezione contro SQL injection.

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React.js, Vite, Lucide React (Icone), CSS3 (Custom Design System).
- **Backend**: Node.js, Express.
- **Database**: SQLite (better-sqlite3) con query parametrizzate.
- **Sicurezza**: JWT (JSON Web Tokens), bcrypt per hashing password, Helmet, Rate Limiting.

## 🚀 Obiettivo del Progetto

Il progetto è attualmente in fase di prototipo funzionale. L'obiettivo principale è dimostrare come un'integrazione fluida dei dati di trasporto possa migliorare radicalmente l'esperienza dell'utente.

**Nota per ATV Verona**: Questo software è predisposto per l'integrazione con le API ufficiali (GTFS-RT / MyCicero). È stata inclusa una sezione "API Key" nelle impostazioni per permettere una transizione immediata dai dati simulati ai dati reali.

## 📦 Installazione e Avvio

1. Assicurati di avere [Node.js](https://nodejs.org/) installato.
2. Clona il repository.
3. Esegui lo script di avvio rapido:
   ```bash
   bash start.sh
   ```

---

*Sviluppato con l'obiettivo di rendere Verona una città sempre più smart e connessa.*
