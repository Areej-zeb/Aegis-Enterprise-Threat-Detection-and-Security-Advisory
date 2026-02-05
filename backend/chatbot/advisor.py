# backend/chatbot/advisor.py
"""
Security Advisor Core Logic
Implements AI-powered security advisory
References thesis sections 2.1.3 and 2.2.3
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio

from .models import (
    AdvisoryResponse, ThreatAnalysis, ThreatLevel,
    IDSAlert, PentestResult
)
from .threat_intel import ThreatIntelligence

class SecurityAdvisor:
    """AI-powered security advisor (Primary module for Sahar)"""
    
    def __init__(self):
        self.threat_intel = ThreatIntelligence()
        self.knowledge_base = self._load_knowledge_base()
        
    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Load security knowledge base"""
        return {
            "threat_patterns": {
                "ddos": {
                    "indicators": ["high traffic volume", "multiple source IPs", "syn flood"],
                    "mitigation": ["rate limiting", "cloudflare protection", "anycast"],
                    "mitre_techniques": ["T1498", "T1499"]
                },
                "ransomware": {
                    "indicators": ["file encryption", "ransom notes", "unusual process"],
                    "mitigation": ["backup strategy", "endpoint protection", "user training"],
                    "mitre_techniques": ["T1486", "T1490"]
                }
            },
            "compliance_frameworks": {
                "nist_csf": ["ID.AM", "PR.AC", "DE.CM", "RS.RP", "RC.RP"],
                "iso_27001": ["A.5", "A.6", "A.7", "A.8", "A.9"],
                "pci_dss": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
            }
        }
    
    async def analyze_threat(self, query: str, context: Dict[str, Any] = None) -> AdvisoryResponse:
        """Analyze security threat with explainable AI"""
        
        # Determine threat type
        threat_type = self._identify_threat_type(query)
        
        # Get threat intelligence
        mitre_mappings = await self.threat_intel.map_to_mitre(query)
        
        # Generate advisory
        if threat_type in self.knowledge_base["threat_patterns"]:
            pattern = self.knowledge_base["threat_patterns"][threat_type]
            answer = self._generate_threat_advisory(threat_type, pattern, mitre_mappings)
            threat_level = ThreatLevel.CRITICAL if threat_type in ["ddos", "ransomware"] else ThreatLevel.HIGH
        else:
            answer = self._generate_general_advisory(query)
            threat_level = ThreatLevel.MEDIUM
        
        return AdvisoryResponse(
            answer=answer,
            confidence=0.85,
            threat_level=threat_level,
            references=[
                "MITRE ATT&CK Framework",
                "NIST Cybersecurity Framework",
                "OWASP Top 10"
            ],
            recommended_actions=[
                "Review security logs",
                "Update intrusion detection rules",
                "Conduct security assessment"
            ],
            mitre_mappings=mitre_mappings,
            explainability_enabled=True
        )
    
    async def analyze_ids_alerts(self, alerts: List[IDSAlert]) -> ThreatAnalysis:
        """Analyze IDS alerts (Integration with Module 1)"""
        
        if not alerts:
            return ThreatAnalysis(
                summary="No recent IDS alerts found",
                threat_level=ThreatLevel.INFO,
                indicators=[],
                mitre_techniques=[],
                recommendations=["Continue monitoring"],
                confidence=1.0
            )
        
        # Analyze alert patterns
        threat_types = [alert.threat_type for alert in alerts]
        severities = [alert.severity for alert in alerts]
        
        # Determine overall threat level
        if ThreatLevel.CRITICAL in severities:
            overall_threat = ThreatLevel.CRITICAL
        elif ThreatLevel.HIGH in severities:
            overall_threat = ThreatLevel.HIGH
        elif ThreatLevel.MEDIUM in severities:
            overall_threat = ThreatLevel.MEDIUM
        else:
            overall_threat = ThreatLevel.LOW
        
        # Get MITRE mappings
        mitre_techniques = []
        for alert in alerts:
            mappings = await self.threat_intel.map_to_mitre(alert.threat_type)
            mitre_techniques.extend([m["technique_id"] for m in mappings])
        
        # Generate summary
        summary = f"""## IDS Alert Analysis
        
**Total Alerts:** {len(alerts)}
**Time Range:** {min(a.timestamp for a in alerts).strftime('%Y-%m-%d %H:%M')} to {max(a.timestamp for a in alerts).strftime('%Y-%m-%d %H:%M')}
**Primary Threat Types:** {', '.join(set(threat_types))}
**Overall Threat Level:** {overall_threat.value.upper()}

**Key Findings:**
{chr(10).join(f'- {alert.threat_type} ({alert.severity.value}) from {alert.source_ip or "unknown"}' for alert in alerts[:3])}

**MITRE ATT&CK Techniques Identified:**
{chr(10).join(f'- {tech}' for tech in list(set(mitre_techniques))[:5])}"""
        
        return ThreatAnalysis(
            summary=summary,
            threat_level=overall_threat,
            indicators=[alert.description for alert in alerts[:5]],
            mitre_techniques=list(set(mitre_techniques)),
            recommendations=[
                "Review firewall rules",
                "Update IDS signatures",
                "Conduct threat hunting",
                "Check system integrity"
            ],
            confidence=0.8
        )
    
    async def analyze_pentest_results(self, results: List[PentestResult]) -> ThreatAnalysis:
        """Analyze pentest results (Integration with Module 2)"""
        
        if not results:
            return ThreatAnalysis(
                summary="No pentest results found",
                threat_level=ThreatLevel.INFO,
                indicators=[],
                mitre_techniques=[],
                recommendations=["Schedule regular pentests"],
                confidence=1.0
            )
        
        # Calculate overall risk
        total_vulns = sum(len(r.vulnerabilities) for r in results)
        avg_risk = sum(r.risk_score for r in results) / len(results)
        
        # Determine threat level based on risk
        if avg_risk >= 8.0:
            threat_level = ThreatLevel.CRITICAL
        elif avg_risk >= 6.0:
            threat_level = ThreatLevel.HIGH
        elif avg_risk >= 4.0:
            threat_level = ThreatLevel.MEDIUM
        else:
            threat_level = ThreatLevel.LOW
        
        summary = f"""## Penetration Test Analysis
        
**Tests Analyzed:** {len(results)}
**Total Vulnerabilities Found:** {total_vulns}
**Average Risk Score:** {avg_risk:.1f}/10
**Overall Threat Level:** {threat_level.value.upper()}

**Critical Findings:**
{chr(10).join(f'- {result.target}: {len([v for v in result.vulnerabilities if v.get("severity") == "critical"])} critical vulnerabilities' for result in results[:3])}

**Top Recommendations:**
{chr(10).join(f'- {rec}' for result in results[:2] for rec in result.recommendations[:2])}"""
        
        return ThreatAnalysis(
            summary=summary,
            threat_level=threat_level,
            indicators=[f"{r.target}: {len(r.vulnerabilities)} vulns" for r in results],
            mitre_techniques=[],
            recommendations=[
                "Prioritize critical vulnerabilities",
                "Implement security patches",
                "Update firewall rules",
                "Conduct security awareness training"
            ],
            confidence=0.9
        )
    
    async def provide_policy_advice(self, query: str, context: Dict[str, Any]) -> AdvisoryResponse:
        """Provide security policy advice"""
        
        answer = f"""## Security Policy Recommendations
        
Based on your query about **{query}**, here are policy recommendations:

### 1. Access Control Policy
- Implement principle of least privilege
- Require multi-factor authentication for admin access
- Regular access reviews (quarterly)

### 2. Incident Response Policy
- Define clear roles and responsibilities
- Establish communication protocols
- Regular tabletop exercises

### 3. Data Protection Policy
- Classify data based on sensitivity
- Implement encryption at rest and in transit
- Regular data backup testing

### 4. Compliance Framework Alignment
- Map to NIST CSF controls
- ISO 27001 certification preparation
- Regular compliance audits

### Implementation Steps:
1. Draft policy documents
2. Stakeholder review
3. Employee training
4. Continuous monitoring
5. Regular updates"""
        
        return AdvisoryResponse(
            answer=answer,
            confidence=0.9,
            threat_level=ThreatLevel.INFO,
            references=[
                "NIST SP 800-53",
                "ISO 27001:2022",
                "CIS Controls v8"
            ],
            recommended_actions=[
                "Draft policy documents",
                "Conduct risk assessment",
                "Implement monitoring",
                "Schedule regular reviews"
            ],
            explainability_enabled=True
        )
    
    async def general_advice(self, query: str) -> AdvisoryResponse:
        """Provide general security advice"""
        
        answer = f"""## Security Advisory
        
Regarding **{query}**, here's my analysis:

### Security Best Practices:
1. **Defense in Depth** - Multiple security layers
2. **Least Privilege** - Minimal necessary access
3. **Continuous Monitoring** - Real-time threat detection
4. **Regular Updates** - Patch management
5. **Employee Training** - Security awareness

### Recommended Actions:
- Conduct security assessment
- Review current controls
- Update security policies
- Implement monitoring
- Schedule regular testing

### Integration with Aegis Modules:
- Use IDS for real-time threat detection
- Regular pentests for vulnerability assessment
- This advisory chatbot for guidance
- Dashboard for unified view"""
        
        return AdvisoryResponse(
            answer=answer,
            confidence=0.8,
            threat_level=ThreatLevel.MEDIUM,
            references=[
                "Aegis Project Thesis",
                "NIST Cybersecurity Framework",
                "OWASP Security Guidelines"
            ],
            recommended_actions=[
                "Review current security posture",
                "Implement security controls",
                "Schedule security training",
                "Regular security testing"
            ],
            explainability_enabled=True
        )
    
    def _identify_threat_type(self, query: str) -> str:
        """Identify threat type from query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["ddos", "denial", "flood", "traffic"]):
            return "ddos"
        elif any(word in query_lower for word in ["ransomware", "encrypt", "bitcoin", "decrypt"]):
            return "ransomware"
        elif any(word in query_lower for word in ["sql", "injection", "database"]):
            return "sql_injection"
        elif any(word in query_lower for word in ["phishing", "email", "spoof"]):
            return "phishing"
        else:
            return "general"
    
    def _generate_threat_advisory(self, threat_type: str, pattern: Dict[str, Any], mitre_mappings: List[Dict]) -> str:
        """Generate threat-specific advisory"""
        
        return f"""## Threat Analysis: {threat_type.upper().replace('_', ' ')}

