"""
Threat Intelligence Database Layer
In-memory storage with persistence to JSON for development.
For production, replace with PostgreSQL.
"""

import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from collections import defaultdict
import threading

from .models import (
    ThreatIncident, ThreatActor, MITRETechnique, IPReputation,
    ThreatSummary, AttackDistribution, SeverityLevel, AttackType
)


class ThreatIntelDB:
    """In-memory threat intelligence database with JSON persistence"""
    
    def __init__(self, data_dir: Path = None):
        self.data_dir = data_dir or Path(__file__).parent.parent.parent / "data" / "threat_intel"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.incidents: Dict[str, ThreatIncident] = {}
        self.actors: Dict[str, ThreatActor] = {}
        self.techniques: Dict[str, MITRETechnique] = {}
        self.ip_reputation: Dict[str, IPReputation] = {}
        
        self._lock = threading.RLock()
        self._load_data()
        self._initialize_seed_data()
    
    def _load_data(self):
        """Load data from JSON files"""
        try:
            incidents_file = self.data_dir / "incidents.json"
            if incidents_file.exists():
                with open(incidents_file) as f:
                    data = json.load(f)
                    for inc_data in data:
                        inc = ThreatIncident(**inc_data)
                        self.incidents[inc.id] = inc
        except Exception as e:
            print(f"Warning: Could not load incidents: {e}")
    
    def _save_data(self):
        """Persist data to JSON files"""
        try:
            incidents_file = self.data_dir / "incidents.json"
            with open(incidents_file, 'w') as f:
                data = [inc.model_dump(mode='json') for inc in self.incidents.values()]
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"Warning: Could not save incidents: {e}")
    
    def _initialize_seed_data(self):
        """Initialize with seed threat data"""
        if self.incidents:
            return  # Already has data
        
        # Seed MITRE techniques
        self.techniques = {
            "T1499": MITRETechnique(
                id="T1499",
                name="Endpoint Denial of Service",
                description="Adversaries perform DoS attacks to degrade or block availability of services",
                tactic="Impact",
                mitigations=["Rate Limiting", "Traffic Filtering", "DDoS Mitigation"],
                detection_methods=["Network Traffic Analysis", "Flow Analysis", "IDS Alerts"]
            ),
            "T1040": MITRETechnique(
                id="T1040",
                name="Network Sniffing",
                description="Adversaries may sniff network traffic to capture data in transit",
                tactic="Credential Access",
                mitigations=["Encryption", "Network Segmentation"],
                detection_methods=["Network Monitoring", "ARP Monitoring"]
            ),
            "T1071": MITRETechnique(
                id="T1071",
                name="Application Layer Protocol",
                description="Adversaries may communicate using application layer protocols",
                tactic="Command and Control",
                mitigations=["Network Segmentation", "Proxy Usage"],
                detection_methods=["DNS Monitoring", "Protocol Analysis"]
            ),
        }
        
        # Seed threat actors
        self.actors = {
            "APT28": ThreatActor(
                id="APT28",
                name="APT28",
                aliases=["Fancy Bear", "Sofacy"],
                description="Russian state-sponsored APT group",
                targets=["Government", "Defense", "Media"],
                techniques=["T1499", "T1040"],
                threat_level=SeverityLevel.CRITICAL
            ),
            "Lazarus": ThreatActor(
                id="Lazarus",
                name="Lazarus Group",
                aliases=["Hidden Cobra"],
                description="North Korean state-sponsored group",
                targets=["Financial", "Technology", "Government"],
                techniques=["T1071"],
                threat_level=SeverityLevel.CRITICAL
            ),
        }
        
        # Seed malicious IPs
        self.ip_reputation = {
            "203.0.113.45": IPReputation(
                ip_address="203.0.113.45",
                reputation_score=95,
                threat_count=12,
                is_malicious=True,
                threat_types=["DDoS", "Scanning"],
                country="RU",
                asn="AS12389"
            ),
            "198.51.100.89": IPReputation(
                ip_address="198.51.100.89",
                reputation_score=88,
                threat_count=8,
                is_malicious=True,
                threat_types=["Brute Force"],
                country="CN",
                asn="AS4134"
            ),
        }
    
    def add_incident(self, incident: ThreatIncident) -> ThreatIncident:
        """Add a new threat incident"""
        with self._lock:
            self.incidents[incident.id] = incident
            self._save_data()
        return incident
    
    def get_incident(self, incident_id: str) -> Optional[ThreatIncident]:
        """Get incident by ID"""
        return self.incidents.get(incident_id)
    
    def get_recent_incidents(self, limit: int = 50, hours: int = 24) -> List[ThreatIncident]:
        """Get recent incidents"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        incidents = [
            inc for inc in self.incidents.values()
            if inc.timestamp >= cutoff
        ]
        return sorted(incidents, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def get_incidents_by_severity(self, severity: SeverityLevel) -> List[ThreatIncident]:
        """Get incidents by severity level"""
        return [inc for inc in self.incidents.values() if inc.severity == severity]
    
    def get_summary(self) -> ThreatSummary:
        """Get threat summary statistics"""
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        all_incidents = list(self.incidents.values())
        incidents_24h = [i for i in all_incidents if i.timestamp >= last_24h]
        incidents_7d = [i for i in all_incidents if i.timestamp >= last_7d]
        
        severity_counts = defaultdict(int)
        for inc in all_incidents:
            severity_counts[inc.severity] += 1
        
        # Calculate trend
        if len(incidents_7d) > 0 and len(incidents_24h) > 0:
            trend_pct = ((len(incidents_24h) - len(incidents_7d) / 7) / (len(incidents_7d) / 7)) * 100
            trend = f"{trend_pct:+.1f}%"
        else:
            trend = "0%"
        
        return ThreatSummary(
            total_incidents=len(all_incidents),
            critical=severity_counts[SeverityLevel.CRITICAL],
            high=severity_counts[SeverityLevel.HIGH],
            medium=severity_counts[SeverityLevel.MEDIUM],
            low=severity_counts[SeverityLevel.LOW],
            info=severity_counts[SeverityLevel.INFO],
            trend=trend,
            last_24h_incidents=len(incidents_24h),
            last_7d_incidents=len(incidents_7d)
        )
    
    def get_attack_distribution(self) -> List[AttackDistribution]:
        """Get attack type distribution"""
        attack_counts = defaultdict(lambda: defaultdict(int))
        total = len(self.incidents)
        
        for inc in self.incidents.values():
            attack_counts[inc.attack_type][inc.severity] += 1
        
        distributions = []
        for attack_type, severity_breakdown in attack_counts.items():
            count = sum(severity_breakdown.values())
            distributions.append(AttackDistribution(
                type=attack_type,
                count=count,
                percentage=(count / total * 100) if total > 0 else 0,
                severity_breakdown=dict(severity_breakdown)
            ))
        
        return sorted(distributions, key=lambda x: x.count, reverse=True)
    
    def get_top_threat_actors(self, limit: int = 5) -> List[ThreatActor]:
        """Get top threat actors by incident count"""
        actor_counts = defaultdict(int)
        for inc in self.incidents.values():
            if inc.threat_actor:
                actor_counts[inc.threat_actor] += 1
        
        top_actors = sorted(actor_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [self.actors[actor_id] for actor_id, _ in top_actors if actor_id in self.actors]
    
    def get_top_malicious_ips(self, limit: int = 10) -> List[IPReputation]:
        """Get top malicious IPs"""
        return sorted(
            self.ip_reputation.values(),
            key=lambda x: x.reputation_score,
            reverse=True
        )[:limit]
    
    def get_mitre_techniques_used(self) -> List[MITRETechnique]:
        """Get MITRE techniques used in recent incidents"""
        techniques_used = set()
        for inc in self.incidents.values():
            techniques_used.update(inc.mitre_techniques)
        
        return [self.techniques[t] for t in techniques_used if t in self.techniques]
    
    def check_ip_reputation(self, ip: str) -> Optional[IPReputation]:
        """Check reputation of an IP address"""
        return self.ip_reputation.get(ip)
    
    def add_ip_reputation(self, ip_rep: IPReputation):
        """Add or update IP reputation"""
        with self._lock:
            self.ip_reputation[ip_rep.ip_address] = ip_rep
    
    def get_technique(self, technique_id: str) -> Optional[MITRETechnique]:
        """Get MITRE technique details"""
        return self.techniques.get(technique_id)
    
    def get_actor(self, actor_id: str) -> Optional[ThreatActor]:
        """Get threat actor details"""
        return self.actors.get(actor_id)


# Global database instance
_db_instance: Optional[ThreatIntelDB] = None


def get_db() -> ThreatIntelDB:
    """Get or create database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = ThreatIntelDB()
    return _db_instance
