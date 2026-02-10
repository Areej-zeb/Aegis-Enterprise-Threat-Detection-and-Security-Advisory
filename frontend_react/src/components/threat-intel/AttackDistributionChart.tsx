import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface AttackData {
  type: string;
  count: number;
  percentage: number;
  severity_breakdown: Record<string, number>;
}

interface AttackDistributionChartProps {
  data: AttackData[];
  loading?: boolean;
}

export const AttackDistributionChart: React.FC<AttackDistributionChartProps> = ({ data, loading }) => {
  const colors = {
    DDoS_SYN: '#ff6b6b',
    MITM_ARP: '#ff9f43',
    DNS_Exfiltration: '#f6c244',
    Brute_Force: '#5ac9ff',
    Malware: '#a78bfa',
    Scanning: '#06b6d4',
    Anomaly: '#ec4899',
  };

  const chartData = data.map((item) => ({
    name: item.type.replace(/_/g, ' '),
    count: item.count,
    percentage: item.percentage.toFixed(1),
  }));

  if (loading) {
    return (
      <div className="prm-card" style={{ height: '320px', animation: 'pulse 2s infinite' }}></div>
    );
  }

  return (
    <div className="prm-card">
      <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#f5f7fb' }}>Attack Type Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="name" stroke="#9fb3d9" angle={-45} textAnchor="end" height={80} style={{ fontSize: '12px' }} />
          <YAxis stroke="#9fb3d9" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 18, 39, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#f5f7fb' }}
            formatter={(value: any) => [value, 'Count']}
          />
          <Bar dataKey="count" fill="#5ac9ff" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[entry.name.replace(/ /g, '_') as keyof typeof colors] || '#5ac9ff'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
        {data.map((item) => (
          <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: colors[item.type as keyof typeof colors] || '#5ac9ff',
              }}
            ></div>
            <span style={{ color: '#9fb3d9' }}>
              {item.type.replace(/_/g, ' ')}: {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
