import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface Alert {
  id?: string;
  severity?: string;
  [key: string]: any;
}

interface RecentAlertTrendsProps {
  alerts: Alert[];
}

const SEVERITY_COLORS = {
  critical: "#ff3366",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const SEVERITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const RecentAlertTrends: React.FC<RecentAlertTrendsProps> = ({ alerts }) => {
  // Get last 50 alerts and count severity distribution
  const severityCounts = useMemo(() => {
    const last50 = alerts.slice(0, 50);
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    last50.forEach((alert) => {
      const severity = (alert.severity || "low").toLowerCase();
      if (severity === "critical") counts.critical++;
      else if (severity === "high") counts.high++;
      else if (severity === "medium") counts.medium++;
      else counts.low++;
    });

    return counts;
  }, [alerts]);

  const total = severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low;

  // Prepare data for horizontal stacked bar
  const chartData = useMemo(() => {
    if (total === 0) return [];

    return [
      {
        name: "Severity",
        Critical: severityCounts.critical,
        High: severityCounts.high,
        Medium: severityCounts.medium,
        Low: severityCounts.low,
      },
    ];
  }, [severityCounts, total]);

  if (total === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.875rem",
        }}
      >
        No recent alerts available.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "280px", minHeight: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id="grad-critical" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff3366" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <linearGradient id="grad-high" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <linearGradient id="grad-medium" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
            <linearGradient id="grad-low" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>

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
            formatter={(value: any, name: string) => {
              const count = Number(value || 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
              const labelKey = name.toLowerCase() as keyof typeof SEVERITY_LABELS;
              return [`${count} (${percentage}%)`, SEVERITY_LABELS[labelKey] || name];
            }}
          />

          <Bar dataKey="Critical" stackId="severity" fill="url(#grad-critical)" radius={[8, 0, 0, 8]} />
          <Bar dataKey="High" stackId="severity" fill="url(#grad-high)" />
          <Bar dataKey="Medium" stackId="severity" fill="url(#grad-medium)" />
          <Bar dataKey="Low" stackId="severity" fill="url(#grad-low)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginTop: "1rem",
          fontSize: "11px",
        }}
      >
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
          Critical: {severityCounts.critical}
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
          High: {severityCounts.high}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            borderRadius: "9999px",
            border: "1px solid #facc15",
            padding: "0.25rem 0.625rem",
            fontSize: "11px",
            fontWeight: "500",
            color: "#fef3c7",
            backgroundColor: "rgba(234, 179, 8, 0.1)",
          }}
        >
          Medium: {severityCounts.medium}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            borderRadius: "9999px",
            border: "1px solid #4ade80",
            padding: "0.25rem 0.625rem",
            fontSize: "11px",
            fontWeight: "500",
            color: "#d1fae5",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
          }}
        >
          Low: {severityCounts.low}
        </span>
      </div>
    </div>
  );
};

export default RecentAlertTrends;

