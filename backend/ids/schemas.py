"""
Pydantic models & constants used across IDS module.

- FEATURES: canonical feature list (order matters for models)
- LABELS: canonical labels for classification
- Alert models: Pydantic models to validate alerts exchanged over API / WS
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, IPvAnyAddress

# -----------------------
# Canonical feature list
# Keep this synced with datasets/index.yaml and artifacts/feature_list.json
# Add/remove features carefully and inform frontend & data teams.
# -----------------------
FEATURES = [
    "flow_duration",
    "pkt_rate",
    "syn_ratio",
    "byte_rate",
    "avg_pkt_size",
    "fwd_pkt_count",
    "bwd_pkt_count",
    "fwd_byte_rate",
    "bwd_byte_rate",
    "tcp_flags_ratio",
    "unique_dst_ports",
    "unique_dst_ips",
    "tcp_window_avg",
    "ttl_avg",
    "iat_mean",  # inter-arrival time mean
    "pkt_size_std",
]

# -----------------------
# Canonical labels
# -----------------------
LABELS = [
    "BENIGN",
    "DDoS_SYN",
    "DDoS_UDP",
    "BRUTE_FTP",
    "SCAN_PORT",
    "MITM_ARP",
]


# -----------------------
# Pydantic models for alerts / explainability
# -----------------------
class FeatureContribution(BaseModel):
    name: str = Field(..., description="Feature name")
    contrib: float = Field(..., description="Contribution value (signed)")


class Explainability(BaseModel):
    method: str = Field(
        ..., description="Explainability method, e.g., 'shap_tree' or 'lime_tabular'"
    )
    version: Optional[str] = None
    sample_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class Alert(BaseModel):
    id: str = Field(..., description="Unique alert id (uuid recommended)")
    timestamp: datetime = Field(..., description="ISO timestamp of the detection")
    src_ip: IPvAnyAddress
    dst_ip: IPvAnyAddress
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    proto: Optional[str] = None
    label: str = Field(..., description="Predicted label (one of LABELS)")
    score: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence/probability (0..1)"
    )
    severity: Optional[str] = Field(
        None, description="User-facing severity: low/medium/high"
    )
    top_features: Optional[List[FeatureContribution]] = Field(
        [], description="Top contributing features for the prediction"
    )
    explainability: Optional[Explainability] = None
    metadata: Optional[Dict[str, Any]] = Field(
        {}, description="Free-form metadata (for pentest correlations, hostnames, etc.)"
    )

    class Config:
        schema_extra = {
            "example": {
                "id": "aegis-alert-0001",
                "timestamp": "2025-10-11T12:00:00Z",
                "src_ip": "10.0.0.5",
                "dst_ip": "10.0.0.10",
                "src_port": 51234,
                "dst_port": 80,
                "proto": "TCP",
                "label": "DDoS_SYN",
                "score": 0.94,
                "severity": "high",
                "top_features": [{"name": "pkt_rate", "contrib": 0.31}],
                "explainability": {
                    "method": "shap_tree",
                    "version": "0.44.1",
                    "sample_id": "row-123",
                },
            }
        }
