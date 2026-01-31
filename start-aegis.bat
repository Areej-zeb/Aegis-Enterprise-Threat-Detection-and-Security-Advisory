@echo off
REM Quick Start Script for Aegis IDS (Windows)

echo Starting Aegis IDS System...

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment not found. Please create it first:
    echo    python -m venv venv
    echo    venv\Scripts\activate
    echo    pip install -r requirements.txt
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if models exist
if not exist "artifacts\" (
    echo Models not found. Please train models first.
    exit /b 1
)

REM Start backend in background
echo Starting FastAPI backend (port 8000)...
start "Aegis Backend" cmd /k "set PYTHONPATH=. && uvicorn backend.ids.serve.app:app --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

echo Starting React Dashboard (port 5173)...
cd frontend_react
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    call npm install
)
call npm run dev
