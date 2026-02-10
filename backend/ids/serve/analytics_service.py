"""
Analytics Service for IDS
Provides real-time analytics and metrics from IDS alerts.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict
import statistics

class AnalyticsService:
    """Service for computing analytics from alerts"""
    
    def __init__(self, alerts_data: List[Dict] = None):
        self.alerts = alerts_data or []
    
    def update_alerts(self, alerts: List[Dict]):
        """Update alerts data"""
        self.alerts = alerts
    
    def get_time_range_data(self, from_time: datetime, to_time: datetime) -> Dict[str, Any]:
        """Get all analytics for a time range"""
        filtered_alerts = self._filter_by_time(from_time, to_time)
        
        return {
            "time_range": {
                "from": from_time.isoformat(),
                "to": to_time.isoformat(),
                "duration_minutes": int((to_time - from_time).total_seconds() / 60)
            },
            "summary": self._compute_summary(filtered_alerts),
            "timeline": self._compute_timeline(filtered_alerts, from_time, to_time),
            "attack_types": self._compute_attack_distribution(filtered_alerts),
            "severity_breakdown": self._compute_severity_breakdown(filtered_alerts),
            "top_talkers": self._compute_top_talkers(filtered_alerts),
        }
    
    def _filter_by_time(self, from_time: datetime, to_time: datetime) -> List[Dict]:
        """Filter alerts by time range"""
        filtered = []
        for alert in self.alerts:
            try:
                alert_time = datetime.fromisoformat(alert.get('timestamp', '').replace('Z', '+00:00'))
                if from_time <= alert_time <= to_time:
                    filtered.append(alert)
            except:
                pass
        return filtered
    
    def _compute_summary(self, alerts: List[Dict]) -> Dict[str, Any]:
        """Compute summary metrics"""
        if not alerts:
            return {
                "total_alerts": 0,
                "detection_rate": 0.0,
                "high_critical_count": 0,
                "unique_sources": 0,
                "avg_confidence": 0.0,
            }
        
        total = len(alerts)
        non_benign = sum(1 for a in alerts if a.get('severity') in ['critical', 'high', 'medium'])
        critical_high = sum(1 for a in alerts if a.get('severity') in ['critical', 'high'])
        unique_ips = len(set(a.get('source_ip', a.get('srcIp', '')) for a in alerts if a.get('source_ip') or a.get('srcIp')))
        
        confidences = []
        for a in alerts:
            conf = a.get('confidence', a.get('score', 0))
            if isinstance(conf, (int, float)):
                confidences.append(conf)
        
        avg_conf = statistics.mean(confidences) if confidences else 0.0
        
        return {
            "total_alerts": total,
            "detection_rate": round((non_benign / total * 100) if total > 0 else 0, 1),
            "high_critical_count": critical_high,
            "unique_sources": unique_ips,
            "avg_confidence": round(avg_conf, 2),
        }
    
    def _compute_timeline(self, alerts: List[Dict], from_time: datetime, to_time: datetime) -> List[Dict]:
        """Compute time-series data"""
        duration_minutes = int((to_time - from_time).total_seconds() / 60)
        
        # Determine bucket size
        if duration_minutes <= 15:
            bucket_minutes = 1
        elif duration_minutes <= 60:
            bucket_minutes = 5
        elif duration_minutes <= 1440:
            bucket_minutes = 15
        else:
            bucket_minutes = 60
        
        # Create buckets
        buckets = defaultdict(lambda: {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0})
        
        for alert in alerts:
            try:
                alert_time = datetime.fromisoformat(alert.get('timestamp', '').replace('Z', '+00:00'))
                bucket_time = alert_time.replace(second=0, microsecond=0)
                bucket_time = bucket_time.replace(minute=(bucket_time.minute // bucket_minutes) * bucket_minutes)
                
                severity = alert.get('severity', 'info').lower()
                if severity not in buckets[bucket_time]:
                    severity = 'info'
                
                buckets[bucket_time][severity] += 1
            except:
                pass
        
        # Convert to list
        timeline = []
        current = from_time.replace(second=0, microsecond=0)
        current = current.replace(minute=(current.minute // bucket_minutes) * bucket_minutes)
        
        while current <= to_time:
            timeline.append({
                "timestamp": current.isoformat(),
                **buckets.get(current, {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0})
            })
            current += timedelta(minutes=bucket_minutes)
        
        return timeline
    
    def _compute_attack_distribution(self, alerts: List[Dict]) -> List[Dict]:
        """Compute attack type distribution"""
        attack_counts = defaultdict(int)
        
        for alert in alerts:
            attack_type = alert.get('attack_type', alert.get('label', 'Unknown'))
            attack_counts[attack_type] += 1
        
        total = len(alerts)
        distribution = []
        
        for attack_type, count in sorted(attack_counts.items(), key=lambda x: x[1], reverse=True):
            distribution.append({
                "type": attack_type,
                "count": count,
                "percentage": round((count / total * 100) if total > 0 else 0, 1),
            })
        
        return distribution
    
    def _compute_severity_breakdown(self, alerts: List[Dict]) -> List[Dict]:
        """Compute severity breakdown"""
        severity_counts = defaultdict(int)
        
        for alert in alerts:
            severity = alert.get('severity', 'info').lower()
            severity_counts[severity] += 1
        
        total = len(alerts)
        severity_order = ['critical', 'high', 'medium', 'low', 'info']
        breakdown = []
        
        for severity in severity_order:
            count = severity_counts.get(severity, 0)
            breakdown.append({
                "severity": severity,
                "count": count,
                "percentage": round((count / total * 100) if total > 0 else 0, 1),
            })
        
        return breakdown
    
    def _compute_top_talkers(self, alerts: List[Dict], limit: int = 10) -> List[Dict]:
        """Compute top source IPs"""
        ip_data = defaultdict(lambda: {'count': 0, 'last_seen': None, 'severities': []})
        
        for alert in alerts:
            ip = alert.get('source_ip', alert.get('srcIp', 'Unknown'))
            timestamp = alert.get('timestamp', '')
            severity = alert.get('severity', 'info')
            
            ip_data[ip]['count'] += 1
            ip_data[ip]['last_seen'] = timestamp
            ip_data[ip]['severities'].append(severity)
        
        # Sort by count
        top_ips = sorted(ip_data.items(), key=lambda x: x[1]['count'], reverse=True)[:limit]
        
        talkers = []
        for ip, data in top_ips:
            # Determine threat score based on severity distribution
            threat_score = 0
            if data['severities']:
                critical_pct = (data['severities'].count('critical') / len(data['severities'])) * 100
                high_pct = (data['severities'].count('high') / len(data['severities'])) * 100
                threat_score = int(critical_pct * 2 + high_pct)
            
            talkers.append({
                "ip": ip,
                "count": data['count'],
                "last_seen": data['last_seen'],
                "threat_score": min(100, threat_score),
            })
        
        return talkers


def get_analytics_service(alerts: List[Dict] = None) -> AnalyticsService:
    """Factory function for analytics service"""
    return AnalyticsService(alerts)
