@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   AEGIS IDS - Complete Startup
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/5] Installing Frontend dependencies...
pushd frontend_react
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    popd
    pause
    exit /b 1
)
popd
timeout /t 2 /nobreak >nul

echo [2/5] Installing Unified Backend dependencies...
pushd backend\unified
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install unified backend dependencies
    popd
    pause
    exit /b 1
)
popd
timeout /t 2 /nobreak >nul

echo [3/5] Installing Auth Backend dependencies...
pushd backend_auth
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install auth backend dependencies
    popd
    pause
    exit /b 1
)
popd
timeout /t 2 /nobreak >nul

echo [4/5] Starting Unified Backend (port 5000)...
echo   - Auth Backend on port 5001
echo   - IDS detection engine on port 8000
echo   - Pentest scanning on port 8000
start "Aegis Unified Backend" cmd /k "cd /d "%~dp0backend\unified" && npm start"
timeout /t 6 /nobreak >nul

echo [5/5] Starting Frontend (port 5173)...
start "Aegis Frontend" cmd /k "cd /d "%~dp0frontend_react" && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo ========================================
echo   ✅ All services started successfully!
echo ========================================
echo.
echo 📍 Access Points:
echo   Frontend Dashboard:  http://localhost:5173
echo   Unified Backend:     http://localhost:5000
echo   Auth API:            http://localhost:5000/api/auth
echo   IDS API:             http://localhost:8000/api/detection
echo   Pentest API:         http://localhost:8000/api/pentest
echo   API Documentation:   http://localhost:8000/docs
echo   Health Check:        http://localhost:5000/health
echo.
echo 🔐 Default Login (if MongoDB unavailable):
echo   Email:    admin@aegis.local
echo   Password: admin123
echo.
echo ========================================
echo.

REM Wait a moment before opening browser
timeout /t 3 /nobreak >nul

REM Try to open browser
start http://localhost:5173

echo.
echo 🎯 Opening browser to http://localhost:5173
echo.
echo ⏹️  To stop all services:
echo   - Close each command window, or
echo   - Press Ctrl+C in each window
echo.
echo 📝 Logs are displayed in separate windows for each service
echo.
pause
