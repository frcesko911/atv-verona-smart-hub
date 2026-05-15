#!/bin/bash
# ATV Verona Smart Hub — Avvio rapido (sviluppo locale)
# Esegui: bash start.sh

echo ""
echo "ATV Verona Smart Hub — Avvio..."
echo ""

if ! command -v node &> /dev/null; then
  echo "Node.js non trovato. Installa con: brew install node"
  exit 1
fi

echo "Node.js $(node --version) trovato"

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Installazione dipendenze backend..."
cd "$ROOT/backend" && npm install --silent
echo "Installazione dipendenze frontend..."
cd "$ROOT/frontend" && npm install --silent

cleanup() {
  echo ""
  echo "Arresto server..."
  kill $BACKEND_PID 2>/dev/null
  wait $BACKEND_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo ""
echo "Avvio backend su http://localhost:3001..."
cd "$ROOT/backend" && node server.js &
BACKEND_PID=$!
sleep 1

echo "Avvio frontend su http://localhost:5173..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Premi Ctrl+C per fermare."
echo ""

cd "$ROOT/frontend" && npm run dev

cleanup
