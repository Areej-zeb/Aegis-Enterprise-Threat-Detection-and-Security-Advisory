"""
aegis_alert_stream.py

Real-time alert streaming module for Aegis IDS chatbot backend.
Consumes live ML detections via WebSocket and formats them for chatbot responses.

Adapted for Aegis IDS detection service output format.
"""

import asyncio
import json
import logging
from typing import Optional, Callable, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ValidationError, Field
import websockets
from websockets.exceptions import (
    ConnectionClosed,
    WebSocketException,
    InvalidURI,
    InvalidHandshake
)

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# PYDANTIC MODELS (Adapted for Aegis IDS)
# ============================================================================

class AegisDetection(BaseModel):
    """
    Pydantic model matching Aegis IDS detection service output format.
    Based on the detection_service.py generate_detections() method.
    """
    id: str
    timestamp: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    attack_type: str
    severity: str
    phase: str = "detection"
    score: float = Field(..., ge=0.0, le=1.0)
    label: str  # "ATTACK" or "BENIGN"
    raw_label: Optional[str] = None
    true_label: Optional[str] = None
    model_type: Optional[str] = None
    confidence: Optional[float] = None  # Sometimes used instead of score

    def get_confidence(self) -> float:
        """Get confidence score, preferring 'confidence' over 'score'"""
        return self.confidence if self.confidence is not None else self.score

class FeatureContribution(BaseModel):
    """Mock feature contribution for explainability"""
    name: str
    contrib: float

class Explainability(BaseModel):
    """Mock explainability data"""
    method: str = "shap_tree"
    version: str = "0.44.1"
    sample_id: str

# ============================================================================
# FEATURE MAPPING & ALERT DEFINITIONS (From Aegis schemas.py)
# ============================================================================

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
    },
    # Handle Aegis-specific attack types
    "DDoS_SYN + Sniffing": {
        "description": "A combined SYN flood DDoS attack with network sniffing capabilities",
        "recommendations": [
            "Enable SYN cookies and implement network monitoring",
            "Deploy intrusion detection systems to identify sniffing attempts",
            "Review network segmentation and access controls",
            "Monitor for unusual network traffic patterns"
        ],
        "references": [
            "https://attack.mitre.org/techniques/T1498/001/",
            "https://attack.mitre.org/techniques/T1040/"
        ]
    }
}

# ============================================================================
# ALERT FORMATTING (Adapted for Aegis Detection Format)
# ============================================================================

def generate_mock_features(detection: AegisDetection) -> List[FeatureContribution]:
    """
    Generate mock feature contributions based on attack type.
    In a real implementation, this would come from SHAP or model explainability.
    """
    attack_type = detection.attack_type.lower()
    confidence = detection.get_confidence()
    
    if "syn" in attack_type or "ddos" in attack_type:
        return [
            FeatureContribution(name="SYN Flag Count", contrib=confidence * 0.4),
            FeatureContribution(name="Flow Packets/s", contrib=confidence * 0.3),
            FeatureContribution(name="Flow Duration", contrib=confidence * 0.2)
        ]
    elif "mitm" in attack_type or "arp" in attack_type:
        return [
            FeatureContribution(name="bidirectional_packets", contrib=confidence * 0.35),
            FeatureContribution(name="bidirectional_bytes", contrib=confidence * 0.25),
            FeatureContribution(name="Flow IAT Mean", contrib=confidence * 0.2)
        ]
    elif "dns" in attack_type:
        return [
            FeatureContribution(name="entropy", contrib=confidence * 0.4),
            FeatureContribution(name="subdomain_length", contrib=confidence * 0.3),
            FeatureContribution(name="numeric", contrib=confidence * 0.2)
        ]
    else:
        return [
            FeatureContribution(name="pkt_rate", contrib=confidence * 0.3),
            FeatureContribution(name="byte_rate", contrib=confidence * 0.25),
            FeatureContribution(name="Flow Duration", contrib=confidence * 0.2)
        ]

