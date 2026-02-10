# Aegis Unified Backend

Consolidated backend combining Auth, IDS, and Pentest services into a single entry point.

## Architecture

```
backend/unified/
├── server.js          # Main Express server (proxy + auth routes)
├── package.json       # Node.js dependencies
├── .env              # Configuration
└── README.md         # This file

Services:
├── Auth (Node.js)     → Port 5000 (Express)
├── IDS (Python)       → Port 8000 (FastAPI)
└── Pentest (Python)   → Port 8000 (FastAPI)
```

## Features

- **Single Entry Point**: All services accessible through port 5000
- **No Functionality Changes**: Each service runs independently
- **Automatic Proxying**: HTTP/WebSocket requests routed to appropriate backend
- **Graceful Shutdown**: Properly stops all child processes

## Installation

```bash
cd backend/unified
npm install
```

## Configuration

Edit `.env` to configure:
- `PORT`: Express server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `MODE`: Python backend mode (demo, static, live)
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Auth | `http://localhost:5000/api/auth` | Login, signup, password reset |
| IDS | `http://localhost:8000/api/detection` | Live detections, metrics |
| Pentest | `http://localhost:8000/api/pentest` | Vulnerability scanning |
| Docs | `http://localhost:8000/docs` | FastAPI documentation |
| Health | `http://localhost:5000/health` | Service status |

## How It Works

1. **Express Server** (Node.js)
   - Handles all `/api/auth` routes directly
   - Proxies other requests to Python backend
   - Manages WebSocket upgrades

2. **Python Backend** (FastAPI)
   - Runs as child process on port 8000
   - Handles IDS detection and pentest scanning
   - Provides WebSocket streams

3. **Routing**
   - `/api/auth/*` → Express (Node.js)
   - `/api/detection/*` → Python (FastAPI)
   - `/api/pentest/*` → Python (FastAPI)
   - `/api/metrics/*` → Python (FastAPI)
   - `/ws/*` → Python (FastAPI)

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Python Backend Not Starting
- Ensure Python 3.8+ is installed
- Check virtual environment is activated
- Verify `backend/ids/serve/app.py` exists

### MongoDB Connection Failed
- Check `MONGODB_URI` in `.env`
- Verify network access to MongoDB Atlas
- Ensure credentials are correct

## Migration from Separate Services

### Old Setup
```bash
# Terminal 1
cd backend_auth && npm start

# Terminal 2
cd backend/ids/serve && uvicorn app:app --port 8000

# Terminal 3
cd backend/pentest && uvicorn api:app --port 8001
```

### New Setup
```bash
# Single command
cd backend/unified && npm start
```

## Environment Variables

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Python Backend
PYTHON_PORT=8000
MODE=demo|static|live

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Auth
JWT_SECRET=your_secret_key
JWT_EXPIRY=24h
```

## Notes

- All services maintain their original functionality
- No code changes required in individual services
- Unified backend is optional - services can still run separately
- WebSocket connections are properly upgraded and proxied
- Graceful shutdown ensures clean process termination
