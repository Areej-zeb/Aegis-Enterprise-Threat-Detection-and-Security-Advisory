#!/bin/bash
# ==============================================================================
# Aegis IDS - CNN-LSTM Model Training Script
# ==============================================================================
# Trains CNN-LSTM hybrid model for network intrusion detection.
# Features:
#   - GPU acceleration with CUDA
#   - Real-time progress monitoring
#   - Automatic early stopping
#   - Checkpoints during training
#
# Usage:
#   ./scripts/train_cnn_lstm.sh                    # Train on all datasets
#   ./scripts/train_cnn_lstm.sh --dataset Syn      # Train on specific dataset
#   ./scripts/train_cnn_lstm.sh --dataset Syn --gpu-only  # Force GPU
#
# Requirements:
#   - Virtual environment activated
#   - Preprocessed data in datasets/processed/<dataset>/
#   - GPU with CUDA (strongly recommended)
# ==============================================================================

set -e

echo "=========================================="
echo "🧠 Aegis IDS - CNN-LSTM Training"
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

# Set PYTHONPATH
export PYTHONPATH="$PROJECT_ROOT"
echo "✓ PYTHONPATH: $PYTHONPATH"
echo ""

# Check for processed data
if [ ! -d "datasets/processed" ]; then
    echo "❌ ERROR: datasets/processed/ directory not found!"
    echo "Please run preprocessing first:"
    echo "  ./scripts/preprocess_all.sh"
    exit 1
fi

echo "=========================================="
echo "🚀 Starting CNN-LSTM Training..."
echo "=========================================="
echo ""

# Run CNN-LSTM training with arguments
if [ "$1" == "--dataset" ] && [ -n "$2" ]; then
    echo "Training on dataset: $2"
    if [ "$3" == "--gpu-only" ]; then
        echo "⚡ GPU-ONLY MODE"
        python -m backend.ids.models.cnn_lstm --dataset "$2" --gpu-only
    else
        python -m backend.ids.models.cnn_lstm --dataset "$2"
    fi
elif [ "$1" == "--all" ]; then
    echo "Training on all datasets..."
    python -m backend.ids.models.cnn_lstm --all
else
    echo "Training on all available datasets..."
    python -m backend.ids.models.cnn_lstm --all
fi

echo ""
echo "=========================================="
echo "✅ CNN-LSTM Training Complete!"
echo "=========================================="
echo ""
echo "📁 Outputs:"
echo "  - Model: artifacts/<dataset>/cnn_lstm.joblib"
echo "  - Checkpoints: checkpoints/<dataset>/cnn_lstm_best_*.pt"
echo ""
echo "Next steps:"
echo "  1. Compare with XGBoost: cat backend/ids/experiments/*_baseline.md"
echo "  2. Start backend: ./scripts/run_backend.sh"
echo "  3. Start frontend: ./scripts/run_frontend.sh"
echo ""
