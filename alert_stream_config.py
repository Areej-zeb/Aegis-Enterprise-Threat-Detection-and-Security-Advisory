"""
alert_stream_config.py

Configuration file for integrating alert_stream.py with Aegis IDS.
Contains all the necessary settings and mappings for seamless integration.
"""

from typing import Dict, List, Any
from enum import Enum

# ============================================================================
# INTEGRATION CONFIGURATION
# ============================================================================

class IntegrationMode(str, Enum):
    """Available integration modes"""
    LIVE_AEGIS = "live_aegis"      # Connect to live Aegis WebSocket
    DEMO = "demo"                  # Generate synthetic alerts
    STATIC = "static"              # Replay from JSON file
    HYBRID = "hybrid"              # Mix of live and demo

class AlertStreamConfig:
    """Main configuration for alert stream integration"""
    
    # WebSocket URLs
    AEGIS_PRIMARY_WS = "ws://localhost:8000/ws/detection/live"
    AEGIS_FALLBACK_WS = "ws://localhost:8000/ws/alerts"
    
    # Connection settings
    PING_INTERVAL = 30
    PING_TIMEOUT = 10
    RECONNECT_DELAY_MIN = 1
    RECONNECT_DELAY_MAX = 30
    BACKOFF_FACTOR = 2
    
    # Processing settings
    FILTER_BENIGN = True           # Skip benign detections
    RATE_LIMIT_ENABLED = True      # Enable logging rate limiting
    MAX_ALERTS_PER_MINUTE = 10     # Rate limit threshold
    
    # Demo mode settings
    DEMO_INTERVAL = 2.0            # Seconds between demo alerts
    DEMO_ATTACK_TYPES = [
        "syn_flood", "mitm", "dns_tunnel", 
        "port_scan", "bruteforce"
    ]
    
    # Static mode settings
    STATIC_FILE_PATH = "data/seed_alerts.json"
    STATIC_REPLAY_DELAY = 1.0      # Seconds between static alerts

# ============================================================================
# ATTACK TYPE MAPPINGS
# ============================================================================

class AttackTypeMappings:
    """Mappings between different attack type formats"""
    
    # Aegis IDS -> alert_stream.py
    AEGIS_TO_ALERT_STREAM = {
        "DDoS_SYN": "syn_flood",
        "DDoS_UDP": "syn_flood",
        "MITM_ARP": "mitm",
        "DNS_Exfiltration": "dns_tunnel",
        "SCAN_PORT": "port_scan",
        "BRUTE_FTP": "bruteforce",
        "Brute_Force": "bruteforce",
        "PortScan": "port_scan",
        "BENIGN": "normal",
        # Aegis-specific combined attacks
        "DDoS_SYN + Sniffing": "syn_flood",
        "MITM_ARP + Sniffing": "mitm",
        "DNS_EXFILTRATION": "dns_tunnel"
    }
    
    # Human-readable labels for chatbot
    HUMAN_READABLE = {
        "syn_flood": "SYN Flood Attack",
        "mitm": "Man-in-the-Middle Attack",
        "dns_tunnel": "DNS Tunneling",
        "port_scan": "Port Scanning",
        "bruteforce": "Brute Force Attack",
        "normal": "Normal Traffic"
    }
    
    # MITRE ATT&CK mappings
    MITRE_ATTACK = {
        "syn_flood": "T1498.001",      # Network Denial of Service: Direct Network Flood
        "mitm": "T1557.002",           # Adversary-in-the-Middle: ARP Cache Poisoning
        "dns_tunnel": "T1048.003",     # Exfiltration Over Alternative Protocol: DNS
        "port_scan": "T1046",          # Network Service Scanning
        "bruteforce": "T1110"          # Brute Force
    }

# ============================================================================
# FEATURE MAPPINGS
# ============================================================================

class FeatureMappings:
    """Mappings for ML features between different systems"""
    
    # Aegis features -> Standardized names
    AEGIS_TO_STANDARD = {
        "Flow Duration": "flow_duration",
        "SYN Flag Count": "syn_flag_count",
        "Flow IAT Mean": "inter_arrival_time_mean",
        "Flow Packets/s": "packet_rate",
        "Flow Bytes/s": "byte_rate",
        "Total Fwd Packets": "forward_packet_count",
        "Total Backward Packets": "backward_packet_count",
        "bidirectional_packets": "total_packets",
        "bidirectional_bytes": "total_bytes",
        "numeric": "dns_numeric_chars",
        "special": "dns_special_chars",
        "entropy": "payload_entropy",
        "subdomain_length": "subdomain_length",
        "pkt_rate": "packet_rate",
        "syn_ratio": "syn_ratio",
        "tcp_flags_ratio": "tcp_flags_ratio"
    }
    
    # Human-readable descriptions
    HUMAN_DESCRIPTIONS = {
        "flow_duration": "network flow duration",
        "syn_flag_count": "SYN packets observed",
        "inter_arrival_time_mean": "average time between packets",
        "packet_rate": "packets per second",
        "byte_rate": "bytes per second",
        "forward_packet_count": "outbound packets",
        "backward_packet_count": "inbound packets",
        "total_packets": "total packet count",
        "total_bytes": "total data volume",
        "dns_numeric_chars": "numeric characters in DNS queries",
        "dns_special_chars": "special characters in DNS queries",
        "payload_entropy": "data randomness/encryption level",
        "subdomain_length": "DNS subdomain length",
        "syn_ratio": "ratio of SYN packets",
        "tcp_flags_ratio": "TCP flag distribution"
    }

