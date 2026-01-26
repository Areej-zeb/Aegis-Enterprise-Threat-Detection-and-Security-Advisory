@echo off
echo 🚀 Starting Aegis Auth Backend...

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo ✅ .env file created. Please review and update if needed.
    ) else (
        echo ❌ .env.example not found. Please create .env manually.
        exit /b 1
    )
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

REM Start the server
echo ✅ Starting server on port 5000...
npm start

