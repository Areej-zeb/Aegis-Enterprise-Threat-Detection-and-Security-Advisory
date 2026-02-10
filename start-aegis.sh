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

# Start unified backend in background
echo "🚀 Starting Unified Backend (port 5000)..."
cd backend/unified
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
cd ../..
sleep 3

# Start React Dashboard (port 5173)
cd frontend_react
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi
echo "🎨 Starting React Dashboard (port 5173)..."
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
