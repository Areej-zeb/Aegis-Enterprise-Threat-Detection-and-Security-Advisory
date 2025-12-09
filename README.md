# 🛡️ Aegis IDS - Intrusion Detection System

Enterprise-grade web-based threat detection and security monitoring system with real-time alerts and ML-powered analysis.

## 🚀 Quick Start

### Prerequisites

**Python Version**: Python 3.9+ (tested on 3.10, 3.11, 3.12)

```bash
# Ubuntu/Debian or WSL Ubuntu
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# Verify Python version (must be 3.9+)
python3 --version

# For WSL Ubuntu on Windows (first time only)
wsl --install -d Ubuntu
```

### Run the Application
```bash
# 1. Clone repository
git clone https://github.com/Areej-zeb/Aegis-Enterprise-Threat-Detection-and-Security-Advisory.git
cd Aegis-Enterprise-Threat-Detection-and-Security-Advisory

# 2. Start the application
chmod +x start-aegis.sh
./start-aegis.sh
```

**Access the web dashboard**: http://localhost:8501

---

## 📊 Features

- **Web-Based Dashboard**: Accessible from any browser
- **Real-time Threat Detection**: Live monitoring with ML-powered classification
- **5 Interactive Dashboards**:
  - 📊 **Overview** - System statistics and alerts summary
  - 🚨 **Live Alerts** - Real-time feed with auto-refresh toggle
  - 🧠 **Explainability** - SHAP-based ML model insights
  - 📈 **Analytics** - Attack trends and performance metrics
  - 🛡️ **Threat Intel** - AI-powered security recommendations

- **Machine Learning**: XGBoost classifier with 79% F1-score
- **REST API**: FastAPI backend with OpenAPI documentation
- **WebSocket Streaming**: Sub-second alert delivery
- **Attack Types**: DDoS, Port Scan, Brute Force, SQL Injection, Web Attacks, etc.

---

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Network   │────────▶│  FastAPI     │────────▶│  Streamlit  │
│   Traffic   │         │  Backend     │  HTTP   │   Web UI    │
└─────────────┘         │  (Port 8000) │         │ (Port 8501) │
                        └──────────────┘         └─────────────┘
                              │                         │
                              ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │  XGBoost ML  │         │   Browser   │
                        │    Model     │         │  (Any OS)   │
                        └──────────────┘         └─────────────┘
```

**Backend**: FastAPI + Uvicorn (REST API)  
**Frontend**: Streamlit (Web Dashboard)  
**ML Model**: XGBoost with SHAP explainability  
**Access**: Any modern web browser

### Current Implementation Status

✅ **Implemented (70% of Architecture)**:
- Live Traffic Capture (Demo Mode)
- Detection & Analysis Engine (XGBoost ML)
- Real-time Alerting System
- Web-based UI Dashboard
- Storage (In-memory session state)
- AI-powered threat analysis

❌ **Future Components (30%)**:
- Automated Pentest Agent
- Chatbot Security Advisor
- Persistent Database (PostgreSQL/TimescaleDB)

---

## 📁 Project Structure

```
Aegis/
├── backend/
│   └── ids/
│       ├── serve/
│       │   ├── app.py           # FastAPI backend
│       │   └── stream.py        # WebSocket streaming
│       ├── models/
│       │   └── xgb_baseline.py  # ML model
│       ├── experiments/
│       │   └── ids_baseline.md  # Model metrics
│       └── config.yaml          # IDS configuration
├── frontend_streamlit/
│   └── app.py                   # 5-tab Streamlit dashboard
├── seed/
│   ├── alerts.json              # Demo alert data (20 alerts)
│   └── shap_example.json        # SHAP explainability data
├── artifacts/
│   └── xgb_baseline.joblib      # Trained ML model
├── datasets/
│   └── index.yaml               # Dataset tracking
├── ops/
│   └── docker-compose.dev.yml   # Docker setup (future)
├── requirements.txt             # Python dependencies
├── start-aegis.sh              # Automated startup script
├── .env.example                # Configuration template
└── README.md                    # This file
```

---

## 🔧 Manual Setup

If the automated script doesn't work:

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
export PYTHONPATH=$(pwd)
export MODE=demo

# 4. Start backend (Terminal 1)
uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000

# 5. Start dashboard (Terminal 2)
source venv/bin/activate
cd frontend_streamlit
streamlit run app.py --server.port 8501
```

