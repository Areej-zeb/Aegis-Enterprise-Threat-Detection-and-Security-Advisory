#!/bin/bash
# ==============================================================================
# Aegis IDS - Enhanced Model Training Script v2
# ==============================================================================
# Trains Logistic Regression, Random Forest, and XGBoost models on preprocessed data.
# Features:
#   - Real-time progress monitoring with tqdm
#   - CUDA verification and GPU usage tracking
#   - Automatic checkpoints during training
#   - Multi-dataset support
#
# Usage:
#   ./scripts/train_ids.sh                 # Train on all datasets
#   ./scripts/train_ids.sh --dataset Syn   # Train on specific dataset
#
# Requirements:
#   - Virtual environment activated (conda or venv)
#   - Preprocessed data in datasets/processed/<dataset>/
#   - GPU (RTX 3070) with CUDA for acceleration (optional but recommended)
# ==============================================================================

set -e

echo "=========================================="
echo "🤖 Aegis IDS - Enhanced Model Training v2"
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

# Install tqdm if not present
if ! python -c "import tqdm" 2>/dev/null; then
    echo "⚠️  Installing tqdm for progress bars..."
    pip install -q tqdm
    echo "✓ tqdm installed"
fi

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
echo "🧠 Starting Enhanced Training..."
echo "=========================================="
echo ""

# Run enhanced training script with arguments
if [ "$1" == "--dataset" ] && [ -n "$2" ]; then
    echo "Training on dataset: $2"
    # Check if --gpu-only flag is passed
    if [ "$3" == "--gpu-only" ]; then
        echo "⚡ GPU-ONLY MODE: Skipping slow CPU models"
        python -m backend.ids.models.xgb_baseline --dataset "$2" --gpu-only
    else
        python -m backend.ids.models.xgb_baseline --dataset "$2"
    fi
elif [ "$1" == "--all" ]; then
    echo "Training on all datasets..."
    python -m backend.ids.models.xgb_baseline --all
else
    echo "Training on all available datasets..."
    python -m backend.ids.models.xgb_baseline --all
fi

echo ""
echo "=========================================="
echo "✅ Training Complete!"
echo "=========================================="
echo ""
echo "📁 Outputs:"
echo "  - Models: artifacts/<dataset>/xgb_baseline.joblib"
echo "  - Checkpoints: checkpoints/<dataset>/"
echo "  - SHAP values: seed/shap_example.json"
echo "  - Metrics: backend/ids/experiments/<dataset>_baseline.md"
echo ""
echo "Next steps:"
echo "  1. Review metrics: cat backend/ids/experiments/*_baseline.md"
echo "  2. Start backend: ./scripts/run_backend.sh"
echo "  3. Start frontend: ./scripts/run_frontend.sh"
echo ""

echo ""
echo "=========================================="
echo "✅ Training Complete!"
echo "=========================================="
echo ""
echo "📁 Outputs:"
echo "  - Trained model: artifacts/xgb_baseline.joblib"
echo "  - SHAP values: seed/shap_example.json"
echo "  - Metrics report: backend/ids/experiments/ids_baseline.md"
echo ""
echo "Next steps:"
echo "  1. Review metrics: cat backend/ids/experiments/ids_baseline.md"
echo "  2. Start backend: ./scripts/run_backend.sh"
echo "  3. Start frontend: ./scripts/run_frontend.sh"
echo ""
