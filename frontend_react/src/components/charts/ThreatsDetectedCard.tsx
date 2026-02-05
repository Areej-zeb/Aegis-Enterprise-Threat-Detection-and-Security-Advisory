import React, { useMemo } from "react"; 
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useSystemStatus } from "../../hooks/useSystemStatus";
import { generateMonthlyThreats } from "../../utils/mockDataGenerator";
import "./ThreatsDetectedCard.css";

export type ThreatPoint = {
  label: string;
  value: number;
};

export type ThreatsDetectedCardProps = {
  title?: string;
  data?: ThreatPoint[];
  minY?: number;
  maxY?: number;
  loading?: boolean;
  emptyMessage?: string;
};

const ThreatsDetectedCard: React.FC<ThreatsDetectedCardProps> = ({
  title = "Threats Detected",
  data,
  minY,
  maxY,
  loading = false,
  emptyMessage = "No threat data available.",
}) => {
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.mockStream === 'ON';
  
  // Generate mock data when in mock mode and no real data
  const mockData = useMemo(() => {
    if (!isMockMode) return null;
    
    const monthlyData = generateMonthlyThreats();
    return monthlyData.slice(-7).map(item => ({
      label: item.month,
      value: item.value
    }));
  }, [isMockMode]);
  
  // Use mock data if in mock mode and no real data provided
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    if (isMockMode && mockData) return mockData;
    return [];
  }, [data, isMockMode, mockData]);
  
  // Only render chart if we have at least 2 data points
  const hasEnoughData = chartData && chartData.length >= 2;
  const isEmpty = chartData.length === 0;
  const hasSinglePoint = chartData.length === 1;
  
  // Calculate dynamic Y-axis domain if not provided
  const values = chartData.map(d => d.value);
  const calculatedMinY = minY !== undefined ? minY : (values.length > 0 ? Math.max(0, Math.min(...values) - 5) : 0);
  const calculatedMaxY = maxY !== undefined ? maxY : (values.length > 0 ? Math.max(...values) + 5 : 10);

  return (
    <div className="aegis-card">
      <div className="aegis-card-header">
        <h2>{title}</h2>
        {isMockMode && hasEnoughData && (
          <span style={{ 
            fontSize: '10px', 
            color: '#64748b', 
            fontStyle: 'italic' 
          }}>
            Mock Data
          </span>
        )}
      </div>

      <div className="threats-card__chart">
        {loading ? (
          <div className="threats-card__skeleton">
            <div className="threats-card__skeleton-line" />
            <div className="threats-card__skeleton-line threats-card__skeleton-line--short" />
            <div className="threats-card__skeleton-line threats-card__skeleton-line--medium" />
          </div>
        ) : isEmpty || hasSinglePoint ? (
          <div className="threats-card__empty">
            <p>{isEmpty ? (isMockMode ? "Generating mock data..." : emptyMessage) : "Not enough recent data to display a trend yet."}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="threatsLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>

                <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feComponentTransfer in="coloredBlur" result="fadedBlur">
                    <feFuncA type="linear" slope="0.4" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode in="fadedBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid
                stroke="#1e293b"
                strokeDasharray="3 3"
                horizontal
                vertical={false}
                strokeOpacity={0.5}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                height={30}
              />

              <YAxis
                domain={[calculatedMinY, calculatedMaxY]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                width={40}
                tickCount={5}
                allowDecimals={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 20, 40, 0.95)",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  borderRadius: "8px",
                  color: "#e5edff",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#cbd5e1" }}
                cursor={{
                  stroke: "#64748b",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#threatsLineGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#a855f7", stroke: "#fff", strokeWidth: 2 }}
                filter="url(#lineGlow)"
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ThreatsDetectedCard;
