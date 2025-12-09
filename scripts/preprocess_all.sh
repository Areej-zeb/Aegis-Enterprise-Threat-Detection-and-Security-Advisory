#!/usr/bin/env bash
#
# preprocess_all.sh
# Auto-discovers and processes all datasets in datasets/raw/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🛡️  AEGIS IDS - AUTO-DISCOVERY PREPROCESSING${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies if needed
if ! python -c "import tqdm" 2>/dev/null; then
    echo -e "${YELLOW}Installing tqdm for progress bars...${NC}"
    pip install -q tqdm
fi

# Run the multi-dataset pipeline
echo -e "${GREEN}Processing all datasets in datasets/raw/...${NC}"
echo ""

python -m backend.ids.data_pipeline.pipeline --all

echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}✅ All datasets processed successfully!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "Next step: Train models with ${BLUE}./scripts/train_ids.sh${NC}"
echo ""
