# ATV Verona Smart Hub — System Requirements

## Required Software

### 1. Node.js (v20 LTS) — REQUIRED
The entire app (frontend + backend) runs on Node.js.

**Install via Homebrew** (you already have Homebrew):
```bash
brew install node
```

**Verify installation:**
```bash
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
npx --version    # Should show 10.x.x
```

---

### 2. Git — Optional but recommended
To version-control your project.
```bash
brew install git
```

---

## After Installing Node.js

Once Node is installed, run these commands to set up the project:

### Frontend (React + Vite)
```bash
cd /Users/cesco/Documents/INI/ATV/frontend
npm install
npm run dev
```

### Backend (Node.js + Express)
```bash
cd /Users/cesco/Documents/INI/ATV/backend
npm install
node server.js
```

---

## Backend Dependencies (auto-installed via npm install)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18 | Web server framework |
| better-sqlite3 | ^9.4 | SQLite database (parameterized queries, no SQL injection) |
| bcrypt | ^5.1 | Password hashing (security) |
| jsonwebtoken | ^9.0 | JWT authentication tokens |
| express-rate-limit | ^7.2 | Rate limiting (brute-force protection) |
| helmet | ^7.1 | Security HTTP headers |
| cors | ^2.8 | Cross-origin resource sharing |
| dotenv | ^16.4 | Environment variables (secret keys) |
| uuid | ^9.0 | Unique ID generation |

## Frontend Dependencies (auto-installed via npm install)
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18 | UI framework |
| react-dom | ^18 | React DOM rendering |
| react-router-dom | ^6 | Page navigation |
| lucide-react | ^0.368 | Icons |
| qrcode.react | ^3.1 | QR code generation (tickets) |
| leaflet | ^1.9 | Map rendering (bus tracking) |
| react-leaflet | ^4.2 | React wrapper for Leaflet |
| axios | ^1.6 | HTTP requests to backend |

---

## System Checklist
- [ ] Homebrew installed ✅ (already confirmed)
- [ ] Node.js v20 installed (`brew install node`)
- [ ] Project files written by Antigravity (in progress)
- [ ] `npm install` run in `/frontend/`
- [ ] `npm install` run in `/backend/`
- [ ] App running at `http://localhost:5173` (frontend) + `http://localhost:3001` (backend)
