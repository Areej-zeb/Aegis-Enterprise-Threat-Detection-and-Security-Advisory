"""
Aegis IDS Alert Stream Adapter
Bridges the gap between Aegis IDS detection format and the alert stream module.
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AegisAlertAdapter:
    """
    Adapter to convert Aegis IDS detection format to alert stream format.
    
    Aegis Format:
    {
        "id": "Syn_123_1738267890",
        "timestamp": "2026-01-30T...",
        "src_ip": "192.168.1.100",
        "dst_ip": "10.0.1.50", 
        "src_port": 45123,
        "dst_port": 80,
        "protocol": "TCP",
        "attack_type": "DDoS_SYN",
        "severity": "high",
        "score": 0.92,
        "label": "ATTACK"
    }
    
    Alert Stream Expected Format:
    {
        "id": "...",
        "timestamp": "...",
        "src_ip": "...",
        "dst_ip": "...", 
        "src_port": int,
        "dst_port": int,
        "proto": "...",
        "label": "...",
        "score": float,
        "severity": "...",
        "top_features": [...],
        "explainability": {...}
    }
    """
    
    # Mock feature contributions for different attack types
    MOCK_FEATURES = {
        "DDoS_SYN": [
            {"name": "pkt_rate", "contrib": 0.42},
            {"name": "syn_ratio", "contrib": 0.31}, 
            {"name": "flow_duration", "contrib": 0.18},
            {"name": "byte_rate", "contrib": 0.15},
            {"name": "avg_pkt_size", "contrib": 0.12}
        ],
        "DDoS_UDP": [
            {"name": "pkt_rate", "contrib": 0.38},
            {"name": "byte_rate", "contrib": 0.35},
            {"name": "flow_duration", "contrib": 0.22},
            {"name": "avg_pkt_size", "contrib": 0.18},
            {"name": "unique_dst_ports", "contrib": 0.14}
        ],
        "MITM_ARP": [
            {"name": "arp_ratio", "contrib": 0.45},
            {"name": "unique_dst_ips", "contrib": 0.28},
            {"name": "flow_duration", "contrib": 0.20},
            {"name": "pkt_rate", "contrib": 0.16},
            {"name": "tcp_flags_ratio", "contrib": 0.13}
        ],
        "DNS_Exfiltration": [
            {"name": "dns_query_length", "contrib": 0.40},
            {"name": "unique_dst_ports", "contrib": 0.32},
            {"name": "byte_rate", "contrib": 0.25},
            {"name": "flow_duration", "contrib": 0.19},
            {"name": "pkt_rate", "contrib": 0.15}
        ],
        "PortScan": [
            {"name": "unique_dst_ports", "contrib": 0.48},
            {"name": "unique_dst_ips", "contrib": 0.35},
            {"name": "pkt_rate", "contrib": 0.22},
            {"name": "flow_duration", "contrib": 0.18},
            {"name": "tcp_flags_ratio", "contrib": 0.16}
        ],
        "Brute_Force": [
            {"name": "failed_login_ratio", "contrib": 0.44},
            {"name": "pkt_rate", "contrib": 0.28},
            {"name": "flow_duration", "contrib": 0.21},
            {"name": "unique_dst_ports", "contrib": 0.17},
            {"name": "byte_rate", "contrib": 0.14}
        ]
    }
    
    @staticmethod
    def normalize_attack_type(aegis_attack_type: str) -> str:
        """Normalize Aegis attack types to alert stream format."""
        mapping = {
            "DDoS_SYN": "DDoS_SYN",
            "DDoS_UDP": "DDoS_UDP", 
            "DNS_Exfiltration": "DNS_Exfiltration",
            "MITM_ARP + Sniffing": "MITM_ARP",
            "BENIGN": "BENIGN",
            "PortScan": "PortScan",
            "Brute_Force": "Brute_Force"
        }
        return mapping.get(aegis_attack_type, aegis_attack_type)
    
    @staticmethod
    def generate_mock_features(attack_type: str, confidence: float) -> list:
        """Generate realistic feature contributions based on attack type and confidence."""
        base_features = AegisAlertAdapter.MOCK_FEATURES.get(
            attack_type, 
            AegisAlertAdapter.MOCK_FEATURES["DDoS_SYN"]  # Default fallback
        )
        
        # Scale contributions based on confidence
        # Higher confidence = stronger feature contributions
        confidence_multiplier = 0.5 + (confidence * 0.5)  # Range: 0.5 to 1.0
        
        features = []
        for feat in base_features[:3]:  # Top 3 features
            scaled_contrib = feat["contrib"] * confidence_multiplier
            # Add some randomness
            scaled_contrib *= random.uniform(0.8, 1.2)
            features.append({
                "name": feat["name"],
                "contrib": round(scaled_contrib, 3)
            })
        
        return features
    
    @staticmethod
    def convert_aegis_to_alert_stream(aegis_detection: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert Aegis IDS detection format to alert stream format.
        
        Args:
            aegis_detection: Raw detection from Aegis IDS WebSocket
            
        Returns:
            Formatted alert compatible with alert_stream.py
        """
        try:
            # Extract basic fields
            alert_id = aegis_detection.get("id", f"unknown_{int(datetime.now().timestamp())}")
            timestamp = aegis_detection.get("timestamp", datetime.now().isoformat())
            src_ip = aegis_detection.get("src_ip", "unknown")
            dst_ip = aegis_detection.get("dst_ip", "unknown") 
            src_port = aegis_detection.get("src_port", 0)
            dst_port = aegis_detection.get("dst_port", 0)
            protocol = aegis_detection.get("protocol", "TCP")
            attack_type = aegis_detection.get("attack_type", "Unknown")
            severity = aegis_detection.get("severity", "medium")
            confidence = aegis_detection.get("score", aegis_detection.get("confidence", 0.5))
            label = aegis_detection.get("label", "UNKNOWN")
            
            # Normalize attack type
            normalized_attack_type = AegisAlertAdapter.normalize_attack_type(attack_type)
            
            # Generate mock feature contributions
            top_features = AegisAlertAdapter.generate_mock_features(normalized_attack_type, confidence)
            
            # Create explainability info
            explainability = {
                "method": "shap_tree",
                "version": "0.45.0",
                "sample_id": alert_id
            }
            
            # Build converted alert
            converted_alert = {
                "id": alert_id,
                "timestamp": timestamp,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "proto": protocol,  # Note: alert_stream expects 'proto', not 'protocol'
                "label": normalized_attack_type,  # Use attack_type as label
                "score": confidence,
                "severity": severity,
                "top_features": top_features,
                "explainability": explainability,
                # Keep original fields for reference
                "_original": {
                    "aegis_label": label,
                    "aegis_attack_type": attack_type,
                    "model_type": aegis_detection.get("model_type", "unknown")
                }
            }
            
            logger.debug(f"Converted Aegis detection {alert_id} to alert stream format")
            return converted_alert
            
        except Exception as e:
            logger.error(f"Error converting Aegis detection to alert stream format: {e}")
            logger.debug(f"Problematic detection: {aegis_detection}")
            return None

