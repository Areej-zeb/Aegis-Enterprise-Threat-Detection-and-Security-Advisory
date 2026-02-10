import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsChartsProps {
  timeline: Array<{
    timestamp: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  }>;
  attackTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  severityBreakdown: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  onAttackTypeClick?: (type: string) => void;
  loading?: boolean;
}

const SEVERITY_COLORS = {
  critical: '#ff6b6b',
  high: '#ff9f43',
  medium: '#f6c244',
  low: '#34d399',
  info: '#5ac9ff',
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  timeline,
  attackTypes,
  severityBreakdown,
  onAttackTypeClick,
  loading,
}) => {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div className="prm-card" style={{ height: '300px', animation: 'pulse 2s infinite' }}></div>
        <div className="prm-card" style={{ height: '300px', animation: 'pulse 2s infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
      {/* Timeline Chart */}
      <div className="prm-card">
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f5f7fb', margin: '0 0 16px 0' }}>
          Alerts Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="timestamp"
              stroke="#9fb3d9"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis stroke="#9fb3d9" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 18, 39, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f5f7fb' }}
              formatter={(value: any) => [value, '']}
            />
            <Legend wrapperStyle={{ color: '#9fb3d9' }} />
            <Line type="monotone" dataKey="critical" stroke={SEVERITY_COLORS.critical} dot={false} />
            <Line type="monotone" dataKey="high" stroke={SEVERITY_COLORS.high} dot={false} />
            <Line type="monotone" dataKey="medium" stroke={SEVERITY_COLORS.medium} dot={false} />
            <Line type="monotone" dataKey="low" stroke={SEVERITY_COLORS.low} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Attack Type Distribution */}
      <div className="prm-card">
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f5f7fb', margin: '0 0 16px 0' }}>
          Attack Types
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attackTypes} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis type="number" stroke="#9fb3d9" tick={{ fontSize: 12 }} />
            <YAxis dataKey="type" type="category" stroke="#9fb3d9" tick={{ fontSize: 11 }} width={80} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 18, 39, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f5f7fb' }}
            />
            <Bar dataKey="count" fill="#5ac9ff" onClick={(data) => onAttackTypeClick?.(data.type || '')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Severity Breakdown */}
      <div className="prm-card">
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f5f7fb', margin: '0 0 16px 0' }}>
          Severity Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={severityBreakdown}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => `${props.payload?.severity || 'Unknown'}: ${props.payload?.percentage || 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {severityBreakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity as keyof typeof SEVERITY_COLORS]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 18, 39, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f5f7fb' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
