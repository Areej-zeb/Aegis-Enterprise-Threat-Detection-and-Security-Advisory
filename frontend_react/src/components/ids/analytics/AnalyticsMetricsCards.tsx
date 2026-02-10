import React from 'react';
import { TrendingUp, AlertCircle, Radio, Zap } from 'lucide-react';

interface MetricsCardsProps {
  summary: {
    total_alerts: number;
    detection_rate: number;
    high_critical_count: number;
    unique_sources: number;
    avg_confidence: number;
  } | null;
  loading?: boolean;
}

export const AnalyticsMetricsCards: React.FC<MetricsCardsProps> = ({ summary, loading }) => {
  const metrics = [
    {
      label: 'Total Alerts',
      value: summary?.total_alerts ?? 0,
      icon: AlertCircle,
      color: '#5ac9ff',
    },
    {
      label: 'Detection Rate',
      value: `${summary?.detection_rate ?? 0}%`,
      icon: TrendingUp,
      color: '#34d399',
    },
    {
      label: 'Critical + High',
      value: summary?.high_critical_count ?? 0,
      icon: Radio,
      color: '#ff6b6b',
    },
    {
      label: 'Unique Sources',
      value: summary?.unique_sources ?? 0,
      icon: Zap,
      color: '#f6c244',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="prm-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: loading ? 'pulse 2s infinite' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#9fb3d9' }}>{metric.label}</span>
              <Icon style={{ width: '18px', height: '18px', color: metric.color }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: metric.color }}>
              {loading ? '—' : metric.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
