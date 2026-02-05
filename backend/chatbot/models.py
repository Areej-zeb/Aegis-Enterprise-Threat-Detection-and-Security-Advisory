# backend/chatbot/models.py
"""
Data models for Aegis Advisory Chatbot
Matches thesis specifications for Module 3
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
import uuid

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class QueryType(str, Enum):
    THREAT_ANALYSIS = "threat_analysis"
    MITRE_MAPPING = "mitre_mapping"
    IP_REPUTATION = "ip_reputation"
    POLICY_ADVICE = "policy_advice"
    GENERAL = "general"

class ThreatLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ChatMessage(BaseModel):
    """Individual chat message"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatSession(BaseModel):
    """Chat session with history"""
    id: str
    user_context: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List[ChatMessage] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SecurityQuery(BaseModel):
    """Security query from user"""
    session_id: str
    query: str
    query_type: QueryType = QueryType.GENERAL
    context: Dict[str, Any] = Field(default_factory=dict)

class ExplainabilityOutput(BaseModel):
    """LIME/SHAP explanation output"""
    method: str  # "lime" or "shap"
    explanation: str
    features: List[Dict[str, Any]]
    confidence_scores: Dict[str, float]
    visualization_data: Optional[Dict[str, Any]] = None

class AdvisoryResponse(BaseModel):
    """Advisory response with explainability"""
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    threat_level: Optional[ThreatLevel] = None
    references: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    explainability: Optional[ExplainabilityOutput] = None
    explainability_enabled: bool = True
    mitre_mappings: List[Dict[str, Any]] = Field(default_factory=list)
    ip_intel: Optional[Dict[str, Any]] = None

class ThreatAnalysis(BaseModel):
    """Threat analysis result"""
    summary: str
    threat_level: ThreatLevel
    indicators: List[str]
    mitre_techniques: List[str]
    recommendations: List[str]
    confidence: float

class IDSAlert(BaseModel):
    """IDS alert for integration"""
    id: str
    timestamp: datetime
    threat_type: str
    severity: ThreatLevel
    source_ip: Optional[str]
    destination_ip: Optional[str]
    description: str
    raw_data: Dict[str, Any]

class PentestResult(BaseModel):
    """Pentest result for integration"""
    id: str
    timestamp: datetime
    target: str
    vulnerabilities: List[Dict[str, Any]]
    risk_score: float
    recommendations: List[str]