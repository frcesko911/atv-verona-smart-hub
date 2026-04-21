#!/bin/bash
# ATV Verona Smart Hub — Avvio rapido
# Esegui: bash start.sh

echo ""
echo "🚌 ATV Verona Smart Hub — Avvio..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js non trovato!"
  echo ""
  echo "   Installa Node.js con:"
  echo "   brew install node"
  echo ""
  exit 1
fi

echo "✅ Node.js $(node --version) trovato"

# Install backend deps
echo ""
echo "📦 Installazione dipendenze backend..."
cd backend && npm install --silent
echo "✅ Backend pronto"

# Install frontend deps
echo ""
echo "📦 Installazione dipendenze frontend..."
cd ../frontend && npm install --silent
echo "✅ Frontend pronto"

# Start both servers
echo ""
echo "🚀 Avvio server..."
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "   Premi Ctrl+C per fermare."
echo ""

# Start backend in background
cd ../backend && node server.js &
BACKEND_PID=$!

# Start frontend
cd ../frontend && npm run dev

# Kill backend when frontend stops
kill $BACKEND_PID 2>/dev/null
