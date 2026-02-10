import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';

interface ThreatSummaryProps {
  summary: {
    total_incidents: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    trend: string;
    last_24h_incidents: number;
    last_7d_incidents: number;
  };
  loading?: boolean;
}

export const ThreatSummaryCard: React.FC<ThreatSummaryProps> = ({ summary, loading }) => {
  const trendValue = parseFloat(summary.trend);
  const isPositiveTrend = trendValue > 0;

  const severityMetrics = [
    { label: 'Critical', value: summary.critical, color: '#ff6b6b' },
    { label: 'High', value: summary.high, color: '#ff9f43' },
    { label: 'Medium', value: summary.medium, color: '#f6c244' },
    { label: 'Low', value: summary.low, color: '#34d399' },
  ];

  if (loading) {
    return (
      <div className="prm-card" style={{ animation: 'pulse 2s infinite' }}>
        <div style={{ height: '32px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '8px', marginBottom: '16px' }}></div>
        <div style={{ space: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '16px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '4px', marginBottom: '8px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="prm-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle style={{ width: '24px', height: '24px', color: '#ff6b6b' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#f5f7fb' }}>Threat Summary</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isPositiveTrend ? (
            <TrendingUp style={{ width: '20px', height: '20px', color: '#ff6b6b' }} />
          ) : (
            <TrendingDown style={{ width: '20px', height: '20px', color: '#34d399' }} />
          )}
          <span style={{ fontSize: '14px', fontWeight: '600', color: isPositiveTrend ? '#ff6b6b' : '#34d399' }}>
            {summary.trend}
          </span>
        </div>
      </div>

      {/* Total Incidents */}
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
        <div style={{ fontSize: '32px', fontWeight: '700', color: '#f5f7fb', marginBottom: '8px' }}>{summary.total_incidents}</div>
        <div style={{ fontSize: '14px', color: '#9fb3d9' }}>Total Incidents</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
          Last 24h: {summary.last_24h_incidents} | Last 7d: {summary.last_7d_incidents}
        </div>
      </div>

      {/* Severity Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {severityMetrics.map((metric) => (
          <div key={metric.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: metric.color }}></div>
              <span style={{ fontSize: '14px', color: '#9fb3d9' }}>{metric.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '96px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '999px', height: '8px' }}>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '999px',
                    background: metric.color,
                    width: `${(metric.value / summary.total_incidents) * 100}%`,
                  }}
                ></div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#f5f7fb', width: '48px', textAlign: 'right' }}>{metric.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
