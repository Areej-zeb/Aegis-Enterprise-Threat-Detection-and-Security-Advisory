<div align="center">

# 🛡️ Aegis IDS
### Enterprise Threat Detection & Security Advisory System

*Real-time ML-powered intrusion detection with modern web dashboards*

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-Frontend-61dafb.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 **Core Capabilities**
- **Real-time Threat Detection** with ML classification
- **Multi-Attack Support**: DDoS, Port Scan, Brute Force, SQL Injection
- **XGBoost Models** with 79% F1-score accuracy
- **SHAP Explainability** for model transparency
- **WebSocket Streaming** for sub-second alerts

</td>
<td width="50%">

### 🖥️ **Dual Dashboard System**
- **React Dashboard** - Modern, responsive UI
- **Streamlit Dashboard** - ML monitoring & analytics
- **5 Interactive Views**: Overview, Live Alerts, Analytics, Explainability, Threat Intel
- **Auto-refresh** toggle for SOC operations

</td>
</tr>
</table>

---

## 🚀 Quick Start

### 📋 Prerequisites

<table>
<tr>
<td><strong>🐍 Python</strong></td>
<td>3.9+ (tested on 3.10, 3.11, 3.12, 3.13)</td>
</tr>
<tr>
<td><strong>🌐 Node.js</strong></td>
<td>16+ (for React dashboard)</td>
</tr>
<tr>
<td><strong>💻 OS</strong></td>
<td>Windows, Linux, macOS, WSL</td>
</tr>
</table>

### ⚡ One-Click Setup

```bash
# 1️⃣ Clone the repository
git clone https://github.com/Areej-zeb/Aegis-Enterprise-Threat-Detection-and-Security-Advisory.git
cd Aegis-Enterprise-Threat-Detection-and-Security-Advisory

# 2️⃣ Install Python dependencies
pip install -r requirements.txt

# 3️⃣ Install Node dependencies for unified backend
cd backend/unified
npm install
cd ../..

# 4️⃣ Install frontend dependencies
cd frontend_react
npm install
cd ../..

# 5️⃣ Configure MongoDB (edit backend_auth/.env)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
# JWT_SECRET=your_secret_key

# 6️⃣ Run the system
# Windows:
START_AEGIS.bat

# Linux/macOS:
chmod +x start-aegis.sh && ./start-aegis.sh
```

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **React Dashboard** | http://localhost:5173 | Modern web interface |
| **Unified Backend** | http://localhost:5000 | Express proxy + Auth |
| **Backend API** | http://localhost:8000 | FastAPI endpoints |
| **API Documentation** | http://localhost:8000/docs | Interactive API docs |

### 🔑 Default Credentials

```
Email: admin@aegis.local
Password: admin123
```

Or create a new account via signup.

---

## 🔧 Manual Setup

<details>
<summary><strong>🚀 Unified Backend Setup</strong></summary>

```bash
# 1️⃣ Navigate to unified backend
cd backend/unified

# 2️⃣ Install Node.js dependencies
npm install

# 3️⃣ Configure environment (.env)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
# JWT_SECRET=your_secret_key
# PORT=5000

# 4️⃣ Start backend server
npm start
```

The unified backend:
- Runs Express on port 5000
- Proxies Python services (IDS, Pentest) from port 8000
- Handles authentication and routing
- Manages WebSocket connections

</details>

<details>
<summary><strong>⚛️ React Frontend Setup</strong></summary>

```bash
# 1️⃣ Navigate to React app
cd frontend_react

# 2️⃣ Install Node.js dependencies
npm install

# 3️⃣ Start development server
npm run dev
```

</details>

<details>
<summary><strong>🐍 Python Backend Setup (Optional)</strong></summary>

```bash
# 1️⃣ Create virtual environment
python -m venv venv

# 2️⃣ Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3️⃣ Install dependencies
pip install -r requirements.txt

# 4️⃣ Set environment variables
# Windows:
set PYTHONPATH=%cd%
set MODE=demo
# Linux/macOS:
export PYTHONPATH=$(pwd)
export MODE=demo

# 5️⃣ Start backend server (runs on port 8000)
python -m uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000
```

</details>

### 🔍 Troubleshooting

<details>
<summary><strong>Common Issues & Solutions</strong></summary>

| Issue | Solution |
|-------|----------|
| **Port already in use** | `pkill -f uvicorn && pkill -f streamlit` |
| **Module not found** | `pip install -r requirements.txt --force-reinstall` |
| **Permission denied** | `chmod +x start-aegis.sh` |
| **Python not found** | Use `py` instead of `python` on Windows |
| **Virtual env issues** | Delete `venv` folder and recreate |

</details>

---

## 🏗️ System Architecture

