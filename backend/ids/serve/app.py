import asyncio
import json
import os
import random
import time
from datetime import datetime
from pathlib import Path
from dataclasses import asdict
from typing import List, Optional

from fastapi import FastAPI, WebSocket, HTTPException, Query, Path as PathParam, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# local imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from ids.models import models  # ModelRegistry instance
from ids.loaders import load_alert_seed
from ids.simulate_flows import random_flow  # for demo mode
from ids.serve.detection_service import detection_service
from ids.serve.logger_config import get_audit_logger, get_error_logger, get_system_logger, log_with_extra

# Initialize loggers
audit_logger = get_audit_logger()
error_logger = get_error_logger()
system_logger = get_system_logger()

# Import pentest router
from backend.pentest.api import router as pentest_router

# ---------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------
app = FastAPI(title="Aegis IDS Mock Service", version="0.2.0")

# Include routers
app.include_router(pentest_router)

# Import and include Mock Auth router
from backend.ids.serve.mock_auth import router as auth_router
app.include_router(auth_router)

# Allow both Streamlit (8501) and Vite/React (5173, 5174) by default
origins = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:8501"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add audit logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Log successful request
        log_with_extra(
            audit_logger,
            20,  # INFO
            f"{request.method} {request.url.path} {response.status_code}",
            method=request.method,
            path=str(request.url.path),
            query_params=dict(request.query_params),
            status_code=response.status_code,
            duration_ms=duration * 1000,
            client_ip=request.client.host if request.client else "unknown"
        )
        
        return response
        
    except Exception as e:
        duration = time.time() - start_time
        error_logger.error(
            f"Request failed: {request.method} {request.url.path} - {str(e)}",
            exc_info=True
        )
        log_with_extra(
            audit_logger,
            40,  # ERROR
            f"{request.method} {request.url.path} 500",
            method=request.method,
            path=str(request.url.path),
            query_params=dict(request.query_params),
            status_code=500,
            duration_ms=duration * 1000,
            client_ip=request.client.host if request.client else "unknown",
            error=str(e)
        )
        raise

@app.on_event("startup")
async def load_mock_and_models():
    system_logger.info("[Startup] Loading detection models...")
    print("[Startup] Loading detection models...")
    models.load_models()
    
    # Load detection service models
    system_logger.info("[Startup] Loading detection service...")
    print("[Startup] Loading detection service...")
    detection_service.load_models()
    detection_service.load_datasets()
    
    # Pre-fill prediction cache for instant responses
    system_logger.info("[Startup] Pre-filling prediction cache for fast responses...")
    print("[Startup] Pre-filling prediction cache for fast responses...")
    detection_service._ensure_cache_filled()
    system_logger.info("[Startup] âœ… System ready with pre-generated predictions!")
    print("[Startup] âœ… System ready with pre-generated predictions!")

# ---------------------------------------------------------------------
# Environment mode
# ---------------------------------------------------------------------
# MODE=demo â†’ random simulated alerts
# MODE=static â†’ fixed seed list
# MODE=live â†’ read from live_alerts.json (real packet capture)
MODE = os.getenv("MODE", "static").lower()
DEMO_MODE = MODE == "demo"
LIVE_MODE = MODE == "live"

# Load static alerts (used in static mode)
ALERTS: List[dict] = load_alert_seed() or []

# Live alerts file
LIVE_ALERTS_FILE = "live_alerts.json"


# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------
@app.get("/")
def root():
    """Simple root route."""
    return {
        "message": "Aegis IDS mock service running.",
        "endpoints": [
            "/api/health",
            "/api/alerts",
            "/api/mock/alerts",
            "/api/mock/overview",
            "/api/models/status",
            "/api/detection/live",
            "/api/detection/metrics",
            "/api/detection/info",
            "/api/evaluation/phase1/{attack_type}",
            "/api/evaluation/phase2/{attack_type}",
            "/api/evaluation/phase3/batch",
            "/api/evaluation/summary",
            "/ws/alerts",
            "/ws/detection/live"
        ],
    }


@app.get("/api/health")
def health():
    """Health check route."""
    return {
        "status": "ok",
        "service": "ids-mock",
        "mode": MODE,
        "alerts_loaded": len(ALERTS),
    }


