#!/bin/bash
# ==============================================================================
# Aegis IDS - Unified Startup Script (Linux/Mac)
# Starts: Auth Backend (5000) + Main Backend (8000) + Frontend (5173)
# ==============================================================================

set -e

echo ""
echo "=========================================="
echo "🛡️  Aegis IDS - Starting All Services"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python not found! Please install Python first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ==============================================================================
# 1. Start Auth Backend (Port 5000)
# ==============================================================================
echo "[1/3] 🔐 Starting Auth Backend (port 5000)..."
cd backend_auth

# Check if .env exists
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "⚠️  Creating .env from .env.example..."
        cp .env.example .env
    else
        echo "⚠️  .env not found. Please create it manually."
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing auth backend dependencies..."
    npm install
fi

# Start auth backend in background
npm start > ../logs/auth_backend.log 2>&1 &
AUTH_PID=$!
cd ..
sleep 2
echo "✅ Auth Backend started (PID: $AUTH_PID)"
echo ""

# ==============================================================================
# 2. Start Main Backend (Port 8000)
# ==============================================================================
echo "[2/3] 🚀 Starting Main Backend (port 8000)..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please create it first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    kill $AUTH_PID 2>/dev/null || true
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export PYTHONPATH="$SCRIPT_DIR"
export MODE="${MODE:-demo}"

# Start main backend in background
cd backend/ids/serve
uvicorn app:app --reload --host 0.0.0.0 --port 8000 > ../../../logs/main_backend.log 2>&1 &
MAIN_PID=$!
cd ../../..
sleep 3
echo "✅ Main Backend started (PID: $MAIN_PID)"
echo ""

# ==============================================================================
# 3. Start Frontend (Port 5173)
# ==============================================================================
echo "[3/3] 🎨 Starting Frontend (port 5173)..."
cd frontend_react

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "=========================================="
echo "✅ All services starting!"
echo "=========================================="
echo ""
echo "🌐 Frontend:    http://localhost:5173"
echo "🔐 Auth API:     http://localhost:5000"
echo "🚀 Main API:     http://localhost:8000"
echo "📚 API Docs:     http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $AUTH_PID 2>/dev/null || true
    kill $MAIN_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start frontend (this will block)
npm run dev

