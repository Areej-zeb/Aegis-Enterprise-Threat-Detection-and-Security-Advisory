@echo off
REM ==============================================================================
REM Aegis Docker Quick Start - Windows
REM ==============================================================================

echo.
echo ========================================
echo   Aegis Docker Deployment
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env exists
if not exist .env (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo [WARNING] Please edit .env file and update passwords!
    echo Press any key to continue after editing .env...
    pause
)

echo [INFO] Building Docker images...
docker-compose build

if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [INFO] Starting containers...
docker-compose up -d

if errorlevel 1 (
    echo [ERROR] Failed to start containers!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deployment Successful!
echo ========================================
echo.
echo Frontend:  http://localhost
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo Auth:      http://localhost:5000
echo.
echo View logs: docker-compose logs -f
echo Stop:      docker-compose down
echo.
echo ========================================

pause
