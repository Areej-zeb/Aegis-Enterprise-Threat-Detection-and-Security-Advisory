import asyncio
import json
import os
import random
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from backend.ids.loaders import load_alert_seed

app = FastAPI(title="Aegis IDS Mock Service", version="0.1.0")

# ----- CORS -----
origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Load mock data -----
ALERTS: List[dict] = load_alert_seed() or []


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ids-mock", "alerts_loaded": len(ALERTS)}


@app.get("/api/alerts")
def get_alerts():
    """Return list of alerts (static dummy)."""
    return ALERTS


@app.get("/api/alerts/{alert_id}")
def get_alert(alert_id: str):
    """Return single alert by id."""
    for alert in ALERTS:
        if alert["id"] == alert_id:
            return alert
    return {"error": f"Alert {alert_id} not found"}


@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    """Simulated live alerts feed for frontend demo."""
    await websocket.accept()
    if not ALERTS:
        await websocket.send_text(json.dumps({"info": "no alerts found"}))
    else:
        while True:
            alert = random.choice(ALERTS)
            alert["timestamp"] = datetime.utcnow().isoformat() + "Z"
            await websocket.send_text(json.dumps(alert))
            await asyncio.sleep(random.uniform(1.5, 3.0))