**Indicators of Compromise:**
{chr(10).join(f'- {indicator}' for indicator in pattern.get('indicators', []))}

**MITRE ATT&CK Techniques:**
{chr(10).join(f'- {mapping["technique_name"]} ({mapping["technique_id"]})' for mapping in mitre_mappings[:3])}

**Immediate Mitigation Steps:**
{chr(10).join(f'1. {step}' for step in pattern.get('mitigation', []))}

**Long-term Prevention:**
- Regular security assessments
- Employee security training
- Continuous monitoring
- Incident response planning

**Integration with Aegis:**
- Configure IDS rules for detection
- Schedule regular pentests
- Use dashboard for monitoring
- This chatbot for ongoing advisory"""
    
    def _generate_general_advisory(self, query: str) -> str:
        """Generate general security advisory"""
        
        return f"""## Security Advisory

**Query:** {query}

**Analysis:**
Based on your query, I recommend a comprehensive security approach:

### 1. Risk Assessment
- Identify critical assets
- Assess current vulnerabilities
- Evaluate threat landscape

### 2. Control Implementation
- Technical controls (firewalls, IDS)
- Administrative controls (policies, training)
- Physical controls (access control)

### 3. Monitoring & Detection
- Real-time alerting
- Log analysis
- Threat intelligence

### 4. Response & Recovery
- Incident response plan
- Backup strategies
- Business continuity

### Aegis Integration Benefits:
- Unified security management
- AI-powered threat detection
- Automated vulnerability assessment
- Explainable advisory support"""
    
    async def generate_security_report(self, session: Any) -> Dict[str, Any]:
        """Generate comprehensive security report"""
        return {
            "title": f"Aegis Security Advisory Report - Session {session.id}",
            "generated_at": datetime.utcnow().isoformat(),
            "session_info": {
                "created_at": session.created_at.isoformat(),
                "message_count": len(session.messages),
                "user_context": session.user_context
            },
            "threat_analysis": "Generated based on session content",
            "recommendations": [
                "Implement security controls",
                "Schedule regular assessments",
                "Continuous monitoring",
                "Employee training"
            ],
            "references": [
                "Aegis Project Documentation",
                "MITRE ATT&CK Framework",
                "NIST Cybersecurity Framework"
            ]
        }