---

## 🌐 Access

- **Dashboard**: http://localhost:8501
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## 🛑 Stop

Press `Ctrl+C` in the terminal running the script.

---

## 📊 Demo Mode

The system runs in **demo mode** by default, which:
- Generates random realistic network alerts every 2 seconds
- Pre-loads 20 seed alerts on startup
- Simulates various attack types (DDoS, Port Scan, Brute Force, etc.)

Perfect for demonstrations and testing!

---

## ⚡ Live Monitoring & Auto-Refresh

### Architecture Design
- **Backend (Port 8000)**: Runs continuously 24/7, capturing traffic and generating alerts
- **Dashboard (Port 8501)**: Web-based interface with 5 specialized tabs
- **Live Alerts Tab**: Real-time threat feed with toggle-based auto-refresh
- **Other Tabs**: Stable views for analysis without auto-reload interruptions

### Auto-Refresh Toggle (Live Alerts Tab)
The **Live Alerts** tab includes an **"Enable Auto-Refresh"** checkbox:
- ✅ **Enabled** (default): Automatically fetches new alerts every 2 seconds
- ⬜ **Disabled**: Shows current alerts without automatic updates
- Enterprise-ready design allows SOC analysts to pause monitoring for detailed investigation

### How to Use
1. **Live Monitoring**: Navigate to "Live Alerts" tab, ensure "Enable Auto-Refresh" is checked
2. **Global Refresh**: Click "🔄 Refresh Dashboard" button in sidebar (updates all tabs)
3. **Browser Refresh**: Press F5 to reload the entire application

### Production Deployment
In a real enterprise environment:
- Backend connects to network sensors and runs 24/7
- SOC analysts enable auto-refresh during active monitoring
- Analysts can pause to investigate specific threats without losing context
- Other tabs remain stable for uninterrupted deep-dive analysis

---

## 🔒 Security Features

- **Severity Classification**: Critical, High, Medium, Low
- **Confidence Scoring**: ML-based threat probability (0-1)
- **Attack Type Detection**: 10+ attack categories
- **Source IP Tracking**: Automatic threat actor identification
- **Protocol Analysis**: TCP, UDP, ICMP monitoring

---

## 🧠 ML Model Details

| Model | Macro-F1 | Precision | Recall | ROC-AUC |
|-------|----------|-----------|--------|---------|
| Logistic Regression | 0.62 | 0.63 | 0.61 | 0.70 |
| Random Forest | 0.75 | 0.76 | 0.74 | 0.81 |
| **XGBoost** ✅ | **0.79** | **0.80** | **0.79** | **0.85** |

**Top Features** (SHAP values):
1. `pkt_rate` - Packets per second (0.42)
2. `syn_ratio` - SYN packet ratio (0.31)
3. `byte_rate` - Bytes per second (0.25)
4. `flow_duration` - Connection duration (0.18)
5. `avg_pkt_size` - Average packet size (0.14)

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill existing processes
pkill -f uvicorn
pkill -f streamlit
```

### Module not found
```bash
source venv/bin/activate
pip install -r requirements.txt --force-reinstall
```

### Permission denied
```bash
chmod +x start-aegis.sh
```

### WSL not launching
```powershell
# In PowerShell
wsl --list --verbose

# If Ubuntu not installed:
wsl --install -d Ubuntu
```

### Running in WSL Ubuntu manually
```bash
# Open WSL Ubuntu terminal
wsl

# Navigate to project
cd /mnt/c/Users/LENOVO/Desktop/Aegis

# Run the script
chmod +x start-aegis.sh
./start-aegis.sh
```

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

---

## 👥 Contributors

**Areej Zeb** - [GitHub](https://github.com/Areej-zeb)

---

## 🙏 Acknowledgments

- XGBoost for ML framework
- Streamlit for dashboard
- FastAPI for backend API
- SHAP for model explainability

---

**Made with ❤️ for cybersecurity professionals**
