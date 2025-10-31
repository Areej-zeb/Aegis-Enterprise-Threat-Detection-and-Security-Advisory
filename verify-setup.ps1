#!/usr/bin/env pwsh
# ==============================================================================
# Aegis IDS - Setup Verification Script
# ==============================================================================
# This script verifies that your Aegis IDS installation is complete
# ==============================================================================

Write-Host "🛡️  Aegis IDS - Setup Verification" -ForegroundColor Cyan
Write-Host "=" * 60

# Check Python
Write-Host "`n✓ Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
Write-Host "`n✓ Checking virtual environment..." -ForegroundColor Yellow
if (Test-Path ".venv-1" -or Test-Path "venv" -or Test-Path ".venv") {
    Write-Host "  ✅ Virtual environment found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No virtual environment found. Run: python -m venv .venv-1" -ForegroundColor Yellow
}

# Check required files
Write-Host "`n✓ Checking project structure..." -ForegroundColor Yellow
$requiredFiles = @(
    "README.md",
    "requirements.txt",
    "backend/ids/serve/app.py",
    "frontend_streamlit/app.py",
    "seed/alerts.json",
    ".env.example"
)

$allPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $allPresent = $false
    }
}

# Check .env file
Write-Host "`n✓ Checking configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  .env file not found. Copy .env.example to .env" -ForegroundColor Yellow
    Write-Host "     Run: Copy-Item .env.example .env" -ForegroundColor Gray
}

# Summary
Write-Host "`n" + "=" * 60
if ($allPresent) {
    Write-Host "✅ Setup verification passed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Activate virtual environment: .\.venv-1\Scripts\activate" -ForegroundColor Gray
    Write-Host "  2. Install dependencies: pip install -r requirements.txt" -ForegroundColor Gray
    Write-Host "  3. Start services: .\start-aegis.ps1" -ForegroundColor Gray
    Write-Host "  4. Open dashboard: http://localhost:8501" -ForegroundColor Gray
} else {
    Write-Host "❌ Setup verification failed. Please fix missing files." -ForegroundColor Red
    exit 1
}
