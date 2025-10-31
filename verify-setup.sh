#!/bin/bash
# ==============================================================================
# Aegis IDS - Setup Verification Script
# ==============================================================================
# This script verifies that your Aegis IDS installation is complete
# ==============================================================================

echo "🛡️  Aegis IDS - Setup Verification"
echo "============================================================"

# Check Python
echo -e "\n✓ Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "  ✅ $PYTHON_VERSION"
else
    echo "  ❌ Python not found. Please install Python 3.9+"
    exit 1
fi

# Check if virtual environment exists
echo -e "\n✓ Checking virtual environment..."
if [ -d ".venv-1" ] || [ -d "venv" ] || [ -d ".venv" ]; then
    echo "  ✅ Virtual environment found"
else
    echo "  ⚠️  No virtual environment found. Run: python3 -m venv .venv-1"
fi

# Check required files
echo -e "\n✓ Checking project structure..."
REQUIRED_FILES=(
    "README.md"
    "requirements.txt"
    "backend/ids/serve/app.py"
    "frontend_streamlit/app.py"
    "seed/alerts.json"
    ".env.example"
)

ALL_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file missing"
        ALL_PRESENT=false
    fi
done

# Check .env file
echo -e "\n✓ Checking configuration..."
if [ -f ".env" ]; then
    echo "  ✅ .env file exists"
else
    echo "  ⚠️  .env file not found. Copy .env.example to .env"
    echo "     Run: cp .env.example .env"
fi

# Summary
echo ""
echo "============================================================"
if [ "$ALL_PRESENT" = true ]; then
    echo "✅ Setup verification passed!"
    echo -e "\nNext steps:"
    echo "  1. Activate virtual environment: source .venv-1/bin/activate"
    echo "  2. Install dependencies: pip install -r requirements.txt"
    echo "  3. Start services: ./start-aegis.sh"
    echo "  4. Open dashboard: http://localhost:8501"
else
    echo "❌ Setup verification failed. Please fix missing files."
    exit 1
fi
