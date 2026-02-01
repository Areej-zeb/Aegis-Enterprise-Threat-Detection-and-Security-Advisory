from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class VulnerabilityReference(BaseModel):
    url: str
    source: str  # e.g., "MITRE", "NVD", "CISA"
    tags: List[str] = Field(default_factory=list)

class Vulnerability(BaseModel):
    """
    Normalized Vulnerability Model for Aegis.
    Aggregates data from multiple sources (NVD, CISA, OSV).
    """
    id: str = Field(..., description="Primary ID (usually CVE ID)")
    
    # Identifiers
    cve_id: Optional[str] = None
    osv_id: Optional[str] = None
    
    # Core Risk Signals
    severity_score: float = Field(0.0, ge=0.0, le=10.0, description="Computed Aegis Risk Score")
    severity_level: str = Field("LOW", description="CRITICAL, HIGH, MEDIUM, LOW")
    known_exploited: bool = Field(False, description="True if present in CISA KEV or other exploit feeds")
    exploit_url: Optional[str] = None
    
    # Descriptive Data
    description: str = ""
    title: Optional[str] = None
    published_date: Optional[datetime] = None
    last_modified: Optional[datetime] = None
    
    # Official Metrics (NVD/MITRE)
    cvss_v3_score: Optional[float] = None
    cvss_v3_vector: Optional[str] = None
    epss_score: Optional[float] = None # Exploit Prediction Scoring System
    
    # Matching
    affected_cpes: List[str] = Field(default_factory=list, description="List of CPE strings this vuln affects")
    affected_packages: List[str] = Field(default_factory=list, description="Package names (e.g. for OSV)")
    
    # Metadata
    references: List[VulnerabilityReference] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list) # e.g. ["RANSOMWARE", "KEV", "REMOTE"]

    class Config:
        json_schema_extra = {
            "example": {
                "id": "CVE-2021-44228",
                "cve_id": "CVE-2021-44228",
                "severity_score": 10.0,
                "severity_level": "CRITICAL",
                "known_exploited": True,
                "title": "Log4Shell",
                "description": "Remote code execution in Log4j...",
                "tags": ["KEV", "RCE"]
            }
        }
