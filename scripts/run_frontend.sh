#!/bin/bash
# ==============================================================================
# Aegis IDS - Frontend Dashboard Script
# ==============================================================================
# Starts the Streamlit web dashboard.
# The dashboard connects to the backend API to display alerts and analytics.
#
# Usage:
#   ./scripts/run_frontend.sh
#
# Access:
#   - Dashboard: http://localhost:8501
# ==============================================================================

set -e

echo "=========================================="
echo "📊 Aegis IDS - Starting Dashboard"
echo "=========================================="
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]] && [[ -z "$CONDA_DEFAULT_ENV" ]]; then
    echo "⚠️  No virtual environment detected, activating venv..."
    if [ -d "venv" ]; then
        source venv/bin/activate
        echo "✓ Activated: venv"
    else
        echo "❌ ERROR: venv not found!"
        echo "Please create it first: python3 -m venv venv"
        exit 1
    fi
else
    echo "✓ Environment: ${CONDA_DEFAULT_ENV:-${VIRTUAL_ENV##*/}}"
fi
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "⚠️  WARNING: Backend not responding!"
    echo "Please start the backend first:"
    echo "  ./scripts/run_backend.sh"
    echo ""
    echo "Continuing anyway..."
    echo ""
fi

echo "=========================================="
echo "🎨 Starting Streamlit Dashboard..."
echo "=========================================="
echo ""
echo "🌐 Dashboard URL: http://localhost:8501"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="
echo ""

# Start streamlit
cd frontend_streamlit
streamlit run app.py --server.port 8501 --server.address 0.0.0.0 --server.headless true --browser.gatherUsageStats false