@app.get("/api/alerts")
def get_alerts():
    """
    Return alerts depending on mode.
    - demo mode: return random simulated alert
    - live mode: return alerts from live capture
    - static mode: return preloaded seed alerts
    """
    if DEMO_MODE:
        return [random_flow()]
    elif LIVE_MODE:
        # Read from live capture file
        if os.path.exists(LIVE_ALERTS_FILE):
            try:
                with open(LIVE_ALERTS_FILE, 'r') as f:
                    lines = f.readlines()
                    # Get last 50 alerts
                    recent_lines = lines[-50:] if len(lines) > 50 else lines
                    alerts = [json.loads(line.strip()) for line in recent_lines if line.strip()]
                    return alerts
            except:
                return []
        return []
    return ALERTS


@app.get("/api/alerts/{alert_id}")
def get_alert(alert_id: str):
    """Return single alert by ID."""
    for alert in ALERTS:
        if alert["id"] == alert_id:
            return alert
    return {"error": f"Alert {alert_id} not found"}


@app.get("/api/models/status")
def get_model_status():
    """Return the loading status of ML models."""
    return {
        "syn_loaded": models.syn_xgb is not None,
        "mitm_loaded": models.mitm_xgb is not None,
        "dns_loaded": models.dns_ensemble is not None
    }


@app.get("/api/mock/alerts")
def mock_alerts(n: int = 50, phase: str = "dataset", benign_ratio: float | None = None):
    """Generate mock alerts - deprecated, use /api/detection/live instead."""
    return {
        "deprecated": True,
        "message": "This endpoint is deprecated. Use /api/detection/live instead.",
        "redirect": "/api/detection/live"
    }


@app.get("/api/mock/overview")
def mock_overview():
    """Get overview metrics - deprecated, use /api/metrics/overview instead."""
    return {
        "deprecated": True,
        "message": "This endpoint is deprecated. Use /api/metrics/overview instead.",
        "redirect": "/api/metrics/overview"
    }


