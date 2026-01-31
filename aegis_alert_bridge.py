"""
aegis_alert_bridge.py

Bridge module that adapts Aegis IDS detection format to the alert_stream.py specifications.
Converts raw Aegis detections into the exact Alert model format expected by your chatbot.
"""

import asyncio
import json
import logging
import random
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import ValidationError

# Import your exact alert_stream models and functions
from alert_stream import (
    Alert, 
    FeatureContribution, 
    Explainability, 
    Severity,
    handle_alert,
    start_alert_stream
)

logger = logging.getLogger(__name__)

# ============================================================================
# AEGIS TO ALERT_STREAM ADAPTER
# ============================================================================

class AegisAlertAdapter:
    """
    Converts Aegis IDS detection format to alert_stream.py Alert format.
    Handles the mapping between different data structures and field names.
    """
    
    # Mapping from Aegis attack types to your alert_stream labels
    ATTACK_TYPE_MAPPING = {
        "DDoS_SYN": "syn_flood",
        "DDoS_UDP": "syn_flood",  # Map UDP floods to syn_flood category
        "MITM_ARP": "mitm",
        "DNS_Exfiltration": "dns_tunnel",
        "SCAN_PORT": "port_scan",
        "BRUTE_FTP": "bruteforce",
        "Brute_Force": "bruteforce",
        "PortScan": "port_scan",
        "BENIGN": "normal",
        # Handle Aegis-specific combined attacks
        "DDoS_SYN + Sniffing": "syn_flood",
        "MITM_ARP + Sniffing": "mitm"
    }
    
    # Feature mapping from Aegis to standardized names
    FEATURE_MAPPING = {
        # Aegis detection service features
        "Flow Duration": "Flow Duration",
        "SYN Flag Count": "SYN Flag Count", 
        "Flow IAT Mean": "Flow IAT Mean",
        "Flow Packets/s": "pkt_rate",
        "Flow Bytes/s": "byte_rate",
        "Total Fwd Packets": "fwd_pkt_count",
        "Total Backward Packets": "bwd_pkt_count",
        "bidirectional_packets": "total_packets",
        "bidirectional_bytes": "total_bytes",
        "numeric": "dns_numeric_chars",
        "special": "dns_special_chars",
        "entropy": "payload_entropy",
        "subdomain_length": "subdomain_length",
        # Add more mappings as needed
        "pkt_rate": "pkt_rate",
        "syn_ratio": "SYN_ratio",
        "tcp_flags_ratio": "tcp_flags_ratio"
    }
    
    @staticmethod
    def map_severity(aegis_severity: str, confidence: float) -> Severity:
        """
        Map Aegis severity to alert_stream Severity enum.
        
        Args:
            aegis_severity: Aegis severity string
            confidence: Detection confidence score
            
        Returns:
            Severity enum value
        """
        if aegis_severity:
            severity_lower = aegis_severity.lower()
            if severity_lower == "critical" or severity_lower == "high":
                return Severity.HIGH
            elif severity_lower == "medium":
                return Severity.MEDIUM
            else:
                return Severity.LOW
        
        # Fallback based on confidence
        if confidence >= 0.9:
            return Severity.HIGH
        elif confidence >= 0.7:
            return Severity.MEDIUM
        else:
            return Severity.LOW
    
    @staticmethod
    def generate_mock_features(attack_type: str, confidence: float) -> List[FeatureContribution]:
        """
        Generate realistic feature contributions based on attack type.
        In production, this would come from SHAP explainability API.
        
        Args:
            attack_type: Mapped attack type
            confidence: Detection confidence
            
        Returns:
            List of FeatureContribution objects
        """
        features = []
        
        if attack_type == "syn_flood":
            base_features = [
                ("SYN Flag Count", confidence * 0.4),
                ("pkt_rate", confidence * 0.3),
                ("Flow Duration", confidence * 0.2),
                ("tcp_flags_ratio", confidence * 0.15),
                ("Flow Packets/s", confidence * 0.1)
            ]
        elif attack_type == "mitm":
            base_features = [
                ("total_packets", confidence * 0.35),
                ("total_bytes", confidence * 0.25),
                ("Flow IAT Mean", confidence * 0.2),
                ("payload_entropy", confidence * 0.15),
                ("connection_rate", confidence * 0.1)
            ]
        elif attack_type == "dns_tunnel":
            base_features = [
                ("payload_entropy", confidence * 0.4),
                ("subdomain_length", confidence * 0.3),
                ("dns_numeric_chars", confidence * 0.2),
                ("dns_special_chars", confidence * 0.15),
                ("query_rate", confidence * 0.1)
            ]
        elif attack_type == "port_scan":
            base_features = [
                ("unique_dst_ports", confidence * 0.4),
                ("connection_rate", confidence * 0.3),
                ("Flow Duration", confidence * 0.2),
                ("tcp_flags_ratio", confidence * 0.15),
                ("packet_size", confidence * 0.1)
            ]
        elif attack_type == "bruteforce":
            base_features = [
                ("connection_rate", confidence * 0.4),
                ("failed_attempts", confidence * 0.3),
                ("Flow Duration", confidence * 0.2),
                ("payload_entropy", confidence * 0.15),
                ("retry_pattern", confidence * 0.1)
            ]
        else:  # normal or unknown
            base_features = [
                ("pkt_rate", confidence * 0.3),
                ("byte_rate", confidence * 0.25),
                ("Flow Duration", confidence * 0.2),
                ("packet_size", confidence * 0.15),
                ("connection_rate", confidence * 0.1)
            ]
        
        # Add some randomness to make it more realistic
        for name, contrib in base_features:
            # Add small random variation
            variation = random.uniform(-0.05, 0.05)
            final_contrib = max(-1.0, min(1.0, contrib + variation))
            features.append(FeatureContribution(name=name, contrib=final_contrib))
        
        # Sort by absolute contribution (highest first)
        features.sort(key=lambda x: abs(x.contrib), reverse=True)
        
        return features[:5]  # Return top 5
    
    @staticmethod
    def generate_mock_explainability(features: List[FeatureContribution], detection_id: str) -> Explainability:
        """
        Generate mock SHAP explainability data.
        
        Args:
            features: List of feature contributions
            detection_id: Unique detection ID
            
        Returns:
            Explainability object with mock SHAP data
        """
        # Generate SHAP values array (10 features)
        shap_values = [f.contrib for f in features[:5]]  # Use real contributions
        shap_values.extend([round(random.uniform(-0.2, 0.2), 4) for _ in range(5)])  # Add 5 more
        
        # Calculate SHAP sum
        shap_sum = sum(shap_values)
        
        # Top indices (sorted by absolute value)
        top_indices = sorted(range(len(shap_values)), key=lambda i: abs(shap_values[i]), reverse=True)[:5]
        
        return Explainability(
            shap_values=shap_values,
            base_value=0.5,  # Typical baseline
            shap_sum=round(shap_sum, 4),
            top_indices=top_indices
        )
    
    @classmethod
    def convert_aegis_detection(cls, aegis_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Convert Aegis detection format to alert_stream Alert format.
        
        Args:
            aegis_data: Raw detection from Aegis WebSocket
            
        Returns:
            Dictionary compatible with alert_stream Alert model, or None if conversion fails
        """
        try:
            # Skip benign detections for chatbot alerts
            if aegis_data.get("label") == "BENIGN":
                return None
            
            # Extract confidence score
            confidence = aegis_data.get("confidence", aegis_data.get("score", 0.5))
            
            # Map attack type
            aegis_attack_type = aegis_data.get("attack_type", "unknown")
            mapped_attack_type = cls.ATTACK_TYPE_MAPPING.get(aegis_attack_type, "normal")
            
            # Map severity
            aegis_severity = aegis_data.get("severity", "medium")
            severity = cls.map_severity(aegis_severity, confidence)
            
            # Generate mock features
            features = cls.generate_mock_features(mapped_attack_type, confidence)
            
            # Generate mock explainability
            explainability = cls.generate_mock_explainability(features, aegis_data.get("id", "unknown"))
            
            # Parse timestamp
            timestamp_str = aegis_data.get("timestamp", datetime.now().isoformat())
            if isinstance(timestamp_str, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                except ValueError:
                    timestamp = datetime.now()
            else:
                timestamp = timestamp_str
            
            # Build alert data compatible with your Alert model
            alert_data = {
                "id": aegis_data.get("id", f"aegis-{int(datetime.now().timestamp())}"),
                "timestamp": timestamp,
                "src_ip": aegis_data.get("src_ip", "unknown"),
                "dst_ip": aegis_data.get("dst_ip", "unknown"),
                "src_port": aegis_data.get("src_port", 0),
                "dst_port": aegis_data.get("dst_port", 0),
                "protocol": aegis_data.get("protocol", "TCP"),
                "label": mapped_attack_type,
                "score": confidence,
                "severity": severity,
                "top_features": features,
                "explainability": explainability
            }
            
            return alert_data
            
        except Exception as e:
            logger.error(f"Error converting Aegis detection: {e}")
            logger.debug(f"Problematic data: {aegis_data}")
            return None

# ============================================================================
# AEGIS WEBSOCKET CONSUMER
# ============================================================================

async def consume_aegis_websocket(
    callback,
    ws_url: str = "ws://localhost:8000/ws/detection/live"
) -> None:
    """
    Connect to Aegis WebSocket, convert detections, and forward to alert_stream callback.
    
    Args:
        callback: Your alert_stream callback function
        ws_url: Aegis WebSocket URL
    """
    import websockets
    from websockets.exceptions import ConnectionClosed, WebSocketException
    
    logger.info(f"Connecting to Aegis WebSocket: {ws_url}")
    
    reconnect_delay = 1
    max_delay = 30
    
    while True:
        try:
            async with websockets.connect(ws_url, ping_interval=30, ping_timeout=10) as websocket:
                logger.info("✓ Connected to Aegis detection stream")
                reconnect_delay = 1  # Reset on successful connection
                
                async for message in websocket:
                    try:
                        # Parse Aegis detection
                        aegis_data = json.loads(message)
                        
                        # Convert to alert_stream format
                        alert_data = AegisAlertAdapter.convert_aegis_detection(aegis_data)
                        
                        if alert_data:
                            # Validate and format using your alert_stream function
                            formatted_alert = await handle_alert(alert_data)
                            
                            if formatted_alert and callback:
                                await callback(formatted_alert)
                        
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON from Aegis: {e}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing Aegis message: {e}")
                        continue
        
        except ConnectionClosed:
            logger.warning(f"Aegis connection closed. Reconnecting in {reconnect_delay}s...")
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, max_delay)
        
        except WebSocketException as e:
            logger.error(f"Aegis WebSocket error: {e}. Reconnecting in {reconnect_delay}s...")
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, max_delay)
        
        except Exception as e:
            logger.error(f"Unexpected error with Aegis connection: {e}")
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, max_delay)

# ============================================================================
# INTEGRATED ALERT STREAM
# ============================================================================

async def start_aegis_integrated_stream(
    callback,
    mode: str = "live",
    aegis_ws_url: str = "ws://localhost:8000/ws/detection/live"
) -> None:
    """
    Start alert stream with Aegis integration.
    
    Args:
        callback: Your callback function (same as alert_stream.py)
        mode: "live" (Aegis), "demo", or "static"
        aegis_ws_url: Aegis WebSocket URL
    """
    logger.info(f"Starting Aegis-integrated alert stream in {mode.upper()} mode")
    
    if mode == "live":
        # Use Aegis WebSocket with conversion
        await consume_aegis_websocket(callback, aegis_ws_url)
    else:
        # Use your original alert_stream modes (demo/static)
        await start_alert_stream(callback=callback, mode=mode)

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_chatbot_callback(alert: dict) -> None:
    """
    Example callback that processes alerts for chatbot integration.
    This matches your alert_stream.py format exactly.
    """
    print("\n" + "="*80)
    print(f"🤖 CHATBOT ALERT: {alert['label_human']} - {alert['severity'].upper()}")
    print(f"   From: {alert['src_ip']}:{alert['src_port']} → {alert['dst_ip']}:{alert['dst_port']}")
    print(f"   Confidence: {alert['score']:.2%} | Protocol: {alert['protocol']}")
    print(f"   Top Features:")
    for feature in alert['top_features'][:3]:
        print(f"     • {feature['name']}: {feature['contrib']:+.4f}")
    
    # Here you would integrate with your RAG system
    # await chatbot_rag.process_security_alert(alert)
    # await vector_db.store_alert_context(alert)
    
    print("="*80)

if __name__ == "__main__":
    """
    Test the Aegis integration bridge.
    
    Usage:
        python aegis_alert_bridge.py
    """
    
    print("""
╔══════════════════════════════════════════════════════════════════╗
║              AEGIS IDS - Alert Stream Bridge                    ║
║                                                                  ║
║  Connecting to Aegis WebSocket and converting to alert_stream   ║
║  format for chatbot integration.                                ║
║                                                                  ║
║  Press Ctrl+C to stop                                           ║
╚══════════════════════════════════════════════════════════════════╝
    """)
    
    try:
        asyncio.run(start_aegis_integrated_stream(
            callback=example_chatbot_callback,
            mode="live"  # Connect to real Aegis IDS
        ))
    except KeyboardInterrupt:
        print("\n\nBridge shutdown complete. Goodbye! 👋")