# backend/ids/loaders.py
import json
from pathlib import Path


def load_alert_seed():
    root = Path(__file__).resolve().parents[2]
    seed_path = root / "seed" / "alerts.json"
    if not seed_path.exists():
        print(f"⚠️ Missing seed alerts file at {seed_path}")
        return []
    try:
        with open(seed_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Failed to load alerts: {e}")
        return []
