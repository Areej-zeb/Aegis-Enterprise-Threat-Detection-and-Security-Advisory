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
# Canonical feature lists
# Keep this synced with datasets/index.yaml and artifacts/feature_list.json
# Add/remove features carefully and inform frontend & data teams.
# -----------------------

# SYN FLOOD FEATURES (30 features) - Optimized for DDoS SYN detection
SYN_FEATURES = [
    # Flow duration & packets (CRITICAL)
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    
    # Packet size statistics (IMPORTANT)
    "Fwd Packet Length Mean",
    "Fwd Packet Length Std",
    "Bwd Packet Length Mean",
    "Bwd Packet Length Std",
    
    # Flow rates (CRITICAL for DDoS detection)
    "Flow Packets/s",
    "Flow Bytes/s",
    
    # Inter-arrival times (IMPORTANT)
    "Flow IAT Mean",
    "Flow IAT Std",
    "Fwd IAT Mean",
    "Fwd IAT Std",
    "Bwd IAT Mean",
    "Bwd IAT Std",
    
    # TCP flags (CRITICAL for SYN flood!)
    "FIN Flag Count",
    "SYN Flag Count",  # Most important for SYN flood!
    "RST Flag Count",
    "PSH Flag Count",
    "ACK Flag Count",
    "URG Flag Count",
    
    # Header lengths
    "Fwd Header Length",
    "Bwd Header Length",
    
    # Subflow features
    "Subflow Fwd Packets",
    "Subflow Bwd Packets",
    "Subflow Fwd Bytes",
    "Subflow Bwd Bytes",
    
    # Protocol
    "Protocol",
]

# MITM ARP SPOOFING FEATURES (26 features) - Optimized for ARP spoofing detection
MITM_FEATURES = [
    # Network flow features (CRITICAL)
    "bidirectional_duration_ms",
    "bidirectional_packets",
    "bidirectional_bytes",
    "src2dst_packets",
    "src2dst_bytes",
    "dst2src_packets",
    "dst2src_bytes",
    
    # Packet size statistics (CRITICAL)
    "bidirectional_min_ps",
    "bidirectional_mean_ps",
    "bidirectional_stddev_ps",
    "bidirectional_max_ps",
    "src2dst_min_ps",
    "src2dst_mean_ps",
    "src2dst_stddev_ps",
    "dst2src_min_ps",
    "dst2src_mean_ps",
    "dst2src_stddev_ps",
    
    # Inter-arrival times (IMPORTANT)
    "bidirectional_min_piat_ms",
    "bidirectional_mean_piat_ms",
    "bidirectional_stddev_piat_ms",
    "bidirectional_max_piat_ms",
    
    # TCP flags (CRITICAL for ARP spoofing)
    "bidirectional_syn_packets",
    "bidirectional_fin_packets",
    "bidirectional_rst_packets",
    
    # Protocol
    "protocol",
]

# DNS EXFILTRATION FEATURES - Stateless (7 features) - Only highly discriminative numeric features
DNS_STATELESS_FEATURES = [
    "numeric",           # 1.564 - Number of numeric characters (HIGH)
    "special",           # 1.468 - Special characters count (HIGH)
    "labels",            # 1.448 - Number of labels in domain (HIGH)
    "subdomain_length",  # 1.403 - Subdomain length (HIGH)
    "FQDN_count",        # 1.279 - Fully qualified domain name count (HIGH)
    "lower",             # 0.889 - Lowercase characters (MEDIUM)
    "entropy",           # 0.633 - Shannon entropy (MEDIUM)
]

# DNS EXFILTRATION FEATURES - Stateful (16 features) - Only numeric behavioral features
DNS_STATEFUL_FEATURES = [
    "A_frequency",
    "NS_frequency",
    "CNAME_frequency",
    "SOA_frequency",
    "NULL_frequency",
    "PTR_frequency",
    "HINFO_frequency",
    "MX_frequency",
    "TXT_frequency",
    "AAAA_frequency",
    "SRV_frequency",
    "OPT_frequency",
    "rr_count",
    "rr_name_entropy",
    "rr_name_length",
    "distinct_ns",
    "a_records",
    "ttl_mean",
    "ttl_variance",
]

# Legacy feature list (kept for backward compatibility)
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
    "DNS_EXFILTRATION",
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
