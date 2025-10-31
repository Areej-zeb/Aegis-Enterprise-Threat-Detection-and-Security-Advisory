# 🚀 Getting Your Partners Set Up

Share this with your team to get them up and running quickly!

---

## 📥 Step 1: Clone the Repository

```powershell
# Clone the repo
git clone https://github.com/yourusername/aegis.git
cd aegis
```

---

## ⚙️ Step 2: Setup (Choose Your Method)

### Option A: Automated Setup (Recommended)

#### Windows PowerShell:
```powershell
.\start-aegis.ps1
```

#### Linux/Mac:
```bash
chmod +x start-aegis.sh
./start-aegis.sh
```

The script will:
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Start backend API
- ✅ Start dashboard
- ✅ Open your browser automatically

### Option B: Manual Setup

1. **Create virtual environment**
   ```powershell
   # Windows
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**
   ```powershell
   pip install -r backend/ids/requirements.txt
   pip install -r frontend_streamlit/requirements.txt
   ```

3. **Set environment variables**
   ```powershell
   # Windows PowerShell
   $env:MODE = "demo"
   $env:PYTHONPATH = $PWD
   
   # Linux/Mac
   export MODE=demo
   export PYTHONPATH=$(pwd)
   ```

4. **Start backend** (in Terminal 1)
   ```powershell
   uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Start dashboard** (in Terminal 2)
   ```powershell
   cd frontend_streamlit
   streamlit run app.py
   ```

---

## 🌐 Step 3: Access the Application

Once running, open these URLs:

- **Dashboard**: http://localhost:8501
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ✅ Step 4: Verify Everything Works

You should see:
- ✅ Dashboard showing "🟢 IDS Online — Live Mode"
- ✅ Alerts streaming in real-time
- ✅ Charts and statistics updating
- ✅ No errors in terminal

---

## 🐛 Common Issues

### "Python not found"
**Install Python 3.11+**: https://www.python.org/downloads/

### "Port 8000 already in use"
```powershell
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8000
kill -9 <PID>
```

### "Module not found" errors
```powershell
# Reinstall dependencies
pip install -r backend/ids/requirements.txt
pip install -r frontend_streamlit/requirements.txt
```

### Dashboard shows "IDS Offline"
1. Make sure backend is running on port 8000
2. Check http://localhost:8000/api/health
3. Restart the backend if needed

---

## 📚 Documentation

- **Quick Start**: QUICKSTART.md
- **Full Setup**: README.md
- **Architecture**: ARCHITECTURE.md
- **Demo Guide**: DEMO.md
- **Contributing**: CONTRIBUTING.md

---

## 💡 Tips

1. **Use Demo Mode** for live alerts: `MODE=demo`
2. **Use Static Mode** for consistent data: `MODE=static`
3. **Check logs** in the terminal for debugging
4. **Read README.md** for detailed documentation

---

## 🤝 Need Help?

- **Issues**: Open a GitHub issue
- **Questions**: Check QUICKSTART.md
- **Email**: your.email@example.com

---

**That's it!** You should now have Aegis running. Explore the dashboard tabs:
1. **Overview** - System statistics
2. **Live Alerts** - Real-time feed
3. **Explainability** - SHAP insights
4. **Analytics** - Advanced charts

Happy hacking! 🛡️
