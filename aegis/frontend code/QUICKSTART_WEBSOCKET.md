# 🚀 Quick Start - WebSocket Real-Time Alerts

Get your Aegis IDS Dashboard connected to the backend with real-time WebSocket alerts in 5 minutes.

## Prerequisites

- ✅ Backend running on `http://localhost:8000`
- ✅ Node.js installed (for React dashboard)
- ✅ Python 3.9+ (for backend)

## Step 1: Add WebSocket to Backend (2 minutes)

Open `backend/ids/serve/app.py` and add this code:

```python
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import random
from datetime import datetime

# Add this to your existing FastAPI app
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """Real-time alert streaming for dashboard"""
    await websocket.accept()
    
    attack_types = ["DDoS_SYN_Flood", "Port_Scan", "Brute_Force_SSH", 
                    "SQL_Injection", "XSS_Attack", "DNS_Tunnel"]
    severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    
    try:
        print("[WebSocket] Dashboard connected")
        
        while True:
            # Generate demo alert (replace with your real IDS alerts)
            alert = {
                "id": f"alert-{random.randint(1000, 9999)}",
                "timestamp": datetime.utcnow().isoformat(),
                "attack_type": random.choice(attack_types),
                "severity": random.choice(severities),
                "src_ip": f"192.168.{random.randint(1, 255)}.{random.randint(1, 254)}",
                "dst_ip": f"10.0.0.{random.randint(1, 254)}",
                "status": "NEW",
                "score": round(random.uniform(0.5, 0.99), 2),
            }
            
            await websocket.send_json(alert)
            await asyncio.sleep(random.uniform(1.0, 2.5))  # Random delay
            
    except WebSocketDisconnect:
        print("[WebSocket] Dashboard disconnected")
```

**That's it!** Your backend now streams alerts via WebSocket.

## Step 2: Start Backend (1 minute)

```bash
# Terminal 1 - Start backend
cd Aegis-Enterprise-Threat-Detection-and-Security-Advisory
./start-aegis.sh

# Or manually:
source venv/bin/activate
uvicorn backend.ids.serve.app:app --reload --host 0.0.0.0 --port 8000
```

Verify backend is running: http://localhost:8000/docs

## Step 3: Start Dashboard (1 minute)

```bash
# Terminal 2 - Start React dashboard
cd aegis-dashboard
npm install  # First time only
npm run dev
```

Dashboard opens at: http://localhost:5173

## Step 4: Test WebSocket (1 minute)

1. Open browser to http://localhost:5173
2. Click "Live Alerts" in sidebar
3. Look for WebSocket toggle (should be enabled by default)
4. Check connection status:
   - 🟢 **"Live"** = Connected! ✅
   - 🔴 **"Disconnected"** = Check backend

5. Watch for:
   - Toast notifications popping up
   - Alerts appearing instantly in the list
   - No 5-second polling delay

## What You Should See

### Connection Status
```
┌─────────────────────────────────────┐
│ [✓] WebSocket  🟢 Live             │
│ [✓] Polling (5s)                   │
│ Env: Demo • IDS: Healthy           │
│ [Refresh]                          │
└─────────────────────────────────────┘
```

### Toast Notification
```
┌────────────────────────────────────┐
│ 🚨 New Alert Detected              │
│ DDoS_SYN_Flood                     │
│ [HIGH] From: 192.168.1.45          │
└────────────────────────────────────┘
```

### Alert List
```
┌──────────────────────────────────────────┐
│ alert-1234  21:24:07  192.168.1.45  HIGH │ ← New (just appeared)
│ alert-1233  21:23:52  192.168.1.32  MED  │
│ alert-1232  21:23:40  192.168.1.18  LOW  │
└──────────────────────────────────────────┘
```

## Troubleshooting

### 🔴 "Disconnected" Status

**Check 1**: Is backend running?
```bash
curl http://localhost:8000/docs
# Should return HTML
```

**Check 2**: Does WebSocket endpoint exist?
```bash
# Check FastAPI docs
open http://localhost:8000/docs
# Look for /ws/alerts endpoint
```

