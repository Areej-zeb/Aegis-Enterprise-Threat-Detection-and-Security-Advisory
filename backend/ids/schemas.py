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


# -----------------------
# Alert Formatting System
# -----------------------

# Feature mapping for human-readable descriptions
FEATURE_MAP = {
    "pkt_rate": "high number of packets per second",
    "Flow Duration": "duration of network flow",
    "SYN Flag Count": "SYN packets observed",
    "Flow IAT Mean": "average inter-arrival time of packets",
    "Flow Packets/s": "packet rate per second",
    "Flow Bytes/s": "byte rate per second",
    "Total Fwd Packets": "forward packets count",
    "Total Backward Packets": "backward packets count",
    "bidirectional_packets": "total bidirectional packets",
    "bidirectional_bytes": "total bidirectional bytes",
    "numeric": "numeric characters in domain",
    "special": "special characters count",
    "labels": "number of labels in domain",
    "subdomain_length": "subdomain length",
    "entropy": "Shannon entropy of domain",
    "syn_ratio": "ratio of SYN packets",
    "byte_rate": "bytes per second",
    "avg_pkt_size": "average packet size",
    "tcp_flags_ratio": "TCP flags ratio",
    "unique_dst_ports": "unique destination ports",
    "unique_dst_ips": "unique destination IPs",
    "tcp_window_avg": "average TCP window size",
    "ttl_avg": "average time-to-live",
    "iat_mean": "mean inter-arrival time",
    "pkt_size_std": "packet size standard deviation",
}

# Alert type definitions with descriptions and recommendations
ALERT_DEFINITIONS = {
    "DDoS_SYN": {
        "description": "A SYN flood DDoS attack where an attacker sends numerous SYN requests to overwhelm the target system",
        "recommendations": [
            "Enable SYN cookies on the target server to mitigate SYN flood attacks",
            "Configure rate limiting rules on firewalls to block excessive SYN packets from the source IP",
            "Review and potentially block the source IP address if the attack persists",
            "Monitor server resources (CPU, memory, connection pools) for signs of exhaustion",
            "Consider implementing connection timeout adjustments to free up resources faster"
        ],
        "references": [
            "https://attack.mitre.org/techniques/T1498/001/",
            "https://www.cisa.gov/news-events/alerts/2013/06/05/understanding-denial-service-attacks"
        ]
    },
    "DDoS_UDP": {
        "description": "A UDP flood DDoS attack where the attacker sends large volumes of UDP packets to random ports",
        "recommendations": [
            "Implement rate limiting for UDP traffic on network devices",
            "Block or throttle UDP traffic from the source IP address",
            "Verify that UDP services are necessary and disable unused UDP ports",
            "Deploy DDoS mitigation appliances or cloud-based DDoS protection services",
            "Monitor bandwidth consumption and packet rates"
        ],
        "references": [
            "https://attack.mitre.org/techniques/T1498/",
            "https://www.cloudflare.com/learning/ddos/udp-flood-ddos-attack/"
        ]
    },
    "SCAN_PORT": {
        "description": "A port scanning activity where an attacker probes the target system to identify open ports and services",
        "recommendations": [
            "Block the source IP address at the firewall level",
            "Enable intrusion detection/prevention systems (IDS/IPS) to automatically detect and block scanning attempts",
            "Review and close unnecessary open ports on the target system",
            "Implement port knocking or other port obfuscation techniques for sensitive services",
            "Monitor for follow-up exploitation attempts after the scan"
        ],
        "references": [
            "https://attack.mitre.org/techniques/T1046/",
            "https://owasp.org/www-community/attacks/Port_Scanning"
        ]
    },
    "BRUTE_FTP": {
        "description": "A brute force attack where an attacker attempts multiple login combinations to gain unauthorized access",
        "recommendations": [
            "Implement account lockout policies after a threshold of failed login attempts",
            "Enable multi-factor authentication (MFA) for all user accounts",
            "Deploy rate limiting on authentication endpoints",
            "Block the source IP address and monitor for distributed brute force attempts",
            "Review authentication logs for successful logins following failed attempts",
            "Consider implementing CAPTCHA challenges after failed login attempts"
        ],
        "references": [
            "https://attack.mitre.org/techniques/T1110/",
            "https://owasp.org/www-community/attacks/Brute_force_attack"
        ]
    },
    "MITM_ARP": {
        "description": "An ARP spoofing attack where an attacker intercepts network traffic by poisoning ARP tables",
        "recommendations": [
            "Implement static ARP entries for critical network devices",
            "Deploy ARP inspection features on network switches",
            "Monitor for duplicate MAC addresses on the network",
            "Use network segmentation to limit the impact of ARP spoofing",
            "Enable port security features on network switches",
            "Consider implementing 802.1X authentication for network access"
        ],
        "references": [
            "https://attack.mitre.org/techniques/T1557/002/",
            "https://owasp.org/www-community/attacks/Man-in-the-middle_attack"
        ]
    },
    "DNS_EXFILTRATION": {
        "description": "A DNS exfiltration attack where sensitive data is stolen through DNS queries and responses",
        "recommendations": [
            "Monitor DNS queries for unusual patterns, long domain names, or high entropy",
            "Implement DNS filtering and blocking of suspicious domains",
            "Deploy DNS monitoring tools to detect data exfiltration attempts",
            "Review and restrict DNS server configurations",
            "Monitor network traffic for excessive DNS query volumes",
            "Consider implementing DNS over HTTPS (DoH) monitoring"
        ],
        "references": [
            "https://attack.mitre.org/techniques/T1048/003/",
            "https://www.sans.org/white-papers/34152/"
        ]
    }
}