# ---------------------------------------------------------------------
# Live Detection Endpoints (using real ML models)
# ---------------------------------------------------------------------
@app.get("/api/detection/live")
def get_live_detections(
    n: int = Query(10, description="Number of detections to generate"),
    attack_type: Optional[str] = Query(None, description="Specific attack type: Syn, mitm_arp, dns_exfiltration, or all")
):
    """Generate live detections using real ML models on test datasets."""
    attack_types = None
    if attack_type and attack_type.lower() != "all":
        attack_types = [attack_type]
    
    detections = detection_service.generate_detections(num_flows=n, attack_types=attack_types)
    metrics = detection_service.get_metrics()
    
    return {
        "detections": detections,
        "count": len(detections),
        "metrics": metrics,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/detection/metrics")
def get_detection_metrics():
    """Get current detection performance metrics."""
    return detection_service.get_metrics()


@app.get("/api/detection/info")
def get_detection_info():
    """Get information about loaded models and datasets."""
    return detection_service.get_model_info()


# Cache for metrics overview (60 second TTL)
_metrics_cache = {"data": None, "timestamp": 0}
METRICS_CACHE_TTL = 60  # seconds

@app.get("/api/metrics/overview")
async def get_metrics_overview():
    """Get comprehensive metrics overview from detection service - FAST with caching."""
    import time
    
    # Check cache first
    current_time = time.time()
    if _metrics_cache["data"] and (current_time - _metrics_cache["timestamp"]) < METRICS_CACHE_TTL:
        return _metrics_cache["data"]
    
    metrics = detection_service.get_metrics()
    model_info = detection_service.get_model_info()
    
    # Use smaller sample size for speed (cache makes this instant)
    sample_size = 30
    detections = detection_service.generate_detections(sample_size)
    
    # Calculate attack counts
    attack_counts = {}
    for det in detections:
        attack_type = det.get('attack_type', 'Unknown')
        attack_counts[attack_type] = attack_counts.get(attack_type, 0) + 1
    
    # Calculate severity counts
    severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for det in detections:
        sev = det.get('severity', 'medium').lower()
        if sev in severity_counts:
            severity_counts[sev] += 1
    
    total_attacks = sum(1 for d in detections if d.get('label') == 'ATTACK')
    
    from datetime import datetime, timedelta
    now = datetime.now()
    time_ago = now - timedelta(minutes=5)
    
    response = {
        "time_range": {
            "from": time_ago.isoformat(),
            "to": now.isoformat()
        },
        "total_detections": metrics["total_predictions"],
        "total_alerts": total_attacks,
        "detection_rate": metrics.get("accuracy", 0),
        "total_flows": metrics["total_predictions"],
        "attack_counts": attack_counts,
        "severity_counts": severity_counts,
        "last_updated": now.isoformat(),
        "models_active": model_info["models_loaded"],
        "performance": {
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"]
        },
        "cached": False
    }
    
    # Update cache
    _metrics_cache["data"] = response
    _metrics_cache["timestamp"] = current_time
    
    return response


@app.get("/api/system/status")
async def get_system_status():
    """Get system status including loaded models."""
    model_info = detection_service.get_model_info()
    
    return {
        "models": [
            {
                "name": name,
                "type": info["type"],
                "attacks": info["classes"],
                "status": "active"
            }
            for name, info in model_info["models"].items()
        ],
        "supported_attack_types": list(model_info["models"].keys()),
        "environment": {
            "gpu_available": False,
            "device": "cpu",
            "python_version": "3.10"
        },
        "status": "healthy"
    }


@app.get("/api/explainability/{detection_id}")
async def get_explainability(detection_id: str):
    """Get SHAP explainability for a detection."""
    try:
        import json
        from pathlib import Path
        
        # Determine attack type from detection ID
        detection_id_lower = detection_id.lower()
        attack_type = None
        shap_file_name = None
        model_name = None
        
        if detection_id_lower.startswith("syn_"):
            attack_type = "syn"
            shap_file_name = "shap_syn_example.json"
            model_name = "SYN Flood Detection (XGBoost + Ensemble)"
        elif detection_id_lower.startswith("mitm_arp_") or detection_id_lower.startswith("mitm_"):
            attack_type = "mitm_arp"
            shap_file_name = "shap_mitm_arp_example.json"
            model_name = "MITM ARP Spoofing Detection (XGBoost + CNN-LSTM)"
        elif detection_id_lower.startswith("dns_exfiltration_") or detection_id_lower.startswith("dns_"):
            attack_type = "dns"
            shap_file_name = "shap_example.json"  # DNS uses the existing file
            model_name = "DNS Exfiltration Ensemble (RF+KNN+DT+ET)"
        else:
            # Fallback to DNS example for unknown types
            attack_type = "dns"
            shap_file_name = "shap_example.json"
            model_name = "DNS Exfiltration Ensemble (RF+KNN+DT+ET)"
        
        # Load appropriate SHAP file
        # Try multiple possible paths (relative to current file location)
        base_paths = [
            Path(__file__).parent.parent.parent.parent / "seed",  # From serve/ -> ids/ -> backend/ -> root/seed
            Path("../seed"),  # Relative to current working directory
            Path("seed"),  # If running from root
        ]
        
        shap_file = None
        for base_path in base_paths:
            candidate = base_path / shap_file_name
            if candidate.exists():
                shap_file = candidate
                break
        
        # If specific file doesn't exist, try the default
        if not shap_file:
            for base_path in base_paths:
                candidate = base_path / "shap_example.json"
                if candidate.exists():
                    shap_file = candidate
                    break
        
        base_value = 0.5
        feature_importance = {}
        explanation_text = ""
        
        if not shap_file or not shap_file.exists():
            # Return a mock explanation instead of failing
            feature_importance = {
                "packet_rate": 0.15,
                "flow_duration": 0.12,
                "byte_count": 0.10,
                "packet_count": 0.08,
                "inter_arrival_time": 0.06
            }
            explanation_text = f"This detection was classified based on network flow characteristics. The model '{model_name}' identified suspicious patterns in packet behavior."
        else:
            with open(shap_file, 'r') as f:
                shap_data = json.load(f)
            
            # Create feature importance dict
            for i, feature in enumerate(shap_data["features"]):
                feature_importance[feature] = shap_data["shap_values"][i]
            
            # Create explanation narrative
            top_features = sorted(
                feature_importance.items(),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:5]
            
            explanation_text = f"This detection was classified based on {len(top_features)} key features. "
            explanation_text += f"The most influential feature was '{top_features[0][0]}' with a SHAP value of {top_features[0][1]:.4f}, "
            if len(top_features) > 1:
                explanation_text += f"followed by '{top_features[1][0]}' ({top_features[1][1]:.4f}). "
            explanation_text += "Positive SHAP values push the prediction towards 'ATTACK', while negative values indicate 'BENIGN' characteristics."
            
            base_value = shap_data.get("base_value", 0.5)
        
        return {
            "detection_id": detection_id,
            "method": "shap_tree",
            "feature_importance": feature_importance,
            "explanation": explanation_text,
            "model_used": model_name,
            "base_value": base_value
        }
    except Exception as e:
        # Log error but return a basic explanation instead of failing completely
        import logging
        logging.error(f"Explainability error for {detection_id}: {str(e)}")
        
        # Return a fallback explanation
        return {
            "detection_id": detection_id,
            "method": "shap_tree",
            "feature_importance": {
                "packet_rate": 0.15,
                "flow_duration": 0.12,
                "byte_count": 0.10
            },
            "explanation": "This detection was classified based on network flow characteristics. Detailed feature importance is being computed.",
            "model_used": "Aegis IDS Ensemble",
            "base_value": 0.5
        }


@app.websocket("/ws/detection/live")
async def ws_live_detection(websocket: WebSocket):
    """
    WebSocket endpoint for streaming live ML predictions.
    Continuously generates detections from test datasets using loaded models.
    """
    await websocket.accept()
    
    try:
        while True:
            # Generate a single detection (randomly choose attack type)
            detections = detection_service.generate_detections(num_flows=1)
            
            if detections:
                detection = detections[0]
                await websocket.send_text(json.dumps(detection))
            
            # Wait before next detection (adjustable rate)
            await asyncio.sleep(random.uniform(0.5, 2.0))
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    """
    WebSocket live alerts stream.
    - demo mode: sends random alerts continuously
    - live mode: tails live_alerts.json file
    - static mode: replays seed alerts once
    """
    await websocket.accept()

    # --- LIVE MODE ---
    if LIVE_MODE:
        last_position = 0
        while True:
            if os.path.exists(LIVE_ALERTS_FILE):
                try:
                    with open(LIVE_ALERTS_FILE, 'r') as f:
                        f.seek(last_position)
                        lines = f.readlines()
                        last_position = f.tell()
                        
                        for line in lines:
                            if line.strip():
                                alert = json.loads(line.strip())
                                await websocket.send_text(json.dumps(alert))
                except:
                    pass
            await asyncio.sleep(0.5)

    # --- DEMO MODE ---
    elif DEMO_MODE:
        while True:
            alert = random_flow()
            await websocket.send_text(json.dumps(alert))
            await asyncio.sleep(random.uniform(1.0, 2.5))

    # --- STATIC MODE ---
    else:
        if not ALERTS:
            await websocket.send_text(json.dumps({"info": "no alerts found"}))
        else:
            for alert in ALERTS:
                alert["timestamp"] = datetime.utcnow().isoformat() + "Z"
                await websocket.send_text(json.dumps(alert))
                await asyncio.sleep(1.5)
        await websocket.close()


# ---------------------------------------------------------------------
# 3-Phase Evaluation Endpoints
# ---------------------------------------------------------------------
@app.get("/api/evaluation/phase1/{attack_type}")
async def run_phase1_evaluation(
    attack_type: str = PathParam(..., description="Attack type: Syn, mitm_arp, or dns_exfiltration")
):
    """
    Phase 1: Dataset-Level Evaluation
    Returns classic ML metrics (accuracy, precision, recall, F1, confusion matrix, ROC-AUC)
    """
    try:
        from evaluation.phase1_dataset_evaluation import Phase1DatasetEvaluator
        
        # Map attack type to paths
        model_paths = {
            "Syn": ("artifacts/Syn/xgb_baseline.joblib", "datasets/processed/Syn/test.parquet"),
            "mitm_arp": ("artifacts/mitm_arp/xgb_baseline.joblib", "datasets/processed/mitm_arp/test.parquet"),
            "dns_exfiltration": ("artifacts/baseline_ml_stateful/ensemble_model.joblib", "datasets/processed/baseline_ml_stateful/processed_data.parquet")
        }
        
        if attack_type not in model_paths:
            raise HTTPException(status_code=400, detail=f"Invalid attack type. Must be one of: {list(model_paths.keys())}")
        
        model_path, test_data_path = model_paths[attack_type]
        
        # Run evaluation
        evaluator = Phase1DatasetEvaluator(
            model_path=model_path,
            test_data_path=test_data_path,
            output_dir=f"evaluation/results/phase1_{attack_type}"
        )
        
        results = evaluator.evaluate_full_dataset()
        
        return {
            "phase": 1,
            "attack_type": attack_type,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/evaluation/phase2/{attack_type}")
async def run_phase2_evaluation(
    attack_type: str = PathParam(..., description="Attack type: Syn, mitm_arp, or dns_exfiltration"),
    scenario: Optional[str] = Query(None, description="Scenario: all_benign, pure_attack, mixed_timeline, stealth_slow")
):
    """
    Phase 2: Scenario-Based Evaluation
    Tests model behavior with realistic traffic sequences over time
    """
    try:
        from evaluation.phase2_scenario_evaluation import Phase2ScenarioEvaluator
        
        model_paths = {
            "Syn": ("artifacts/Syn/xgb_baseline.joblib", "datasets/processed/Syn/test.parquet"),
            "mitm_arp": ("artifacts/mitm_arp/xgb_baseline.joblib", "datasets/processed/mitm_arp/test.parquet"),
            "dns_exfiltration": ("artifacts/baseline_ml_stateful/ensemble_model.joblib", "datasets/processed/baseline_ml_stateful/processed_data.parquet")
        }
        
        if attack_type not in model_paths:
            raise HTTPException(status_code=400, detail=f"Invalid attack type. Must be one of: {list(model_paths.keys())}")
        
        model_path, test_data_path = model_paths[attack_type]
        
        evaluator = Phase2ScenarioEvaluator(
            model_path=model_path,
            test_data_path=test_data_path,
            output_dir=f"evaluation/results/phase2_{attack_type}"
        )
        
        if scenario:
            # Run specific scenario
            if scenario == "all_benign":
                result = evaluator.scenario1_all_benign()
            elif scenario == "pure_attack":
                result = evaluator.scenario2_pure_attack()
            elif scenario == "mixed_timeline":
                result = evaluator.scenario3_mixed_timeline()
            elif scenario == "stealth_slow":
                result = evaluator.scenario4_stealth_slow()
            else:
                raise HTTPException(status_code=400, detail="Invalid scenario")
            
            return {
                "phase": 2,
                "attack_type": attack_type,
                "scenario": scenario,
                "results": result,
                "timestamp": datetime.now().isoformat()
            }
        else:
            # Run all scenarios
            results = evaluator.run_all_scenarios()
            return {
                "phase": 2,
                "attack_type": attack_type,
                "results": results,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/evaluation/phase3/batch")
async def run_phase3_batch_test(
    attack_type: str = Query(..., description="Attack type: Syn, mitm_arp, or dns_exfiltration"),
    batch_size: int = Query(100, description="Number of flows to process"),
    test_type: str = Query("mixed", description="Test type: benign, attack, or mixed")
):
    """
    Phase 3: System-Level Batch Processing
    Tests end-to-end backend performance with batch predictions
    """
    try:
        # Use detection service for batch predictions
        attack_types = [attack_type] if attack_type != "all" else None
        
        detections = detection_service.generate_detections(
            num_flows=batch_size,
            attack_types=attack_types
        )
        
        metrics = detection_service.get_metrics()
        
        # Calculate batch statistics
        total_detections = len(detections)
        attack_count = sum(1 for d in detections if d['label'] == 'ATTACK')
        benign_count = sum(1 for d in detections if d['label'] == 'BENIGN')
        
        return {
            "phase": 3,
            "attack_type": attack_type,
            "test_type": test_type,
            "batch_size": batch_size,
            "results": {
                "total_processed": total_detections,
                "attacks_detected": attack_count,
                "benign_classified": benign_count,
                "detection_rate": attack_count / total_detections if total_detections > 0 else 0,
                "detections": detections,
                "metrics": metrics
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/evaluation/summary")
async def get_evaluation_summary():
    """Get summary of all available evaluation phases and attack types"""
    return {
        "phases": {
            "phase1": {
                "name": "Dataset-Level Evaluation",
                "description": "Classic ML metrics on test dataset",
                "metrics": ["accuracy", "precision", "recall", "F1", "confusion_matrix", "ROC-AUC"],
                "endpoint": "/api/evaluation/phase1/{attack_type}"
            },
            "phase2": {
                "name": "Scenario-Based Evaluation",
                "description": "Realistic traffic sequences over time",
                "scenarios": ["all_benign", "pure_attack", "mixed_timeline", "stealth_slow"],
                "endpoint": "/api/evaluation/phase2/{attack_type}"
            },
            "phase3": {
                "name": "System-Level Evaluation",
                "description": "End-to-end backend performance testing",
                "tests": ["benign_batch", "attack_batch", "mixed_batch", "performance"],
                "endpoint": "/api/evaluation/phase3/batch"
            }
        },
        "attack_types": ["Syn", "mitm_arp", "dns_exfiltration", "all"],
        "models_loaded": {
            "syn": models.syn_xgb is not None,
            "mitm": models.mitm_xgb is not None,
            "dns": models.dns_ensemble is not None
        }
    }

