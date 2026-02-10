# 🚀 Quick Start Guide - Aegis IDS

This guide shows you how to start all Aegis IDS services with a single command.

## 📋 Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **MongoDB Atlas** account (or local MongoDB) - Already configured in `.env`

## 🎯 Quick Start (Recommended)

### Windows
```bash
start-all.bat
```

### Linux/Mac
```bash
chmod +x start-all.sh
./start-all.sh
```

### Cross-platform (Node.js)
```bash
node start-all.js
```

## 📦 What Gets Started

The startup script automatically starts all services through a unified backend:

1. **🔐 Unified Backend** (Port 5000)
   - Auth service (Node.js)
   - IDS detection engine (Python)
   - Pentest scanning (Python)
   - Single entry point for all services

2. **🎨 Frontend** (Port 5173)
   - React dashboard
   - Real-time alerts
   - Analytics & visualizations

## 🌐 Access Points

After starting, you can access:

- **Frontend Dashboard**: http://localhost:5173
- **Unified Backend**: http://localhost:5000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:5000/health

## 🔧 Manual Start (Alternative)

If you prefer to start services individually:

### 1. Unified Backend
```bash
cd backend/unified
npm install  # First time only
npm start
```

### 2. Frontend
```bash
cd frontend_react
npm install  # First time only
npm run dev
```

## ⚙️ Configuration

### Auth Backend
- Edit `backend_auth/.env` to configure MongoDB connection
- Default: Uses MongoDB Atlas connection string

### Main Backend
- Set `MODE=demo` or `MODE=static` in environment
- Models should be in `artifacts/` directory

### Frontend
- API endpoints configured in `frontend_react/src/api/aegisClient.ts`
- Default: `http://localhost:8000` for main API
- Default: `http://localhost:5000` for auth API

## 🛑 Stopping Services

### Windows
- Close each command window, or press `Ctrl+C` in each

### Linux/Mac
- Press `Ctrl+C` in the terminal running `start-all.sh`
- All services will be stopped automatically

## 🐛 Troubleshooting

### Port Already in Use
If you see "port already in use" errors:
- **Port 5000**: Stop any other Node.js services
- **Port 8000**: Stop any other Python/FastAPI services
- **Port 5173**: Stop any other Vite/React dev servers

### Dependencies Not Found
Run these commands in each directory:
```bash
# Auth Backend
cd backend_auth && npm install

# Frontend
cd frontend_react && npm install

# Main Backend
pip install -r requirements.txt
```

### Virtual Environment Not Found
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### MongoDB Connection Issues
- Check `backend_auth/.env` file exists
- Verify MongoDB Atlas connection string is correct
- Ensure network allows connections to MongoDB Atlas

## 📝 Notes

- First startup may take longer due to dependency installation
- Services start in sequence with small delays to ensure proper initialization
- Logs are displayed in separate windows/terminals for each service
- The frontend will automatically reload when you make code changes

