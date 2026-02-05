#!/bin/bash
# ==============================================================================
# Aegis Docker Quick Start - Linux/Mac
# ==============================================================================

set -e

echo ""
echo "========================================"
echo "  Aegis Docker Deployment"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[OK] Docker is running"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "[INFO] Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "[WARNING] Please edit .env file and update passwords!"
    echo "Press Enter to continue after editing .env..."
    read
fi

echo "[INFO] Building Docker images..."
docker-compose build

echo ""
echo "[INFO] Starting containers..."
docker-compose up -d

echo ""
echo "========================================"
echo "  Deployment Successful!"
echo "========================================"
echo ""
echo "Frontend:  http://localhost"
echo "Backend:   http://localhost:8000"
echo "API Docs:  http://localhost:8000/docs"
echo "Auth:      http://localhost:5000"
echo ""
echo "View logs: docker-compose logs -f"
echo "Stop:      docker-compose down"
echo ""
echo "========================================"
echo ""