def format_alert(alert: Alert) -> Dict[str, Any]:
    """
    Format a security alert into a human-readable response.
    
    Args:
        alert: Alert object containing security event details
        
    Returns:
        Dictionary containing summary, top_features, recommendations, and references
    """
    # Get alert type configuration
    alert_config = ALERT_DEFINITIONS.get(
        alert.label,
        {
            "description": f"A {alert.label} security event detected",
            "recommendations": [
                "Investigate the source IP address for malicious activity",
                "Review network logs for additional suspicious behavior",
                "Consider blocking the source IP if the threat is confirmed",
                "Monitor the target system for signs of compromise"
            ],
            "references": []
        }
    )
    
    # Build summary
    severity_text = alert.severity.upper() if alert.severity == "critical" else alert.severity.capitalize()
    summary = (
        f"{severity_text} severity alert: {alert_config['description']} detected from "
        f"{alert.src_ip}:{alert.src_port} targeting {alert.dst_ip}:{alert.dst_port} "
        f"with {int(alert.score * 100)}% confidence."
    )
    
    # Format top features in human-readable form
    top_features = []
    if alert.top_features:
        for feature in alert.top_features[:3]:  # Limit to top 3
            feature_description = FEATURE_MAP.get(feature.name, feature.name)
            contribution_pct = int(feature.contrib * 100)
            top_features.append({
                "feature": feature_description,
                "contribution": f"{contribution_pct}%",
                "technical_name": feature.name
            })
    
    # Build response
    response = {
        "alert_id": alert.id,
        "timestamp": alert.timestamp.isoformat() if isinstance(alert.timestamp, datetime) else alert.timestamp,
        "summary": summary,
        "details": {
            "source": f"{alert.src_ip}:{alert.src_port}",
            "destination": f"{alert.dst_ip}:{alert.dst_port}",
            "protocol": alert.proto,
            "attack_type": alert.label,
            "severity": alert.severity,
            "confidence_score": alert.score
        },
        "top_features": top_features,
        "recommendations": alert_config["recommendations"],
        "references": alert_config["references"] if alert_config["references"] else None,
        "explainability": {
            "method": alert.explainability.method if alert.explainability else "unknown",
            "version": alert.explainability.version if alert.explainability else None,
            "sample_id": alert.explainability.sample_id if alert.explainability else None
        } if alert.explainability else None
    }
    
    return response


# Example usage for FastAPI integration
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/api/v1/alerts/format")
async def format_security_alert(alert: Alert):
    '''
    Format a security alert into a human-readable chatbot response.
    '''
    try:
        formatted_response = format_alert(alert)
        return JSONResponse(content=formatted_response)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to format alert: {str(e)}"}
        )
"""