```mermaid
graph TB
    A[🌐 Network Traffic] --> B[📡 FastAPI Backend<br/>Port 8000]
    B --> C[🧠 XGBoost ML Models]
    B --> D[📊 React Dashboard<br/>Port 5173]
    B --> E[📈 Streamlit Dashboard<br/>Port 8501]
    B --> F[🔌 WebSocket Stream]
    
    C --> G[🎯 Threat Detection]
    C --> H[📋 SHAP Explainability]
    
    D --> I[👤 Modern Web UI]
    E --> J[📊 ML Analytics]
    
    style B fill:#e1f5fe
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style E fill:#fff3e0
```

### 🔧 Technology Stack

<table>
<tr>
<td width="33%">

**🔙 Backend**
- FastAPI + Uvicorn
- XGBoost ML Models
- WebSocket Streaming
- SHAP Explainability

</td>
<td width="33%">

**🎨 Frontend**
- React + TypeScript
- Streamlit Analytics
- Real-time Updates
- Responsive Design

</td>
<td width="33%">

**🤖 ML Pipeline**
- XGBoost Classifier
- 79% F1-Score
- Multi-Attack Detection
- Feature Engineering

</td>
</tr>
</table>

---

## 📁 Project Structure

```
🛡️ Aegis/
├── 🔙 backend/
│   └── ids/
│       ├── serve/
│       │   ├── app.py              # 🚀 FastAPI main application
│       │   ├── detection_service.py # 🎯 ML detection engine
│       │   └── stream.py           # 🔌 WebSocket streaming
│       ├── models/
│       │   ├── xgb_baseline.py     # 🤖 XGBoost model training
│       │   └── cnn_lstm.py         # 🧠 Deep learning models
│       └── config.yaml             # ⚙️ System configuration
├── 🎨 frontend_react/
│   ├── src/
│   │   ├── components/             # ⚛️ React components
│   │   ├── pages/                  # 📄 Dashboard pages
│   │   ├── hooks/                  # 🪝 Custom React hooks
│   │   └── theme/                  # 🎨 Design system
│   └── package.json                # 📦 Node.js dependencies
├── 📊 frontend_streamlit/
│   └── aegis_dashboard.py          # 📈 ML analytics dashboard
├── 🎯 artifacts/
│   ├── Syn/                        # 🔥 SYN flood models
│   ├── mitm_arp/                   # 🕵️ MITM detection models
│   └── baseline_ml_stateful/       # 📊 Ensemble models
├── 🌱 seed/
│   ├── alerts.json                 # 🚨 Demo alert data
│   └── shap_*.json                 # 🔍 SHAP explainability
├── 📊 evaluation/
│   ├── phase1_dataset_evaluation.py # 📈 Model metrics
│   ├── phase2_scenario_evaluation.py # 🎭 Scenario testing
│   └── phase3_system_evaluation.py  # 🏗️ System performance
├── 🚀 scripts/
│   ├── run_backend.sh              # 🔙 Backend launcher
│   ├── run_frontend.sh             # 🎨 Frontend launcher
│   └── train_*.sh                  # 🤖 Model training
├── 📋 requirements.txt             # 🐍 Python dependencies
├── 🚀 start-aegis.sh              # 🐧 Linux/macOS launcher
├── 🚀 start-aegis.bat             # 🪟 Windows launcher
└── 📖 README.md                    # 📚 This documentation
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
cd frontend_react
npm install
npm run dev
```

---

## 🌐 Access

- **Dashboard**: http://localhost:5173
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
- **Dashboard (Port 5173)**: Web-based interface with 5 specialized tabs
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

## 🧠 ML Model Performance

<div align="center">

### 📊 Model Comparison

| Model | Macro-F1 | Precision | Recall | ROC-AUC | Status |
|-------|----------|-----------|--------|---------|--------|
| Logistic Regression | 0.62 | 0.63 | 0.61 | 0.70 | ⚪ Baseline |
| Random Forest | 0.75 | 0.76 | 0.74 | 0.81 | 🟡 Good |
| **XGBoost** | **0.79** | **0.80** | **0.79** | **0.85** | 🟢 **Production** |

</div>

### 🎯 Top Features (SHAP Analysis)

<table>
<tr>
<td width="50%">

**🔥 Most Important Features**
1. `pkt_rate` - Packets per second (0.42)
2. `syn_ratio` - SYN packet ratio (0.31)
3. `byte_rate` - Bytes per second (0.25)
4. `flow_duration` - Connection duration (0.18)
5. `avg_pkt_size` - Average packet size (0.14)

</td>
<td width="50%">

**🎭 Attack Types Detected**
- 🔥 **SYN Flood** - TCP SYN attacks
- 🕵️ **MITM ARP** - ARP spoofing attacks  
- 🌐 **DNS Exfiltration** - Data exfiltration via DNS
- 🚪 **Port Scanning** - Network reconnaissance
- 💥 **DDoS** - Distributed denial of service
- 🔓 **Brute Force** - Password attacks

</td>
</tr>
</table>

---

## 🔒 Security Features

<div align="center">

