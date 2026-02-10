@echo off
echo ========================================
echo   AEGIS IDS - Complete Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Starting Auth Backend (port 5000)...
start "Aegis Auth" cmd /k "cd backend_auth && npm start"
timeout /t 3 /nobreak >nul

echo [2/4] Starting Main Backend (port 8000)...
start "Aegis Backend" cmd /k "venv\Scripts\activate && python -m uvicorn backend.ids.serve.app:app --host 0.0.0.0 --port 8000"
timeout /t 8 /nobreak >nul

echo [3/4] Starting Pentest Backend (port 8001)...
start "Aegis Pentest" cmd /k "venv\Scripts\activate && python -m uvicorn backend.pentest.api:app --host 0.0.0.0 --port 8001"
timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend (port 5173)...
start "Aegis Frontend" cmd /k "cd frontend_react && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   All services started!
echo ========================================
echo   Auth:     http://localhost:5000
echo   Backend:  http://localhost:8000
echo   Pentest:  http://localhost:8001
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Open your browser to: http://localhost:5173
echo.
pause
