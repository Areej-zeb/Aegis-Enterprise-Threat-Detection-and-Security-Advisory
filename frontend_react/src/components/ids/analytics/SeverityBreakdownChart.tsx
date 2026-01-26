import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SeverityBreakdownChartProps {
  severityCounts: { severity: string; count: number }[];
}

type SeverityCounts = {
  low: number;
  medium: number;
  high: number;
  critical: number;
};

const SEVERITY_LABELS: Record<keyof SeverityCounts, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const SeverityBreakdownChart: React.FC<SeverityBreakdownChartProps> = ({ severityCounts }) => {
  // Transform array format to object format
  const counts = useMemo(() => {
    const result: SeverityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    if (severityCounts && severityCounts.length > 0) {
      severityCounts.forEach(item => {
        const sev = item.severity.toLowerCase();
        if (sev === 'critical') result.critical = item.count;
        else if (sev === 'high') result.high = item.count;
        else if (sev === 'medium') result.medium = item.count;
        else if (sev === 'low') result.low = item.count;
      });
    }

    return result;
  }, [severityCounts]);

  const total = counts.low + counts.medium + counts.high + counts.critical || 1;

  const data = useMemo(
    () => [
      {
        name: "Severity",
        low: counts.low,
        medium: counts.medium,
        high: counts.high,
        critical: counts.critical,
      },
    ],
    [counts]
  );

  const percent = (value: number) =>
    total === 0 ? "0%" : `${((value / total) * 100).toFixed(0)}%`;

  if (total === 0) {
    return (
      <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        <p>No severity data available</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "#e2e8f0", marginBottom: "0.25rem" }}>
            Severity Breakdown
          </p>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Alert distribution by severity level
          </p>
        </div>
        <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
          Total alerts: <span style={{ color: "#e2e8f0" }}>{total}</span>
        </p>
      </div>

      <div style={{ height: "160px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
          >
            <defs>
              <linearGradient id="grad-low" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
              <linearGradient id="grad-medium" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
              <linearGradient id="grad-high" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
              <linearGradient id="grad-critical" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f97373" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>

            <CartesianGrid
              horizontal={false}
              vertical={false}
              stroke="rgba(148, 163, 184, 0.12)"
            />

            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />

            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#050816",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                borderRadius: "8px",
                color: "#e5e7eb",
                boxShadow: "0 0 16px rgba(129, 140, 248, 0.5)",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#9ca3af", fontSize: "11px" }}
              formatter={(value: any, key: any) => {
                const v = Number(value || 0);
                const label = SEVERITY_LABELS[key as keyof SeverityCounts] || key;
                return [`${v} alerts (${percent(v)})`, label];
              }}
            />

            <Bar
              dataKey="low"
              stackId="severity"
              fill="url(#grad-low)"
              radius={[8, 0, 0, 8]}
            />
            <Bar
              dataKey="medium"
              stackId="severity"
              fill="url(#grad-medium)"
            />
            <Bar
              dataKey="high"
              stackId="severity"
              fill="url(#grad-high)"
            />
            <Bar
              dataKey="critical"
              stackId="severity"
              fill="url(#grad-critical)"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend row using pill style */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "11px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            borderRadius: "9999px",
            border: "1px solid #34d399",
            padding: "0.25rem 0.625rem",
            fontSize: "11px",
            fontWeight: "500",
            color: "#6ee7b7",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
          }}
        >
          Low • {percent(counts.low)}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            borderRadius: "9999px",
            border: "1px solid #fbbf24",
            padding: "0.25rem 0.625rem",
            fontSize: "11px",
            fontWeight: "500",
            color: "#fde68a",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
          }}
        >
          Medium • {percent(counts.medium)}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            borderRadius: "9999px",
            border: "1px solid #fb923c",
            padding: "0.25rem 0.625rem",
            fontSize: "11px",
            fontWeight: "500",
            color: "#fed7aa",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
          }}
        >
          High • {percent(counts.high)}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            borderRadius: "9999px",
            border: "1px solid #fb7185",
            padding: "0.25rem 0.625rem",
            fontSize: "11px",
            fontWeight: "500",
            color: "#fecdd3",
            backgroundColor: "rgba(251, 113, 133, 0.1)",
          }}
        >
          Critical • {percent(counts.critical)}
        </span>
      </div>
    </div>
  );
};
