@echo off
echo ========================================
echo   AEGIS IDS - Complete Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Unified Backend (port 5000)...
start "Aegis Backend" cmd /k "cd backend/unified && npm install && npm start"
timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend (port 5173)...
start "Aegis Frontend" cmd /k "cd frontend_react && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   All services started!
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Open your browser to: http://localhost:5173
echo.
pause
