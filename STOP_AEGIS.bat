@echo off
echo ========================================
echo   AEGIS IDS - Stopping All Services
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Stopping all Python processes...
taskkill /F /IM python.exe >nul 2>&1

echo.
echo ========================================
echo   All services stopped!
echo ========================================
pause
