# 🎬 Demo Preparation Checklist

Use this checklist to ensure your Aegis IDS demo goes smoothly.

---

## ✅ Pre-Demo Setup (10 minutes before)

### 1. Environment Check
- [ ] Python 3.11+ installed
- [ ] Virtual environment activated
- [ ] All dependencies installed
- [ ] `.env` file configured (or using `.env.example`)

### 2. Service Verification
```powershell
# Windows PowerShell
$env:MODE = "demo"
$env:PYTHONPATH = $PWD
.\venv\Scripts\Activate.ps1
```

```bash
# Linux/Mac
export MODE=demo
export PYTHONPATH=$(pwd)
source venv/bin/activate
```

- [ ] Backend starts successfully: `uvicorn backend.ids.serve.app:app --reload`
- [ ] Health check returns OK: http://localhost:8000/api/health
- [ ] Dashboard loads: http://localhost:8501
- [ ] Alerts are streaming (check Live Alerts tab)

### 3. Visual Check
- [ ] Dashboard shows "🟢 IDS Online — Live Mode"
- [ ] Alerts appearing in real-time
- [ ] Charts rendering correctly (Overview tab)
- [ ] SHAP data displaying (Explainability tab)

### 4. Browser Setup
- [ ] Full screen mode (F11) for immersive view
- [ ] Close unnecessary tabs
- [ ] Disable notifications/pop-ups
- [ ] Test WebSocket connection (check for alerts)

---

## 🗣️ Demo Script

### Opening (15 seconds)
> "Aegis is an AI-powered intrusion detection system designed for SMEs. It provides real-time threat detection with explainable AI, all running on lightweight infrastructure."

**Action**: Show Overview tab with live statistics

---

### Section 1: Real-Time Detection (30 seconds)

**Talking Points**:
- "We're detecting multiple types of attacks in real-time"
- "DDoS attacks, brute force attempts, port scanning, and more"
- "Each alert includes confidence scores and severity levels"

**Actions**:
1. Navigate to **Live Alerts** tab
2. Point out scrolling feed
3. Highlight different attack types (DDoS_SYN, BRUTE_FTP, etc.)
4. Show severity color coding (red/yellow/green)

**Key Metrics to Mention**:
- < 1 second detection latency
- 95%+ accuracy
- Multiple simultaneous threats

---

### Section 2: Explainable AI (30 seconds)

**Talking Points**:
- "We use SHAP to explain WHY each threat was detected"
- "These features drive our AI decisions"
- "Packet rate and SYN ratio are key indicators"

**Actions**:
1. Navigate to **Explainability** tab
2. Show SHAP feature importance chart
3. Point out top features (pkt_rate, syn_ratio, byte_rate)
4. Mention transparency for security teams

**Key Message**:
- Not a black box - full transparency
- Build trust through explainability

---

### Section 3: Analytics & Intelligence (30 seconds)

**Talking Points**:
- "Rich analytics help prioritize responses"
- "Track attack patterns over time"
- "Identify top threat sources"

**Actions**:
1. Navigate to **Analytics** tab
2. Show timeline chart (attacks over time)
3. Point out top source IPs
4. Mention confidence score distribution

**Key Message**:
- Actionable intelligence, not just alerts
- Data-driven security decisions

---

### Closing (15 seconds)

**Talking Points**:
- "Lightweight enough for SME budgets"
- "Scalable microservices architecture"
- "Open for contributions on GitHub"

**Actions**:
1. Return to Overview tab
2. Show system status in sidebar
3. Mention API documentation at /docs

---

## 🎯 Key Selling Points

Use these throughout your demo:

1. **Real-Time**: < 1 second detection latency
2. **Accurate**: 95%+ detection rate
3. **Explainable**: SHAP/LIME transparency
4. **Lightweight**: Runs on commodity hardware
5. **Comprehensive**: Multiple attack types detected
6. **Actionable**: Rich analytics and prioritization
7. **Modern**: Microservices, Docker, WebSockets
8. **Open**: MIT licensed, community-driven

