import asyncio
import json
import os
import random
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# local imports
from backend.ids.loaders import load_alert_seed
from backend.ids.simulate_flows import random_flow  # for demo mode

# ---------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------
app = FastAPI(title="Aegis IDS Mock Service", version="0.2.0")

# Allow both Streamlit (8501) and Vite/React (5173) by default
origins = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8501"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Environment mode
# ---------------------------------------------------------------------
# MODE=demo → live random alerts
# MODE=static → fixed seed list
DEMO_MODE = os.getenv("MODE", "static").lower() == "demo"

# Load static alerts (used in static mode)
ALERTS: List[dict] = load_alert_seed() or []


# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------
@app.get("/")
def root():
    """Simple root route."""
    return {
        "message": "Aegis IDS mock service running.",
        "endpoints": ["/api/health", "/api/alerts", "/ws/alerts"],
    }


@app.get("/api/health")
def health():
    """Health check route."""
    return {
        "status": "ok",
        "service": "ids-mock",
        "mode": "demo" if DEMO_MODE else "static",
        "alerts_loaded": len(ALERTS),
    }


@app.get("/api/alerts")
def get_alerts():
    """
    Return alerts depending on mode.
    In demo mode → return a single new random alert each call.
    In static mode → return preloaded seed alerts.
    """
    if DEMO_MODE:
        return [random_flow()]
    return ALERTS


@app.get("/api/alerts/{alert_id}")
def get_alert(alert_id: str):
    """Return single alert by ID."""
    for alert in ALERTS:
        if alert["id"] == alert_id:
            return alert
    return {"error": f"Alert {alert_id} not found"}


@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    """
    WebSocket live alerts stream.
    In demo mode, sends random alerts continuously.
    In static mode, replays seed alerts once.
    """
    await websocket.accept()

    # --- DEMO MODE ---
    if DEMO_MODE:
        while True:
            alert = random_flow()
            await websocket.send_text(json.dumps(alert))
            await asyncio.sleep(random.uniform(1.0, 2.5))
        # unreachable, loop continues

    # --- STATIC MODE ---
    if not ALERTS:
        await websocket.send_text(json.dumps({"info": "no alerts found"}))
    else:
        for alert in ALERTS:
            alert["timestamp"] = datetime.utcnow().isoformat() + "Z"
            await websocket.send_text(json.dumps(alert))
            await asyncio.sleep(1.5)
        await websocket.close()
