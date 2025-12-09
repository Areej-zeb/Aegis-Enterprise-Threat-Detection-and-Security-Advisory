@echo off
REM ==============================================================================
REM Aegis IDS - Unified Startup Script (Windows)
REM Starts: Auth Backend (5000) + Main Backend (8000) + Frontend (5173)
REM ==============================================================================

echo.
echo ==========================================
echo 🛡️  Aegis IDS - Starting All Services
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found! Please install Python first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM ==============================================================================
REM 1. Start Auth Backend (Port 5000)
REM ==============================================================================
echo [1/3] 🔐 Starting Auth Backend (port 5000)...
cd backend_auth

REM Check if .env exists
if not exist .env (
    if exist .env.example (
        echo ⚠️  Creating .env from .env.example...
        copy .env.example .env >nul
    ) else (
        echo ⚠️  .env not found. Please create it manually.
    )
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing auth backend dependencies...
    call npm install
)

start "Aegis Auth Backend" cmd /k "npm start"
cd ..
timeout /t 2 /nobreak >nul
echo ✅ Auth Backend started
echo.

REM ==============================================================================
REM 2. Start Main Backend (Port 8000)
REM ==============================================================================
echo [2/3] 🚀 Starting Main Backend (port 8000)...

REM Check if virtual environment exists
if not exist "venv\" (
    echo ❌ Virtual environment not found!
    echo Please create it first:
    echo    python -m venv venv
    echo    venv\Scripts\activate
    echo    pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment and start backend
start "Aegis Main Backend" cmd /k "venv\Scripts\activate && cd backend\ids\serve && uvicorn app:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo ✅ Main Backend started
echo.

REM ==============================================================================
REM 3. Start Frontend (Port 5173)
REM ==============================================================================
echo [3/3] 🎨 Starting Frontend (port 5173)...
cd frontend_react

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing frontend dependencies...
    call npm install
)

echo.
echo ==========================================
echo ✅ All services starting!
echo ==========================================
echo.
echo 🌐 Frontend:    http://localhost:5173
echo 🔐 Auth API:     http://localhost:5000
echo 🚀 Main API:     http://localhost:8000
echo 📚 API Docs:     http://localhost:8000/docs
echo.
echo Press Ctrl+C in this window to stop the frontend
echo (Other services will continue in their own windows)
echo ==========================================
echo.

call npm run dev

