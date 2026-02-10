"""
Threat Intelligence Chatbot Integration
Enables the chatbot to query and explain threat data.
"""

from typing import List, Optional
from .database import get_db
from .models import ThreatIncident, ThreatActor, MITRETechnique


class ThreatIntelligenceAdvisor:
    """Advisor for threat intelligence queries"""
    
    def __init__(self):
        self.db = get_db()
    
    def get_critical_threats(self) -> str:
        """Get summary of critical threats"""
        db = self.db
        critical = db.get_incidents_by_severity("critical")
        
        if not critical:
            return "No critical threats detected at this time."
        
        summary = f"Found {len(critical)} critical threats:\n\n"
        for inc in critical[:5]:
            summary += f"• {inc.attack_type} on {inc.target_service}\n"
            summary += f"  Source: {inc.source_ip}\n"
            summary += f"  Confidence: {inc.confidence*100:.0f}%\n"
            if inc.threat_actor:
                summary += f"  Actor: {inc.threat_actor}\n"
            summary += "\n"
        
        return summary
    
    def explain_mitre_technique(self, technique_id: str) -> str:
        """Explain a MITRE ATT&CK technique"""
        technique = self.db.get_technique(technique_id)
        
        if not technique:
            return f"Technique {technique_id} not found in database."
        
        explanation = f"**{technique.id}: {technique.name}**\n\n"
        explanation += f"**Tactic:** {technique.tactic}\n\n"
        explanation += f"**Description:** {technique.description}\n\n"
        
        if technique.mitigations:
            explanation += "**Mitigations:**\n"
            for mitigation in technique.mitigations:
                explanation += f"• {mitigation}\n"
            explanation += "\n"
        
        if technique.detection_methods:
            explanation += "**Detection Methods:**\n"
            for method in technique.detection_methods:
                explanation += f"• {method}\n"
        
        # Get incidents using this technique
        incidents = [
            i for i in self.db.get_recent_incidents(limit=1000)
            if technique_id in i.mitre_techniques
        ]
        
        if incidents:
            explanation += f"\n**Recent Incidents:** {len(incidents)} incidents detected using this technique"
        
        return explanation
    
    def check_ip_reputation(self, ip: str) -> str:
        """Check IP reputation"""
        reputation = self.db.check_ip_reputation(ip)
        
        if not reputation:
            return f"No reputation data found for {ip}. IP appears to be clean."
        
        status = "🔴 MALICIOUS" if reputation.is_malicious else "🟢 CLEAN"
        
        report = f"**IP Reputation Report: {ip}**\n\n"
        report += f"**Status:** {status}\n"
        report += f"**Reputation Score:** {reputation.reputation_score}/100\n"
        report += f"**Threat Count:** {reputation.threat_count}\n"
        
        if reputation.country:
            report += f"**Country:** {reputation.country}\n"
        if reputation.asn:
            report += f"**ASN:** {reputation.asn}\n"
        
        if reputation.threat_types:
            report += f"**Threat Types:** {', '.join(reputation.threat_types)}\n"
        
        report += f"**Last Seen:** {reputation.last_seen}\n"
        
        return report
    
    def get_threat_actor_info(self, actor_id: str) -> str:
        """Get threat actor information"""
        actor = self.db.get_actor(actor_id)
        
        if not actor:
            return f"Threat actor {actor_id} not found in database."
        
        info = f"**{actor.name}**\n\n"
        
        if actor.aliases:
            info += f"**Aliases:** {', '.join(actor.aliases)}\n\n"
        
        info += f"**Description:** {actor.description}\n\n"
        
        if actor.targets:
            info += f"**Target Industries:** {', '.join(actor.targets)}\n\n"
        
        if actor.techniques:
            info += f"**Known Techniques:** {', '.join(actor.techniques)}\n\n"
        
        info += f"**Threat Level:** {actor.threat_level.upper()}\n"
        
        if actor.last_seen:
            info += f"**Last Seen:** {actor.last_seen}\n"
        
        # Get incidents attributed to this actor
        incidents = [
            i for i in self.db.get_recent_incidents(limit=1000)
            if i.threat_actor == actor_id
        ]
        
        if incidents:
            info += f"\n**Recent Activity:** {len(incidents)} incidents attributed to this actor"
        
        return info
    
    def get_threat_summary(self) -> str:
        """Get overall threat summary"""
        summary = self.db.get_summary()
        
        report = "**Threat Summary Report**\n\n"
        report += f"**Total Incidents:** {summary.total_incidents}\n"
        report += f"**Critical:** {summary.critical}\n"
        report += f"**High:** {summary.high}\n"
        report += f"**Medium:** {summary.medium}\n"
        report += f"**Low:** {summary.low}\n"
        report += f"**Info:** {summary.info}\n\n"
        report += f"**Trend:** {summary.trend}\n"
        report += f"**Last 24h:** {summary.last_24h_incidents} incidents\n"
        report += f"**Last 7d:** {summary.last_7d_incidents} incidents\n"
        
        return report
    
    def get_attack_analysis(self) -> str:
        """Get attack type analysis"""
        distribution = self.db.get_attack_distribution()
        
        analysis = "**Attack Type Analysis**\n\n"
        
        for attack in distribution:
            analysis += f"**{attack.type.replace('_', ' ')}**\n"
            analysis += f"• Count: {attack.count}\n"
            analysis += f"• Percentage: {attack.percentage:.1f}%\n"
            analysis += "\n"
        
        return analysis
    
    def generate_threat_report(self) -> str:
        """Generate comprehensive threat report"""
        summary = self.db.get_summary()
        distribution = self.db.get_attack_distribution()
        actors = self.db.get_top_threat_actors(limit=3)
        
        report = "# THREAT INTELLIGENCE REPORT\n\n"
        
        report += "## Executive Summary\n"
        report += f"- Total Incidents: {summary.total_incidents}\n"
        report += f"- Critical Threats: {summary.critical}\n"
        report += f"- Trend: {summary.trend}\n\n"
        
        report += "## Attack Distribution\n"
        for attack in distribution[:5]:
            report += f"- {attack.type.replace('_', ' ')}: {attack.count} ({attack.percentage:.1f}%)\n"
        report += "\n"
        
        report += "## Top Threat Actors\n"
        for actor in actors:
            report += f"- {actor.name} ({actor.threat_level.upper()})\n"
        report += "\n"
        
        report += "## Recommendations\n"
        report += "1. Prioritize mitigation of critical threats\n"
        report += "2. Monitor top threat actors for new campaigns\n"
        report += "3. Review and update detection rules\n"
        report += "4. Conduct threat hunting for indicators of compromise\n"
        
        return report
    
    def process_query(self, query: str) -> str:
        """Process natural language threat intelligence queries"""
        query_lower = query.lower()
        
        # Critical threats
        if any(word in query_lower for word in ['critical', 'urgent', 'severe']):
            return self.get_critical_threats()
        
        # MITRE techniques
        if 'mitre' in query_lower or 't1' in query_lower:
            # Extract technique ID
            import re
            match = re.search(r'(T\d{4})', query)
            if match:
                return self.explain_mitre_technique(match.group(1))
            return "Please specify a MITRE technique ID (e.g., T1499)"
        
        # IP reputation
        if 'ip' in query_lower or 'reputation' in query_lower:
            import re
            match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', query)
            if match:
                return self.check_ip_reputation(match.group(0))
            return "Please provide an IP address to check"
        
        # Threat actors
        if 'actor' in query_lower or 'apt' in query_lower:
            # Try to extract actor name
            actors = self.db.actors
            for actor_id in actors:
                if actor_id.lower() in query_lower:
                    return self.get_threat_actor_info(actor_id)
            return "Please specify a threat actor name"
        
        # Summary
        if any(word in query_lower for word in ['summary', 'overview', 'status']):
            return self.get_threat_summary()
        
        # Analysis
        if 'analysis' in query_lower or 'distribution' in query_lower:
            return self.get_attack_analysis()
        
        # Report
        if 'report' in query_lower:
            return self.generate_threat_report()
        
        # Default
        return "I can help you with:\n" \
               "• Show critical threats\n" \
               "• Explain MITRE technique (e.g., T1499)\n" \
               "• Check IP reputation\n" \
               "• Threat actor information\n" \
               "• Threat summary\n" \
               "• Generate threat report\n\n" \
               "What would you like to know?"


# Global advisor instance
_advisor_instance: Optional[ThreatIntelligenceAdvisor] = None


def get_threat_advisor() -> ThreatIntelligenceAdvisor:
    """Get or create threat intelligence advisor"""
    global _advisor_instance
    if _advisor_instance is None:
        _advisor_instance = ThreatIntelligenceAdvisor()
    return _advisor_instance
