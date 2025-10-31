#!/bin/bash
# Aegis IDS Quick Start Script for Linux/Mac
# This script starts both the backend API and frontend dashboard

set -e

echo "========================================"
echo "  🛡️  AEGIS IDS - Quick Start"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 not found. Please install Python 3.11+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✓ Python found: $PYTHON_VERSION"

# Check if virtual environment exists
if [ -d ".venv" ]; then
    VENV_PATH=".venv"
elif [ -d "venv" ]; then
    VENV_PATH="venv"
else
    echo "Creating virtual environment..."
    python3 -m venv .venv
    VENV_PATH=".venv"
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo "Activating virtual environment ($VENV_PATH)..."
source "$VENV_PATH/bin/activate"

# Install dependencies if needed
echo "Checking dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
else
    pip install -q -r backend/ids/requirements.txt
    pip install -q streamlit requests plotly
fi

echo "✓ Dependencies installed"
echo ""

# Set environment variables
export MODE=demo
export PYTHONPATH=$(pwd)
echo "✓ Environment configured (MODE=demo)"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "Shutting down Aegis IDS..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo "========================================"
echo "Starting IDS Backend API..."
echo "========================================"
echo ""

uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "✓ Backend started on http://localhost:8000 (PID: $BACKEND_PID)"
echo "  API Docs: http://localhost:8000/docs"
echo ""

# Wait for backend to start
echo "Waiting for backend to be ready..."
sleep 3

# Start Streamlit dashboard
echo "========================================"
echo "Starting Streamlit Dashboard..."
echo "========================================"
echo ""
echo "Dashboard will open at: http://localhost:8501"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

cd frontend_streamlit
streamlit run app.py

# Cleanup on exit
cleanup