# ============================================================================
# SEVERITY MAPPINGS
# ============================================================================

class SeverityMappings:
    """Severity level mappings and thresholds"""
    
    # Confidence score thresholds
    CONFIDENCE_THRESHOLDS = {
        "high": 0.85,      # >= 85% confidence = high severity
        "medium": 0.70,    # >= 70% confidence = medium severity
        "low": 0.0         # < 70% confidence = low severity
    }
    
    # Aegis severity -> alert_stream severity
    AEGIS_TO_ALERT_STREAM = {
        "critical": "high",
        "high": "high",
        "medium": "medium",
        "low": "low"
    }
    
    # Colors for display (if needed)
    SEVERITY_COLORS = {
        "high": "#ff4444",     # Red
        "medium": "#ffaa00",   # Orange
        "low": "#44aa44"       # Green
    }

# ============================================================================
# CHATBOT INTEGRATION SETTINGS
# ============================================================================

class ChatbotConfig:
    """Configuration for chatbot integration"""
    
    # RAG system settings
    VECTOR_DB_URL = "http://localhost:6333"  # Qdrant or similar
    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    MAX_CONTEXT_ALERTS = 50        # Maximum alerts to keep in context
    
    # Response generation settings
    RESPONSE_TEMPERATURE = 0.7     # LLM temperature for responses
    MAX_RESPONSE_LENGTH = 500      # Maximum response length
    
    # Alert processing settings
    PROCESS_BENIGN = False         # Whether to process benign traffic
    MIN_CONFIDENCE_THRESHOLD = 0.6 # Minimum confidence to process
    
    # Notification settings
    ENABLE_REAL_TIME_NOTIFICATIONS = True
    NOTIFICATION_CHANNELS = ["console", "webhook"]  # Available: console, webhook, email
    
    # Context window settings
    CONTEXT_WINDOW_MINUTES = 30    # How long to keep alerts in active context
    MAX_SIMILAR_ALERTS = 5         # Max similar alerts to group together

# ============================================================================
# MOCK DATA GENERATION SETTINGS
# ============================================================================

class MockDataConfig:
    """Configuration for generating realistic mock data"""
    
    # IP address ranges for different attack types
    IP_RANGES = {
        "syn_flood": {
            "src": ["192.168.1.0/24", "10.0.0.0/24"],
            "dst": ["172.16.0.0/24", "10.0.1.0/24"]
        },
        "mitm": {
            "src": ["192.168.1.0/24"],
            "dst": ["192.168.1.0/24"]  # Same network for MITM
        },
        "dns_tunnel": {
            "src": ["10.0.0.0/24"],
            "dst": ["8.8.8.8", "1.1.1.1", "208.67.222.222"]  # Public DNS
        },
        "port_scan": {
            "src": ["192.168.100.0/24"],
            "dst": ["10.0.0.0/24"]
        },
        "bruteforce": {
            "src": ["203.0.113.0/24"],  # External attackers
            "dst": ["192.168.1.0/24"]
        }
    }
    
    # Common ports by attack type
    COMMON_PORTS = {
        "syn_flood": [80, 443, 8080, 8443],
        "mitm": [80, 443, 22, 23],
        "dns_tunnel": [53],
        "port_scan": list(range(1, 1024)),  # Well-known ports
        "bruteforce": [22, 23, 21, 3389, 5900]  # SSH, Telnet, FTP, RDP, VNC
    }
    
    # Realistic feature value ranges
    FEATURE_RANGES = {
        "packet_rate": (1, 10000),
        "byte_rate": (100, 1000000),
        "flow_duration": (0.1, 300.0),
        "syn_flag_count": (0, 1000),
        "payload_entropy": (0.0, 8.0),
        "tcp_flags_ratio": (0.0, 1.0)
    }

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

class LoggingConfig:
    """Logging configuration for the alert stream system"""
    
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Log file settings
    ENABLE_FILE_LOGGING = True
    LOG_FILE_PATH = "logs/alert_stream.log"
    MAX_LOG_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    LOG_FILE_BACKUP_COUNT = 5
    
    # Component-specific log levels
    COMPONENT_LOG_LEVELS = {
        "websockets": "WARNING",
        "urllib3": "WARNING",
        "requests": "WARNING"
    }

# ============================================================================
# VALIDATION SETTINGS
# ============================================================================

class ValidationConfig:
    """Data validation settings"""
    
    # Required fields for alerts
    REQUIRED_ALERT_FIELDS = [
        "id", "timestamp", "src_ip", "dst_ip", 
        "protocol", "label", "score"
    ]
    
    # Valid protocols
    VALID_PROTOCOLS = ["TCP", "UDP", "ICMP", "ARP", "DNS"]
    
    # Valid severity levels
    VALID_SEVERITIES = ["low", "medium", "high"]
    
    # IP address validation
    ALLOW_PRIVATE_IPS = True
    ALLOW_LOCALHOST = True
    
    # Score validation
    MIN_CONFIDENCE_SCORE = 0.0
    MAX_CONFIDENCE_SCORE = 1.0

# ============================================================================
# EXPORT ALL CONFIGURATIONS
# ============================================================================

__all__ = [
    "IntegrationMode",
    "AlertStreamConfig", 
    "AttackTypeMappings",
    "FeatureMappings",
    "SeverityMappings",
    "ChatbotConfig",
    "MockDataConfig",
    "LoggingConfig",
    "ValidationConfig"
]