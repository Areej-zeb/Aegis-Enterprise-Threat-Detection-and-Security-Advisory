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
start "Aegis Backend" cmd /k "cd backend\ids\serve && uvicorn app:app --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Ask user which frontend to start
echo.
echo Choose frontend to start:
echo 1. Streamlit Dashboard (recommended for ML monitoring)
echo 2. React Dashboard (modern web UI)
echo 3. Both
set /p choice="Enter choice (1/2/3): "

if "%choice%"=="1" (
    echo Starting Streamlit Dashboard (port 8501)...
    cd frontend_streamlit
    streamlit run aegis_dashboard.py --server.headless=true
) else if "%choice%"=="2" (
    echo Starting React Dashboard (port 5173)...
    cd frontend_react
    if not exist "node_modules\" (
        echo Installing Node.js dependencies...
        call npm install
    )
    call npm run dev
) else if "%choice%"=="3" (
    echo Starting both dashboards...
    start "Aegis Streamlit" cmd /k "cd frontend_streamlit && streamlit run aegis_dashboard.py --server.headless=true"
    cd frontend_react
    if not exist "node_modules\" (
        echo Installing Node.js dependencies...
        call npm install
    )
    call npm run dev
) else (
    echo Invalid choice
    exit /b 1
)
