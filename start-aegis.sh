#!/bin/bash
# Quick Start Script for Aegis IDS

echo "🛡️  Starting Aegis IDS System..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please create it first:"
    echo "   python -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if models exist
if [ ! -d "artifacts" ]; then
    echo "❌ Models not found. Please train models first."
    exit 1
fi

# Start auth backend in background
echo "🔐 Starting Auth Backend (port 5000)..."
cd backend_auth
npm start &
AUTH_PID=$!
cd ..
sleep 2

# Start main backend in background
echo "🚀 Starting FastAPI backend (port 8000)..."
export PYTHONPATH=$PYTHONPATH:.
uvicorn backend.ids.serve.app:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 3

# Start pentest backend in background
echo "🔍 Starting Pentest Backend (port 8001)..."
uvicorn backend.pentest.api:app --host 0.0.0.0 --port 8001 &
PENTEST_PID=$!
sleep 2

# Start React Dashboard (port 5173)
cd frontend_react
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi
echo "🎨 Starting React Dashboard (port 5173)..."
npm run dev

# Cleanup on exit
trap "kill $AUTH_PID $BACKEND_PID $PENTEST_PID" EXIT