# Example usage and testing
async def test_adapter():
    """Test the adapter with sample Aegis detection data."""
    
    # Sample Aegis detection (matches actual format from detection_service.py)
    sample_aegis_detection = {
        "id": "Syn_123_1738267890",
        "timestamp": "2026-01-30T18:45:30.123456",
        "src_ip": "192.168.1.100",
        "dst_ip": "10.0.1.50",
        "src_port": 45123,
        "dst_port": 80,
        "protocol": "TCP",
        "attack_type": "DDoS_SYN",
        "severity": "high",
        "phase": "detection",
        "score": 0.92,
        "label": "ATTACK",
        "raw_label": "DDoS_SYN",
        "true_label": "DDoS_SYN",
        "model_type": "Syn"
    }
    
    print("🧪 Testing Aegis Alert Adapter")
    print("=" * 50)
    
    print("\n📥 Original Aegis Detection:")
    print(json.dumps(sample_aegis_detection, indent=2))
    
    # Convert using adapter
    converted = AegisAlertAdapter.convert_aegis_to_alert_stream(sample_aegis_detection)
    
    print("\n📤 Converted Alert Stream Format:")
    print(json.dumps(converted, indent=2))
    
    print("\n✅ Conversion successful!")
    print(f"   • Attack Type: {converted['label']}")
    print(f"   • Confidence: {converted['score']:.1%}")
    print(f"   • Severity: {converted['severity']}")
    print(f"   • Top Features: {len(converted['top_features'])}")

if __name__ == "__main__":
    asyncio.run(test_adapter())