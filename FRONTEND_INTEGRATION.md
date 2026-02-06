# Aegis IDS - Frontend Integration Guide

## Overview

This project now includes both Streamlit and React frontends:

### 1. **Streamlit Dashboard** (`frontend_streamlit/`)

- Python-based dashboard
- Real-time threat detection visualization
- Supports SYN Flood, MITM ARP Spoofing, and DNS Exfiltration

### 2. **React Dashboard** (`frontend_react/`)

- Modern web UI built with React + Vite
- WebSocket-based live alerts
- Professional authentication and settings pages

## Setup Instructions

### Backend Setup

1. **Activate virtual environment:**

   ```bash
   source venv/bin/activate  # Linux/Mac
   .\venv\Scripts\activate   # Windows
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Start FastAPI backend:**
   ```bash
   cd backend/ids/serve
   uvicorn app:app --reload --port 8000
   ```

### Streamlit Frontend Setup

```bash
cd frontend_streamlit
streamlit run aegis_dashboard.py --server.headless=true
```

Access at: http://localhost:8501

### React Frontend Setup

1. **Install Node.js dependencies:**

   ```bash
   cd frontend_react
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Access at: http://localhost:5173

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AEGIS IDS SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  React Frontend  │         │ Streamlit Frontend│         │
│  │  (Port 5173)     │         │   (Port 8501)     │         │
│  └────────┬─────────┘         └────────┬──────────┘         │
│           │                            │                    │
│           └────────────┬───────────────┘                    │
│                        │                                    │
│                  ┌─────▼─────┐                              │
│                  │  FastAPI  │                              │
│                  │  Backend  │                              │
│                  │(Port 8000)│                              │
│                  └─────┬─────┘                              │
│                        │                                    │
│           ┌────────────┼────────────┐                       │
│           │            │            │                       │
│     ┌─────▼────┐ ┌────▼────┐ ┌────▼────┐                  │
│     │XGBoost   │ │XGBoost  │ │Ensemble │                  │
│     │SYN Model │ │MITM Model│ │DNS Model│                  │
│     └──────────┘ └─────────┘ └─────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Streamlit Dashboard

✅ Real-time flow analysis
✅ 3-phase detection (SYN, MITM, DNS)
✅ Live metrics and charts
✅ Threat intelligence (MITRE ATT&CK)
✅ Auto-refresh monitoring

### React Dashboard

✅ Modern UI/UX with Lucide icons
✅ WebSocket live alerts
✅ Authentication system
✅ Settings management
✅ Recharts visualization
✅ Responsive design

## API Endpoints

### Health & Status

- `GET /api/health` - Service health check
- `GET /api/models/status` - ML model loading status

### Alerts

- `GET /api/alerts` - Get alerts (mode-dependent)
- `GET /api/alerts/{id}` - Get specific alert
- `GET /api/mock/alerts?n=50&phase=dataset` - Generate mock alerts
- `GET /api/mock/overview` - Get overview metrics
- `WS /ws/alerts` - WebSocket live alert stream

### Modes

Set via environment variable `MODE`:

- `demo` - Random simulated alerts
- `static` - Preloaded seed alerts
- `live` - Real-time packet capture alerts

## Environment Variables

Create `.env` file:

```bash
# Backend
MODE=static
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8501

# Frontend
VITE_API_URL=http://localhost:8000
```

## Development

### Run all services (recommended):

```bash
# Terminal 1: Backend
cd backend/ids/serve
uvicorn app:app --reload --port 8000

# Terminal 2: Streamlit
cd frontend_streamlit
streamlit run aegis_dashboard.py

# Terminal 3: React
cd frontend_react
npm run dev
```

## Models

### SYN Flood Detection

- Model: XGBoost
- Accuracy: 99.99%
- Classes: 7 attack types + BENIGN

### MITM ARP Spoofing

- Model: XGBoost
- Accuracy: 85.47%
- Classes: ARP_Spoofing, Sniffing, BENIGN

### DNS Exfiltration

- Model: Ensemble (RF + KNN + DT + ET)
- Accuracy: 96.54%
- Classes: ATTACK, BENIGN

## Deployment

### Docker (Coming Soon)

```bash
docker-compose up
```

### Production

1. Build React frontend: `npm run build`
2. Serve with Nginx or similar
3. Run FastAPI with Gunicorn: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app`

## Troubleshooting

### Port Conflicts

- Change ports in respective config files
- Update CORS settings in backend

### Model Not Loading

- Check `artifacts/` directory exists
- Ensure models are in correct subdirectories
- Check file permissions

### WebSocket Connection Failed

- Verify backend is running on port 8000
- Check CORS configuration
- Inspect browser console for errors

## Contributing

- Backend: Python FastAPI
- Streamlit: Python Streamlit
- React: TypeScript + Vite
- Models: scikit-learn, XGBoost

## License

See LICENSE file