def format_aegis_detection(detection: AegisDetection) -> Dict[str, Any]:
    """
    Format an Aegis detection into a human-readable chatbot response.
    
    Args:
        detection: AegisDetection object from Aegis IDS
        
    Returns:
        Dictionary containing summary, top_features, recommendations, and references
    """
    # Skip benign detections for chatbot alerts
    if detection.label == "BENIGN":
        return None
    
    # Get alert type configuration
    alert_config = ALERT_DEFINITIONS.get(
        detection.attack_type,
        {
            "description": f"A {detection.attack_type} security event detected",
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
    confidence = detection.get_confidence()
    severity_text = detection.severity.upper() if detection.severity == "critical" else detection.severity.capitalize()
    summary = (
        f"{severity_text} severity alert: {alert_config['description']} detected from "
        f"{detection.src_ip}:{detection.src_port} targeting {detection.dst_ip}:{detection.dst_port} "
        f"with {int(confidence * 100)}% confidence."
    )
    
    # Generate mock features (in real implementation, get from explainability API)
    top_features_raw = generate_mock_features(detection)
    
    # Format top features in human-readable form
    top_features = []
    for feature in top_features_raw[:3]:  # Limit to top 3
        feature_description = FEATURE_MAP.get(feature.name, feature.name)
        contribution_pct = int(abs(feature.contrib) * 100)
        top_features.append({
            "feature": feature_description,
            "contribution": f"{contribution_pct}%",
            "technical_name": feature.name
        })
    
    # Create mock explainability
    explainability = Explainability(
        method="shap_tree",
        version="0.44.1",
        sample_id=detection.id
    )
    
    # Build response
    response = {
        "alert_id": detection.id,
        "timestamp": detection.timestamp,
        "summary": summary,
        "details": {
            "source": f"{detection.src_ip}:{detection.src_port}",
            "destination": f"{detection.dst_ip}:{detection.dst_port}",
            "protocol": detection.protocol,
            "attack_type": detection.attack_type,
            "severity": detection.severity,
            "confidence_score": confidence,
            "model_type": detection.model_type
        },
        "top_features": top_features,
        "recommendations": alert_config["recommendations"],
        "references": alert_config["references"] if alert_config["references"] else None,
        "explainability": {
            "method": explainability.method,
            "version": explainability.version,
            "sample_id": explainability.sample_id
        }
    }
    
    return response

# ============================================================================
# ALERT STREAM HANDLER (Adapted for Aegis)
# ============================================================================

class AegisAlertStreamConfig:
    """Configuration for Aegis alert streaming"""
    WS_URL = "ws://localhost:8000/ws/detection/live"
    RECONNECT_DELAY = 5  # seconds
    MAX_RECONNECT_ATTEMPTS = None  # None = infinite
    ALERT_RATE_LIMIT = 10  # max alerts to log per minute
    PING_INTERVAL = 30  # seconds
    PING_TIMEOUT = 10  # seconds
    FILTER_BENIGN = True  # Only process attack detections

class AlertCounter:
    """Simple rate limiter for logging"""
    def __init__(self, max_per_minute: int):
        self.max_per_minute = max_per_minute
        self.count = 0
        self.reset_time = datetime.now()
    
    def should_log(self) -> bool:
        """Check if we should log this alert based on rate limit"""
        now = datetime.now()
        
        # Reset counter every minute
        if (now - self.reset_time).total_seconds() >= 60:
            self.count = 0
            self.reset_time = now
        
        if self.count < self.max_per_minute:
            self.count += 1
            return True
        return False

async def handle_aegis_detection(
    detection_data: dict,
    callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    counter: Optional[AlertCounter] = None,
    filter_benign: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Parse and format a single Aegis detection.
    
    Args:
        detection_data: Raw detection data from Aegis WebSocket
        callback: Optional callback function to process formatted alerts
        counter: Optional rate limiter for logging
        filter_benign: Skip benign detections if True
        
    Returns:
        Formatted alert dictionary or None if parsing failed/filtered
    """
    try:
        # Parse into Pydantic model
        detection = AegisDetection(**detection_data)
        
        # Filter benign detections if requested
        if filter_benign and detection.label == "BENIGN":
            return None
        
        # Format for chatbot
        formatted_alert = format_aegis_detection(detection)
        
        # Skip if formatting returned None (e.g., benign detection)
        if formatted_alert is None:
            return None
        
        # Log if within rate limit
        if counter is None or counter.should_log():
            confidence = detection.get_confidence()
            logger.info(f"✓ Alert {detection.id}: {detection.attack_type} from {detection.src_ip} (confidence: {confidence:.2%})")
        
        # Call user-provided callback if specified
        if callback:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(formatted_alert)
                else:
                    callback(formatted_alert)
            except Exception as e:
                logger.error(f"Callback error for detection {detection.id}: {e}")
        
        return formatted_alert
        
    except ValidationError as e:
        logger.warning(f"Detection validation failed: {e}")
        logger.debug(f"Malformed detection data: {detection_data}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error handling detection: {e}")
        return None

async def start_aegis_alert_stream(
    ws_url: str = AegisAlertStreamConfig.WS_URL,
    callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    max_reconnect_attempts: Optional[int] = AegisAlertStreamConfig.MAX_RECONNECT_ATTEMPTS,
    reconnect_delay: int = AegisAlertStreamConfig.RECONNECT_DELAY,
    enable_rate_limit: bool = True,
    filter_benign: bool = AegisAlertStreamConfig.FILTER_BENIGN
) -> None:
    """
    Start the Aegis alert stream consumer with automatic reconnection.
    
    Args:
        ws_url: WebSocket URL for live detections
        callback: Optional callback function to process each formatted alert
        max_reconnect_attempts: Maximum reconnection attempts (None = infinite)
        reconnect_delay: Delay between reconnection attempts in seconds
        enable_rate_limit: Enable rate limiting for console logging
        filter_benign: Only process attack detections (skip benign)
    """
    reconnect_count = 0
    counter = AlertCounter(AegisAlertStreamConfig.ALERT_RATE_LIMIT) if enable_rate_limit else None
    
    logger.info(f"Starting Aegis alert stream from {ws_url}")
    if filter_benign:
        logger.info("Filtering enabled: Only processing attack detections")
    
    while True:
        try:
            # Check reconnect limit
            if max_reconnect_attempts is not None and reconnect_count > max_reconnect_attempts:
                logger.error(f"Max reconnection attempts ({max_reconnect_attempts}) reached. Exiting.")
                break
            
            # Connect to WebSocket
            async with websockets.connect(
                ws_url,
                ping_interval=AegisAlertStreamConfig.PING_INTERVAL,
                ping_timeout=AegisAlertStreamConfig.PING_TIMEOUT
            ) as websocket:
                
                if reconnect_count > 0:
                    logger.info(f"✓ Reconnected successfully (attempt {reconnect_count})")
                else:
                    logger.info("✓ Connected to Aegis live detection stream")
                
                reconnect_count = 0  # Reset on successful connection
                
                # Main message loop
                async for message in websocket:
                    try:
                        # Parse JSON
                        detection_data = json.loads(message)
                        
                        # Handle the detection
                        formatted_alert = await handle_aegis_detection(
                            detection_data,
                            callback=callback,
                            counter=counter,
                            filter_benign=filter_benign
                        )
                        
                        # Optional: store or process formatted_alert here
                        # For example, send to a queue, database, or RAG system
                        
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON received: {e}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                        continue
        
        except ConnectionClosed as e:
            reconnect_count += 1
            logger.warning(f"Connection closed: {e}. Reconnecting in {reconnect_delay}s... (attempt {reconnect_count})")
            await asyncio.sleep(reconnect_delay)
        
        except (InvalidURI, InvalidHandshake) as e:
            logger.error(f"WebSocket connection error: {e}")
            logger.error("Check that the Aegis IDS backend is running on the correct URL")
            break
        
        except WebSocketException as e:
            reconnect_count += 1
            logger.error(f"WebSocket error: {e}. Reconnecting in {reconnect_delay}s... (attempt {reconnect_count})")
            await asyncio.sleep(reconnect_delay)
        
        except KeyboardInterrupt:
            logger.info("Stream interrupted by user. Shutting down gracefully...")
            break
        
        except Exception as e:
            reconnect_count += 1
            logger.error(f"Unexpected error: {e}. Reconnecting in {reconnect_delay}s... (attempt {reconnect_count})")
            await asyncio.sleep(reconnect_delay)

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_callback(formatted_alert: Dict[str, Any]) -> None:
    """
    Example callback function to process formatted alerts.
    Replace this with your chatbot RAG integration.
    """
    print("\n" + "="*80)
    print(f"🚨 {formatted_alert['summary']}")
    print(f"📊 Top Contributing Features:")
    for feat in formatted_alert['top_features']:
        print(f"   • {feat['feature']}: {feat['contribution']}")
    print(f"💡 Recommendations: {len(formatted_alert['recommendations'])} actions available")
    print(f"🔍 Model: {formatted_alert['details'].get('model_type', 'Unknown')}")
    print("="*80 + "\n")

async def rag_integration_callback(formatted_alert: Dict[str, Any]) -> None:
    """
    Example RAG integration callback.
    Replace with your actual RAG system integration.
    """
    # Example: Send to vector database for RAG
    # await vector_db.index_alert(formatted_alert)
    
    # Example: Send to chatbot context
    # await chatbot.add_security_context(formatted_alert)
    
    # For now, just log
    logger.info(f"RAG: Indexed alert {formatted_alert['alert_id']} - {formatted_alert['details']['attack_type']}")

if __name__ == "__main__":
    """
    Main entry point for the Aegis alert stream module.
    
    Usage:
        python aegis_alert_stream.py
    
    To integrate with your chatbot:
        from aegis_alert_stream import start_aegis_alert_stream
        
        async def my_callback(alert):
            # Send to RAG, store in DB, etc.
            pass
        
        asyncio.run(start_aegis_alert_stream(callback=my_callback))
    """
    
    # Start the alert stream with example callback
    asyncio.run(start_aegis_alert_stream(
        callback=example_callback,
        enable_rate_limit=True,  # Set to False to see all alerts
        filter_benign=True  # Only show attack detections
    ))