| Feature | Description | Status |
|---------|-------------|--------|
| **🚨 Severity Classification** | Critical, High, Medium, Low | ✅ Active |
| **🎯 Confidence Scoring** | ML-based threat probability (0-1) | ✅ Active |
| **🔍 Attack Type Detection** | 10+ attack categories | ✅ Active |
| **🌐 Source IP Tracking** | Automatic threat actor identification | ✅ Active |
| **📡 Protocol Analysis** | TCP, UDP, ICMP monitoring | ✅ Active |
| **⚡ Real-time Alerts** | Sub-second detection & notification | ✅ Active |

</div>

---

## 📊 Demo Mode Features

<table>
<tr>
<td width="50%">

### 🎭 **Simulation Capabilities**
- **Realistic Traffic Patterns** with statistical variation
- **Multi-Attack Scenarios** across different protocols
- **Time-based Attack Sequences** for testing
- **Configurable Alert Rates** (1-3 seconds)

</td>
<td width="50%">

### 📈 **Analytics & Monitoring**
- **Live Performance Metrics** with model accuracy
- **Attack Distribution Charts** by type and severity
- **Time-series Visualization** of threat patterns
- **SHAP Explainability** for each detection

</td>
</tr>
</table>

---

## 🐛 Troubleshooting

<details>
<summary><strong>🔧 Common Issues</strong></summary>

### Port Already in Use
```bash
# Kill existing processes
pkill -f uvicorn
pkill -f streamlit
pkill -f node

# Or on Windows:
taskkill /f /im python.exe
taskkill /f /im node.exe
```

### Python/Module Issues
```bash
# Reinstall dependencies
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

pip install -r requirements.txt --force-reinstall
```

### Permission Denied
```bash
# Linux/macOS:
chmod +x start-aegis.sh
chmod +x scripts/*.sh

# Windows: Run as Administrator
```

### Virtual Environment Issues
```bash
# Delete and recreate
rm -rf venv  # Linux/macOS
# or
rmdir /s venv  # Windows

python -m venv venv
```

### WSL/Ubuntu Setup
```powershell
# In PowerShell (Windows)
wsl --install -d Ubuntu
wsl --list --verbose

# Then in WSL Ubuntu:
cd /mnt/c/path/to/aegis
./start-aegis.sh
```

</details>

---

## 🚀 Development

<details>
<summary><strong>🛠️ Development Setup</strong></summary>

### Backend Development
```bash
# Install development dependencies
pip install -r requirements.txt
pip install pytest black flake8

# Run tests
pytest

# Format code
black backend/

# Start with hot reload
uvicorn backend.ids.serve.app:app --reload --port 8000
```

### Frontend Development
```bash
# React development
cd frontend_react
npm install
npm run dev

# Streamlit development
cd frontend_streamlit
streamlit run aegis_dashboard.py --server.runOnSave true
```

### Model Training
```bash
# Train all models
./scripts/train_ids.sh

# Train specific model
python backend/ids/models/xgb_baseline.py
```

</details>

---

## 📈 Roadmap

<table>
<tr>
<td width="50%">

### ✅ **Completed**
- [x] Real-time ML detection engine
- [x] Dual dashboard system (React + Streamlit)
- [x] WebSocket streaming
- [x] SHAP explainability
- [x] Multi-attack type support
- [x] Demo mode with realistic data

</td>
<td width="50%">

### 🔄 **In Progress**
- [ ] Database persistence (PostgreSQL)
- [ ] User authentication & RBAC
- [ ] Alert correlation engine
- [ ] Custom rule engine
- [ ] Mobile-responsive design
- [ ] Docker containerization

</td>
</tr>
</table>

### 🎯 **Future Enhancements**
- **🤖 Automated Penetration Testing** - AI-driven security assessment
- **💬 Security Chatbot** - Natural language threat analysis
- **📊 Advanced Analytics** - Predictive threat modeling
- **🔗 SIEM Integration** - Enterprise security platform connectivity

---

## 📄 License

```
MIT License - See LICENSE file for details
```

---

## 👥 Contributors

<div align="center">

**🛡️ Areej Zeb** - *Lead Developer*  
[![GitHub](https://img.shields.io/badge/GitHub-Areej--zeb-black.svg)](https://github.com/Areej-zeb)

*Contributions welcome! Please read our contributing guidelines.*

</div>

---

## 🙏 Acknowledgments

<div align="center">

**Built with ❤️ for cybersecurity professionals**

[![XGBoost](https://img.shields.io/badge/XGBoost-ML%20Framework-orange.svg)](https://xgboost.readthedocs.io)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-Frontend-blue.svg)](https://reactjs.org)
[![Streamlit](https://img.shields.io/badge/Streamlit-Analytics-red.svg)](https://streamlit.io)

*Special thanks to the open-source community for making this project possible.*

</div>

---

<div align="center">

### 🌟 Star this repository if you find it useful!

*Help us improve Aegis IDS by reporting issues and suggesting features.*

</div>
