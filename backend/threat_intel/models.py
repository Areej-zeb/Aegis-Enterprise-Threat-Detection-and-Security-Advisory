"""
Threat Intelligence Data Models
Defines database schemas for threat incidents, MITRE techniques, and threat actors.
"""

from datetime import datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    """Threat severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AttackType(str, Enum):
    """Types of attacks detected"""
    DDOS_SYN = "DDoS_SYN"
    MITM_ARP = "MITM_ARP"
    DNS_EXFILTRATION = "DNS_Exfiltration"
    BRUTE_FORCE = "Brute_Force"
    MALWARE = "Malware"
    SCANNING = "Scanning"
    ANOMALY = "Anomaly"


class MITRETechnique(BaseModel):
    """MITRE ATT&CK Technique"""
    id: str = Field(..., description="Technique ID (e.g., T1499)")
    name: str = Field(..., description="Technique name")
    description: str = Field(..., description="Detailed description")
    tactic: str = Field(..., description="Tactic category")
    mitigations: List[str] = Field(default_factory=list, description="Mitigation strategies")
    detection_methods: List[str] = Field(default_factory=list, description="Detection methods")


class ThreatActor(BaseModel):
    """Known threat actor profile"""
    id: str = Field(..., description="Actor ID")
    name: str = Field(..., description="Primary name")
    aliases: List[str] = Field(default_factory=list, description="Known aliases")
    description: str = Field(..., description="Actor description")
    targets: List[str] = Field(default_factory=list, description="Target industries")
    techniques: List[str] = Field(default_factory=list, description="Known MITRE techniques")
    last_seen: Optional[datetime] = Field(None, description="Last activity date")
    threat_level: SeverityLevel = Field(default=SeverityLevel.MEDIUM)


class IPReputation(BaseModel):
    """IP reputation data"""
    ip_address: str = Field(..., description="IP address")
    reputation_score: float = Field(..., ge=0, le=100, description="Reputation score 0-100")
    threat_count: int = Field(default=0, description="Number of threats associated")
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    is_malicious: bool = Field(default=False)
    threat_types: List[str] = Field(default_factory=list, description="Types of threats")
    country: Optional[str] = Field(None, description="Country of origin")
    asn: Optional[str] = Field(None, description="Autonomous System Number")


class ThreatIncident(BaseModel):
    """Detected threat incident"""
    id: str = Field(..., description="Unique incident ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: SeverityLevel = Field(...)
    attack_type: AttackType = Field(...)
    source_ip: str = Field(...)
    destination_ip: Optional[str] = Field(None)
    source_port: Optional[int] = Field(None)
    destination_port: Optional[int] = Field(None)
    target_service: str = Field(..., description="Affected service/host")
    description: str = Field(...)
    mitre_techniques: List[str] = Field(default_factory=list, description="Associated MITRE techniques")
    threat_actor: Optional[str] = Field(None, description="Suspected threat actor")
    confidence: float = Field(default=0.0, ge=0, le=1, description="Detection confidence 0-1")
    status: str = Field(default="open", description="open, investigating, resolved, false_positive")
    metadata: dict = Field(default_factory=dict, description="Additional context")


class ThreatSummary(BaseModel):
    """Overall threat summary statistics"""
    total_incidents: int
    critical: int
    high: int
    medium: int
    low: int
    info: int
    trend: str = Field(..., description="Trend indicator (e.g., '+18.4%')")
    last_24h_incidents: int
    last_7d_incidents: int


class AttackDistribution(BaseModel):
    """Attack type distribution"""
    type: AttackType
    count: int
    percentage: float
    severity_breakdown: dict = Field(default_factory=dict, description="Breakdown by severity")


class ThreatIntelResponse(BaseModel):
    """Complete threat intelligence response"""
    summary: ThreatSummary
    recent_incidents: List[ThreatIncident]
    attack_distribution: List[AttackDistribution]
    top_threat_actors: List[ThreatActor]
    top_malicious_ips: List[IPReputation]
    mitre_techniques_used: List[MITRETechnique]
