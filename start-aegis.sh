#!/bin/bash
# ==============================================================================
# Aegis IDS - WSL/Linux Startup Script
# ==============================================================================

set -e

echo "=========================================="
echo "🛡️  Aegis IDS - Starting in WSL/Linux"
echo "=========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found!"
    echo "Install: sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

echo "✓ Python: $(python3 --version)"

# Create/activate venv (not .venv)
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check and install dependencies if needed
if ! python3 -c "import streamlit, fastapi" &> /dev/null; then
    echo "📥 Installing dependencies..."
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# Set environment
export PYTHONPATH=$(pwd)
export MODE=demo
echo "✓ Environment configured (MODE=demo)"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down Aegis IDS..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "=========================================="
echo "🚀 Starting Backend API (port 8000)..."
echo "=========================================="
uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "✓ Backend PID: $BACKEND_PID"
echo ""

# Wait for backend
echo "⏳ Waiting for backend to initialize..."
sleep 4

# Start dashboard
echo "=========================================="
echo "📊 Starting Streamlit Dashboard (port 8501)..."
echo "=========================================="
echo ""
echo "🌐 Dashboard URL: http://localhost:8501"
echo "📡 Backend API:   http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="
echo ""

cd frontend_streamlit
streamlit run app.py --server.port 8501 --server.address 0.0.0.0

cleanup
