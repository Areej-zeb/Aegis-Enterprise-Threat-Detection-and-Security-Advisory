# Aegis IDS Quick Start Script for Windows PowerShell
# This script starts both the backend API and frontend dashboard

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🛡️  AEGIS IDS - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.11+ first." -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
$venvPath = ""
if (Test-Path ".venv") {
    $venvPath = ".venv"
} elseif (Test-Path "venv") {
    $venvPath = "venv"
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    $venvPath = ".venv"
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment ($venvPath)..." -ForegroundColor Yellow
& ".\$venvPath\Scripts\Activate.ps1"

# Install dependencies if needed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "requirements.txt") {
    pip install -q -r requirements.txt
} else {
    pip install -q -r backend/ids/requirements.txt
    pip install -q streamlit requests plotly
}

Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Set environment variables
$env:MODE = "demo"
$env:PYTHONPATH = $PWD
Write-Host "✓ Environment configured (MODE=demo)" -ForegroundColor Green
Write-Host ""

# Start backend in background
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting IDS Backend API..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "& {`
        `$env:MODE='demo'; `
        `$env:PYTHONPATH='$PWD'; `
        if (Test-Path '.venv\Scripts\Activate.ps1') { .\.venv\Scripts\Activate.ps1 } else { .\venv\Scripts\Activate.ps1 }; `
        Write-Host 'IDS Backend starting on http://localhost:8000' -ForegroundColor Green; `
        uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000`
    }"

Write-Host "Backend starting in separate window..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Streamlit dashboard
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Streamlit Dashboard..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard will open at: http://localhost:8501" -ForegroundColor Green
Write-Host "API Documentation at: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the dashboard" -ForegroundColor Yellow
Write-Host ""

Set-Location frontend_streamlit
streamlit run app.py