**Check 3**: Check browser console (F12)
```javascript
// Should see:
[WebSocket] Connecting to: ws://localhost:8000/ws/alerts
[WebSocket] Connected
```

**Check 4**: Check backend logs
```
INFO:     ('127.0.0.1', 54321) - "WebSocket /ws/alerts" [accepted]
[WebSocket] Dashboard connected
```

### No Alerts Appearing

1. **Check backend is sending**: Look for `send_json` calls in logs
2. **Check alert format**: Must match schema (see below)
3. **Check browser console**: Look for parsing errors
4. **Try manual refresh**: Click "Refresh" button

### Connection Keeps Dropping

1. **Check network**: Ensure stable connection
2. **Check backend**: Look for crashes/errors
3. **Increase timeout**: Modify `reconnectInterval` in code

## Alert Format

Your backend must send alerts in this format:

```json
{
  "id": "alert-1234",
  "timestamp": "2024-12-06T21:24:07.123Z",
  "attack_type": "DDoS_SYN_Flood",
  "severity": "HIGH",
  "src_ip": "192.168.1.45",
  "dst_ip": "10.0.0.12",
  "status": "NEW",
  "score": 0.94
}
```

**Required fields**: `id`, `timestamp`, `attack_type`, `severity`  
**Optional fields**: `src_ip`, `dst_ip`, `status`, `score`, `description`, `tags`, `meta`

## Integration with Real IDS

Replace the demo code with your actual IDS alerts:

```python
# In your IDS detection code
async def on_threat_detected(threat_data):
    """Called when IDS detects a threat"""
    
    alert = {
        "id": generate_alert_id(),
        "timestamp": datetime.utcnow().isoformat(),
        "attack_type": threat_data.attack_type,
        "severity": threat_data.severity,
        "src_ip": threat_data.source_ip,
        "dst_ip": threat_data.dest_ip,
        "status": "NEW",
        "score": threat_data.confidence,
    }
    
    # Broadcast to all connected dashboards
    await broadcast_alert(alert)
```

See `BACKEND_INTEGRATION_GUIDE.md` for complete integration details.

## Features Enabled

✅ **Real-time alerts** - Instant delivery (no polling delay)  
✅ **Toast notifications** - Pop-up alerts for new threats  
✅ **Connection status** - Visual indicator (Live/Disconnected)  
✅ **Auto-reconnection** - Automatic retry on disconnect  
✅ **Dual mode** - WebSocket + Polling can run together  
✅ **Toggle controls** - Easy enable/disable  

## Configuration

### Change WebSocket URL

Edit `aegis-dashboard/.env.local`:

```bash
VITE_AEGIS_WS_BASE_URL=ws://your-server:8000
```

### Adjust Reconnection

Edit `aegis-dashboard/src/pages/LiveAlertsPage.jsx`:

```javascript
useWebSocketAlerts({
  enabled: true,
  reconnectInterval: 5000,      // 5 seconds between retries
  maxReconnectAttempts: 20,     // Try 20 times before giving up
})
```

## Next Steps

1. ✅ **Test with demo mode** - Verify everything works
2. ✅ **Integrate with real IDS** - Connect to your detection engine
3. ✅ **Add authentication** - Secure WebSocket connections
4. ✅ **Deploy to production** - Use WSS (secure WebSocket)
5. ✅ **Monitor performance** - Track connection metrics

## Documentation

- **Full Guide**: `BACKEND_INTEGRATION_GUIDE.md`
- **Technical Details**: `WEBSOCKET_INTEGRATION.md`
- **Summary**: `WEBSOCKET_IMPLEMENTATION_SUMMARY.md`

## Support

Having issues? Check:
1. Backend logs for errors
2. Browser console (F12) for WebSocket messages
3. Network tab in DevTools for WebSocket connection
4. FastAPI docs at http://localhost:8000/docs

---

**You're all set!** 🎉 Your dashboard now receives real-time alerts via WebSocket.

Open http://localhost:5173 and watch the alerts stream in! 🚀