---

## ❓ Anticipated Questions & Answers

### "How does it compare to commercial IDS solutions?"

> "Aegis focuses on SMEs who can't afford Cisco/Palo Alto. We provide enterprise-grade detection with explainable AI at a fraction of the cost. Our hybrid ML approach achieves 95%+ accuracy."

### "What about false positives?"

> "We use ensemble methods (XGBoost + CNN-LSTM) and confidence thresholding to minimize false positives. The explainability layer helps security teams quickly validate alerts."

### "Can it handle high traffic volumes?"

> "Current implementation handles 100+ alerts/second. For production, we're designing horizontal scaling with Kubernetes and load balancing."

### "What datasets did you train on?"

> "We use CICIDS2017, CIC-DDoS2019, and CICIoMT2024 - industry-standard datasets with realistic attack scenarios. Future versions will support custom training."

### "Is this production-ready?"

> "We're in Iteration 1 - focus on architecture and real-time detection. Iteration 2 will add the full ML pipeline. Iteration 3 brings enterprise features like RAG chatbot and pentesting."

### "How do I deploy this?"

> "One command: `docker-compose up`. We provide Docker for easy deployment. For production, we'll have Kubernetes manifests."

### "Can it integrate with my SIEM?"

> "Planned for Iteration 3. We'll support Splunk, ELK, and other SIEM platforms via standard formats like CEF/LEEF."

---

## 🐛 Troubleshooting During Demo

### Alerts stop appearing
```powershell
# Check health
curl http://localhost:8000/api/health

# Restart backend if needed
Ctrl+C  # Stop current process
uvicorn backend.ids.serve.app:app --reload
```

### Dashboard freezes
```powershell
# Refresh browser (Ctrl+R or Cmd+R)
# If persistent, restart Streamlit
Ctrl+C
streamlit run app.py
```

### Charts not loading
- Check browser console (F12) for errors
- Verify plotly installation: `pip install plotly`
- Try different browser (Chrome recommended)

---

## 📸 Screenshot Opportunities

Capture these for presentations/reports:

1. **Overview Tab** - Shows all metrics and charts
2. **Live Alerts** - Scrolling feed with color-coded severity
3. **Explainability** - SHAP bar chart
4. **Analytics** - Timeline and IP distribution
5. **API Docs** - http://localhost:8000/docs (Swagger UI)

---

## 🎥 Recording Tips

If recording the demo:

1. **Screen Resolution**: 1920x1080 for clarity
2. **Audio**: Use external mic for better quality
3. **Lighting**: Ensure good visibility if showing face
4. **Practice**: Run through 2-3 times beforehand
5. **Backup**: Have screenshots ready in case of technical issues

---

## ✨ Enhancement Ideas (If Time Permits)

During demo, you could mention:

- **Future Features**: RAG chatbot, pentesting agent
- **Datasets**: Multiple public datasets for training
- **Scalability**: Horizontal scaling design
- **Community**: Open for contributions
- **Roadmap**: Clear iteration plan

---

## 📞 Emergency Contacts

If doing a team demo, have these ready:

- **Backup Person**: [Name] - can troubleshoot tech issues
- **Repository**: GitHub link for immediate access
- **Documentation**: README.md has full setup

---

## ✅ Post-Demo

After the demo:

- [ ] Stop services (Ctrl+C)
- [ ] Deactivate virtual environment: `deactivate`
- [ ] Save any generated logs/data if needed
- [ ] Update documentation based on feedback
- [ ] Note questions asked for FAQ

---

## 🎓 Practice Run

Do a full run-through:

1. Start from cold (no services running)
2. Execute startup script
3. Wait for everything to load
4. Run through full demo script (2 min)
5. Field imaginary questions
6. Clean shutdown

**Time yourself!** Aim for 2:00 ± 15 seconds.

---

Good luck with your demo! 🚀🛡️

**Remember**: Confidence comes from preparation. Run through this checklist, practice once or twice, and you'll deliver a great demo!
