"""
stream.py — Fake alert generator for Iteration 1 demo.
Emits random alerts using the frozen schema and shap_example.json.
"""

import asyncio, json, random, uuid
from datetime import datetime
from pathlib import Path
from ids.schemas import LABELS, FEATURES, Alert, FeatureContribution, Explainability

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "seed"
SHAP_EXAMPLE = SEED / "shap_example.json"

def generate_alert() -> dict:
    """Return a randomized fake alert conforming to Alert schema."""
    try:
        shap_data = json.load(open(SHAP_EXAMPLE)) if SHAP_EXAMPLE.exists() else {}
    except Exception:
        shap_data = {}

    label = random.choice(LABELS)
    score = round(random.uniform(0.7, 0.99), 2)
    severity = random.choice(["low", "medium", "high"])
    sample_id = str(uuid.uuid4())

    # select 3 random top features
    top_feats = [
        {"name": random.choice(FEATURES), "contrib": round(random.uniform(0.1, 0.5), 2)}
        for _ in range(3)
    ]

    alert = Alert(
        id=f"aegis-{sample_id}",
        timestamp=datetime.utcnow(),
        src_ip=f"10.0.0.{random.randint(2, 240)}",
        dst_ip=f"10.0.0.{random.randint(2, 240)}",
        src_port=random.randint(1024, 65000),
        dst_port=random.choice([22, 80, 443]),
        proto=random.choice(["TCP", "UDP"]),
        label=label,
        score=score,
        severity=severity,
        top_features=[FeatureContribution(**f) for f in top_feats],
        explainability=Explainability(
            method=shap_data.get("method", "shap_tree"),
            version=shap_data.get("version", "0.44.1"),
            sample_id=sample_id,
            details=shap_data.get("top_features", {}),
        ),
    )
    return alert.dict()

async def alert_stream():
    """Async generator for fake alerts (used by WebSocket)."""
    while True:
        yield generate_alert()
        await asyncio.sleep(random.uniform(0.8, 1.5))  # 1 alert/sec
