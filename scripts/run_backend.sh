#!/bin/bash
# ==============================================================================
# Aegis IDS - Backend Server Script
# ==============================================================================
# Starts the FastAPI backend server with model inference.
# The backend will load the trained XGBoost model and serve real predictions.
#
# Usage:
#   ./scripts/run_backend.sh
#
# Access:
#   - API: http://localhost:8000
#   - API Docs: http://localhost:8000/docs
# ==============================================================================

set -e

echo "=========================================="
echo "🚀 Aegis IDS - Starting Backend"
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

# Set environment variables
export PYTHONPATH="$PROJECT_ROOT"
export MODE="${MODE:-demo}"  # demo or static

echo "✓ PYTHONPATH: $PYTHONPATH"
echo "✓ MODE: $MODE"
echo ""

# Check if trained model exists
if [ ! -f "artifacts/xgb_baseline.joblib" ]; then
    echo "⚠️  WARNING: Trained model not found!"
    echo "The backend will use simulated alerts until you train a model."
    echo "To train: ./scripts/train_ids.sh"
    echo ""
fi

echo "=========================================="
echo "📡 Starting FastAPI Backend..."
echo "=========================================="
echo ""
echo "🌐 Backend URL: http://localhost:8000"
echo "📚 API Docs:    http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="
echo ""

# Start uvicorn server
uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000
