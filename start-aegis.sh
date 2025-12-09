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

# Start backend in background
echo "🚀 Starting FastAPI backend (port 8000)..."
cd backend/ids/serve
uvicorn app:app --port 8000 &
BACKEND_PID=$!
cd ../../..

# Wait for backend to start
sleep 3

# Ask user which frontend to start
echo ""
echo "Choose frontend to start:"
echo "1. Streamlit Dashboard (recommended for ML monitoring)"
echo "2. React Dashboard (modern web UI)"
echo "3. Both"
read -p "Enter choice (1/2/3): " choice

case $choice in
    1)
        echo "🎨 Starting Streamlit Dashboard (port 8501)..."
        cd frontend_streamlit
        streamlit run aegis_dashboard.py --server.headless=true
        ;;
    2)
        echo "🎨 Starting React Dashboard (port 5173)..."
        cd frontend_react
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing Node.js dependencies..."
            npm install
        fi
        npm run dev
        ;;
    3)
        echo "🎨 Starting both dashboards..."
        cd frontend_streamlit
        streamlit run aegis_dashboard.py --server.headless=true &
        cd ../frontend_react
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing Node.js dependencies..."
            npm install
        fi
        npm run dev
        ;;
    *)
        echo "❌ Invalid choice"
        kill $BACKEND_PID
        exit 1
        ;;
esac

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
