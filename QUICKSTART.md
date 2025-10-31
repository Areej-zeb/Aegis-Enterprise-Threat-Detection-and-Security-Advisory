# Quick Reference Guide for Aegis IDS

## 🚀 One-Command Start

### Windows PowerShell
```powershell
.\start-aegis.ps1
```

### Linux/Mac
```bash
chmod +x start-aegis.sh
./start-aegis.sh
```

---

## 📍 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Dashboard** | http://localhost:8501 | Main UI |
| **API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **ReDoc** | http://localhost:8000/redoc | Alternative API docs |

---

## 🎛️ Environment Modes

### Demo Mode (Default)
```powershell
$env:MODE = "demo"  # Windows
export MODE=demo    # Linux/Mac
```
- Generates random alerts continuously
- Best for: Live demonstrations, testing
- Alert frequency: 1-2 per second

### Static Mode
```powershell
$env:MODE = "static"  # Windows
export MODE=static    # Linux/Mac
```
- Uses pre-loaded alerts from `seed/alerts.json`
- Best for: Controlled demos, debugging
- Alert count: 20 pre-configured scenarios

---

## 🛠️ Common Commands

### Start Backend Only
```powershell
# Windows
$env:MODE="demo"; $env:PYTHONPATH="$PWD"
.\venv\Scripts\Activate.ps1
uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Linux/Mac
export MODE=demo PYTHONPATH=$(pwd)
source venv/bin/activate
uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000
```

### Start Dashboard Only
```powershell
cd frontend_streamlit
streamlit run app.py
```

### Run with Docker
```powershell
docker-compose -f ops/docker-compose.dev.yml up --build
```

---

## 📊 Dashboard Tabs

1. **Overview** - System statistics and charts
2. **Live Alerts** - Real-time alert feed
3. **Explainability** - SHAP feature importance
4. **Analytics** - Advanced visualizations

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Check if port 8000 is already in use
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/Mac
```

### Dashboard shows "IDS Offline"
1. Ensure backend is running on port 8000
2. Check firewall settings
3. Verify `API_BASE` in dashboard matches backend URL

### No alerts appearing
1. Check mode: Should be `demo` for continuous alerts
2. Verify backend health: http://localhost:8000/api/health
3. Check browser console for WebSocket errors

### Import errors
```powershell
# Reinstall dependencies
pip install -r backend/ids/requirements.txt
pip install -r frontend_streamlit/requirements.txt
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `seed/alerts.json` | Pre-configured alerts for static mode |
| `seed/shap_example.json` | SHAP explainability data |
| `.env.example` | Environment configuration template |
| `backend/ids/serve/app.py` | FastAPI application |
| `frontend_streamlit/app.py` | Streamlit dashboard |

---

## 🎬 Demo Script (2 minutes)

### Preparation (30s)
1. Start services: `.\start-aegis.ps1`
2. Open dashboard: http://localhost:8501
3. Verify "Live Mode" status in sidebar

### Presentation (90s)
1. **Overview Tab** (30s)
   - Show real-time metrics
   - Point out attack type distribution
   - Highlight severity breakdown

2. **Live Alerts Tab** (30s)
   - Demonstrate scrolling alert feed
   - Show different attack types
   - Point out severity coloring

3. **Explainability Tab** (30s)
   - Show SHAP feature importance
   - Explain why alerts are triggered
   - Mention transparency & trust

---

## 💡 Tips for Demo

1. **Set `MODE=demo`** for continuous new alerts
2. **Use full screen** for dashboard (F11 in browser)
3. **Point out colors**: Red = High, Yellow = Medium, Green = Low
4. **Emphasize real-time** updates (alerts streaming live)
5. **Show API docs** at /docs for technical audience

---

## 📞 Quick Help

```powershell
# Check Python version
python --version

# Check installed packages
pip list

# View backend logs
# (They appear in the terminal where uvicorn is running)

# Reset virtual environment
Remove-Item -Recurse -Force venv  # Windows
rm -rf venv                       # Linux/Mac
python -m venv venv
```

---

For detailed documentation, see:
- **Setup**: README.md
- **Architecture**: ARCHITECTURE.md
- **Contributing**: CONTRIBUTING.md
