# 🛡️ Aegis IDS - Quick Reference

## Requirements
- **Python**: 3.9+ (tested on 3.10, 3.11, 3.12)
- **OS**: Ubuntu/Debian or WSL Ubuntu

## One-Command Setup
```bash
git clone https://github.com/Areej-zeb/Aegis-Enterprise-Threat-Detection-and-Security-Advisory.git
cd Aegis-Enterprise-Threat-Detection-and-Security-Advisory
chmod +x start-aegis.sh
./start-aegis.sh
```

## Access
- **Dashboard**: http://localhost:8501
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 5 Dashboard Tabs
| Tab | Purpose | Key Feature |
|-----|---------|-------------|
| 📊 Overview | System metrics | Top attackers, severity distribution |
| 🚨 Live Alerts | Real-time feed | Auto-refresh toggle (default ON) |
| 🧠 Explainability | ML insights | SHAP values for transparency |
| 📈 Analytics | Attack trends | Timeline charts, protocol analysis |
| 🛡️ Threat Intel | AI recommendations | MITRE ATT&CK mapping |

## Auto-Refresh Feature
- **Live Alerts Tab**: Checkbox "Enable Auto-Refresh"
- **Default**: ✅ ON (updates every 2 seconds)
- **Toggle**: ⬜ OFF (pause for investigation)

## Architecture Status
- ✅ **70% Complete**: Backend, ML, Dashboard, Real-time Alerts
- ❌ **30% Future**: Pentest Agent, Chatbot, Persistent DB

## ML Model Performance
- **Algorithm**: XGBoost
- **F1-Score**: 79%
- **Precision**: 80%
- **Recall**: 79%
- **ROC-AUC**: 85%

## Tech Stack
- **Backend**: FastAPI + Uvicorn (Port 8000)
- **Frontend**: Streamlit (Port 8501)
- **ML**: XGBoost + SHAP
- **Language**: Python 3.12.3

## Troubleshooting
```bash
# Port conflicts
pkill -f uvicorn
pkill -f streamlit

# Module errors
source venv/bin/activate
pip install -r requirements.txt --force-reinstall

# Permission denied
chmod +x start-aegis.sh
```

## Documentation
- `README.md` - Full documentation
- `DEPLOYMENT_CHECKLIST.md` - Partner deployment guide
- `PROJECT_SUMMARY.md` - Comprehensive overview
- `QUICK_REFERENCE.md` - This file

## License
MIT License

## Author
Areej Zeb - [GitHub](https://github.com/Areej-zeb)

---

**Made with ❤️ for cybersecurity professionals**
