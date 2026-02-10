"""
Threat Incident Generator
Generates realistic threat incidents for testing and demo purposes.
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import List

from .models import ThreatIncident, SeverityLevel, AttackType


class ThreatGenerator:
    """Generate realistic threat incidents"""
    
    THREAT_ACTORS = ["APT28", "Lazarus", "APT29", "Carbanak", "Unknown"]
    
    ATTACK_DESCRIPTIONS = {
        AttackType.DDOS_SYN: [
            "SYN flood attack detected on web server",
            "High-rate SYN flood from multiple sources",
            "Distributed SYN flood attack in progress",
            "SYN flood targeting port 443",
        ],
        AttackType.MITM_ARP: [
            "ARP spoofing attack detected",
            "Man-in-the-middle attack via ARP poisoning",
            "Suspicious ARP traffic detected",
            "ARP spoofing attempt on gateway",
        ],
        AttackType.DNS_EXFILTRATION: [
            "DNS exfiltration attempt detected",
            "Suspicious DNS queries detected",
            "Data exfiltration via DNS tunneling",
            "DNS query anomaly detected",
        ],
        AttackType.BRUTE_FORCE: [
            "Brute force attack on SSH service",
            "Multiple failed login attempts",
            "Credential brute force attack",
            "Brute force attack on RDP service",
        ],
        AttackType.MALWARE: [
            "Malware signature detected",
            "Suspicious executable detected",
            "Ransomware activity detected",
            "Trojan infection detected",
        ],
        AttackType.SCANNING: [
            "Port scanning activity detected",
            "Network reconnaissance detected",
            "Vulnerability scanning detected",
            "Service enumeration detected",
        ],
        AttackType.ANOMALY: [
            "Unusual network behavior detected",
            "Anomalous traffic pattern detected",
            "Suspicious data transfer detected",
            "Unusual process execution detected",
        ],
    }
    
    MITRE_TECHNIQUES = {
        AttackType.DDOS_SYN: ["T1499"],
        AttackType.MITM_ARP: ["T1040"],
        AttackType.DNS_EXFILTRATION: ["T1071"],
        AttackType.BRUTE_FORCE: ["T1110"],
        AttackType.MALWARE: ["T1566", "T1204"],
        AttackType.SCANNING: ["T1595"],
        AttackType.ANOMALY: ["T1087"],
    }
    
    SEVERITY_WEIGHTS = {
        AttackType.DDOS_SYN: {SeverityLevel.CRITICAL: 0.4, SeverityLevel.HIGH: 0.4, SeverityLevel.MEDIUM: 0.2},
        AttackType.MITM_ARP: {SeverityLevel.HIGH: 0.5, SeverityLevel.MEDIUM: 0.3, SeverityLevel.LOW: 0.2},
        AttackType.DNS_EXFILTRATION: {SeverityLevel.HIGH: 0.6, SeverityLevel.MEDIUM: 0.3, SeverityLevel.LOW: 0.1},
        AttackType.BRUTE_FORCE: {SeverityLevel.MEDIUM: 0.5, SeverityLevel.LOW: 0.3, SeverityLevel.INFO: 0.2},
        AttackType.MALWARE: {SeverityLevel.CRITICAL: 0.5, SeverityLevel.HIGH: 0.4, SeverityLevel.MEDIUM: 0.1},
        AttackType.SCANNING: {SeverityLevel.LOW: 0.6, SeverityLevel.INFO: 0.4},
        AttackType.ANOMALY: {SeverityLevel.MEDIUM: 0.5, SeverityLevel.LOW: 0.3, SeverityLevel.INFO: 0.2},
    }
    
    INTERNAL_IPS = [
        "192.168.1.0/24",
        "10.0.0.0/8",
        "172.16.0.0/12",
    ]
    
    EXTERNAL_IPS = [
        "203.0.113.45",
        "198.51.100.89",
        "192.0.2.123",
        "198.51.100.45",
        "203.0.113.78",
    ]
    
    SERVICES = [
        "web-server-01",
        "database-01",
        "mail-server",
        "vpn-gateway",
        "dns-server",
        "file-server",
        "app-server-01",
        "app-server-02",
    ]
    
    def __init__(self):
        self.incident_counter = 0
    
    def _get_random_internal_ip(self) -> str:
        """Generate random internal IP"""
        return f"192.168.1.{random.randint(1, 254)}"
    
    def _get_random_external_ip(self) -> str:
        """Get random external IP"""
        return random.choice(self.EXTERNAL_IPS)
    
    def _get_severity(self, attack_type: AttackType) -> SeverityLevel:
        """Get severity level based on attack type"""
        weights = self.SEVERITY_WEIGHTS.get(attack_type, {SeverityLevel.MEDIUM: 1.0})
        severities = list(weights.keys())
        probabilities = list(weights.values())
        return random.choices(severities, weights=probabilities, k=1)[0]
    
    def generate_incident(self) -> ThreatIncident:
        """Generate a realistic threat incident"""
        self.incident_counter += 1
        
        attack_type = random.choice(list(AttackType))
        severity = self._get_severity(attack_type)
        
        # Determine if this is attributed to a known actor
        threat_actor = None
        if severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]:
            threat_actor = random.choice(self.THREAT_ACTORS)
        
        # Generate confidence based on severity
        confidence_base = {
            SeverityLevel.CRITICAL: 0.95,
            SeverityLevel.HIGH: 0.85,
            SeverityLevel.MEDIUM: 0.75,
            SeverityLevel.LOW: 0.65,
            SeverityLevel.INFO: 0.55,
        }
        confidence = confidence_base[severity] + random.uniform(-0.05, 0.05)
        confidence = max(0.0, min(1.0, confidence))
        
        # Random timestamp within last 24 hours
        hours_ago = random.randint(0, 24)
        minutes_ago = random.randint(0, 59)
        timestamp = datetime.utcnow() - timedelta(hours=hours_ago, minutes=minutes_ago)
        
        incident = ThreatIncident(
            id=f"inc-{uuid.uuid4().hex[:8]}",
            timestamp=timestamp,
            severity=severity,
            attack_type=attack_type,
            source_ip=self._get_random_external_ip(),
            destination_ip=self._get_random_internal_ip(),
            source_port=random.randint(1024, 65535),
            destination_port=random.choice([22, 80, 443, 3306, 5432, 8080]),
            target_service=random.choice(self.SERVICES),
            description=random.choice(self.ATTACK_DESCRIPTIONS[attack_type]),
            mitre_techniques=random.sample(
                self.MITRE_TECHNIQUES.get(attack_type, ["T1087"]),
                k=min(2, len(self.MITRE_TECHNIQUES.get(attack_type, ["T1087"])))
            ),
            threat_actor=threat_actor,
            confidence=confidence,
            status="open",
            metadata={
                "detection_method": random.choice(["ML Model", "Signature", "Heuristic", "Behavioral"]),
                "model_name": random.choice(["XGBoost", "CNN-LSTM", "Ensemble"]),
                "packets_analyzed": random.randint(100, 10000),
                "bytes_transferred": random.randint(1000, 1000000),
            }
        )
        
        return incident
    
    def generate_batch(self, count: int = 10) -> List[ThreatIncident]:
        """Generate a batch of incidents"""
        return [self.generate_incident() for _ in range(count)]
