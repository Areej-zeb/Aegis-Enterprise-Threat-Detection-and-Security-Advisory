import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Alert {
  timestamp: string;
  severity: string;
}

interface AlertFrequencyChartProps {
  alerts: Alert[];
  timeWindowSeconds?: number;
}

const AlertFrequencyChart: React.FC<AlertFrequencyChartProps> = ({
  alerts,
  timeWindowSeconds = 60,
}) => {
  const chartData = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];

    const now = Date.now();
    const windowStart = now - timeWindowSeconds * 1000;

    // Filter alerts within time window
    const recentAlerts = alerts.filter((alert) => {
      const alertTime = new Date(alert.timestamp).getTime();
      return alertTime >= windowStart && alertTime <= now;
    });

    // Create 10-second buckets
    const buckets: Record<string, { time: string; critical: number; high: number; medium: number; low: number }> = {};
    const bucketSize = 10000; // 10 seconds in ms

    for (let i = 0; i < timeWindowSeconds / 10; i++) {
      const bucketTime = windowStart + i * bucketSize;
      const label = new Date(bucketTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      buckets[label] = { time: label, critical: 0, high: 0, medium: 0, low: 0 };
    }

    // Count alerts in each bucket
    recentAlerts.forEach((alert) => {
      const alertTime = new Date(alert.timestamp).getTime();
      const bucketIndex = Math.floor((alertTime - windowStart) / bucketSize);
      const bucketTime = windowStart + bucketIndex * bucketSize;
      const label = new Date(bucketTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      if (buckets[label]) {
        const severity = alert.severity.toLowerCase();
        if (severity === 'critical') {
          buckets[label].critical++;
        } else if (severity === 'high') {
          buckets[label].high++;
        } else if (severity === 'medium') {
          buckets[label].medium++;
        } else {
          buckets[label].low++;
        }
      }
    });

    return Object.values(buckets);
  }, [alerts, timeWindowSeconds]);

  if (chartData.length === 0) {
    return (
      <div style={{ 
        height: '200px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#64748b' 
      }}>
        <p>No alert data in the last {timeWindowSeconds} seconds</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff3366" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ff3366" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
        
        <XAxis
          dataKey="time"
          stroke="#64748b"
          style={{ fontSize: '11px' }}
          tickLine={false}
          axisLine={false}
        />
        
        <YAxis
          stroke="#64748b"
          style={{ fontSize: '11px' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(10, 20, 40, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px',
            color: '#e5edff',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#cbd5e1' }}
        />
        
        <Legend
          wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
        />
        
        <Area
          type="monotone"
          dataKey="critical"
          stackId="1"
          stroke="#ff3366"
          fill="url(#criticalGradient)"
          name="Critical"
        />
        <Area
          type="monotone"
          dataKey="high"
          stackId="1"
          stroke="#ef4444"
          fill="url(#highGradient)"
          name="High"
        />
        <Area
          type="monotone"
          dataKey="medium"
          stackId="1"
          stroke="#f59e0b"
          fill="url(#mediumGradient)"
          name="Medium"
        />
        <Area
          type="monotone"
          dataKey="low"
          stackId="1"
          stroke="#22c55e"
          fill="url(#lowGradient)"
          name="Low"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AlertFrequencyChart;
