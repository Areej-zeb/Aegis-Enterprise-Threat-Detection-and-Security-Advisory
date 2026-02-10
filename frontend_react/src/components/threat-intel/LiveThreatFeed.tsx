import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, MapPin, Shield } from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';

interface Incident {
  id: string;
  timestamp: string;
  severity: string;
  attack_type: string;
  source_ip: string;
  target_service: string;
  description: string;
  confidence: number;
  threat_actor?: string;
}

interface LiveThreatFeedProps {
  incidents: Incident[];
  loading?: boolean;
  onIncidentClick?: (incident: Incident) => void;
}

export const LiveThreatFeed: React.FC<LiveThreatFeedProps> = ({
  incidents,
  loading,
  onIncidentClick,
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'rgba(255, 107, 107, 0.1)',
      high: 'rgba(255, 159, 67, 0.1)',
      medium: 'rgba(246, 194, 68, 0.1)',
      low: 'rgba(52, 211, 153, 0.1)',
      info: 'rgba(148, 163, 184, 0.1)',
    };
    return colors[severity] || colors.info;
  };

  const getSeverityBorder = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'rgba(255, 107, 107, 0.3)',
      high: 'rgba(255, 159, 67, 0.3)',
      medium: 'rgba(246, 194, 68, 0.3)',
      low: 'rgba(52, 211, 153, 0.3)',
      info: 'rgba(148, 163, 184, 0.3)',
    };
    return colors[severity] || colors.info;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="prm-card" style={{ animation: 'pulse 2s infinite', height: '80px' }}></div>
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="prm-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <Shield style={{ width: '48px', height: '48px', color: '#64748b', margin: '0 auto 12px' }} />
        <p style={{ color: '#9fb3d9', margin: 0 }}>No threats detected</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
      {incidents.map((incident) => (
        <div
          key={incident.id}
          onClick={() => onIncidentClick?.(incident)}
          className="prm-card"
          style={{
            background: getSeverityColor(incident.severity),
            border: `1px solid ${getSeverityBorder(incident.severity)}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(90, 201, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = getSeverityBorder(incident.severity);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
              <AlertCircle style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: 0, color: '#5ac9ff' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#f5f7fb', marginBottom: '4px' }}>
                  {incident.attack_type}
                </h4>
                <p style={{ fontSize: '12px', color: '#9fb3d9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {incident.description}
                </p>
              </div>
            </div>
            <SeverityBadge severity={incident.severity} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9fb3d9' }}>
              <MapPin style={{ width: '12px', height: '12px' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incident.source_ip}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9fb3d9' }}>
              <Clock style={{ width: '12px', height: '12px' }} />
              <span>{formatTime(incident.timestamp)}</span>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
              <span>{incident.target_service}</span>
              <span>Confidence: {(incident.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          {incident.threat_actor && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', fontSize: '12px', fontWeight: '600', color: '#5ac9ff' }}>
              Actor: {incident.threat_actor}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
