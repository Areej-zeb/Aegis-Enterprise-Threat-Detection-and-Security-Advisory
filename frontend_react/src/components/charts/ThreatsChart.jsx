import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ThreatsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="aegis-chart-placeholder">
        <div className="aegis-chart-empty">
          <p className="aegis-chart-empty-title">No data available</p>
          <p className="aegis-chart-empty-copy">
            Connect the IDS API to visualize detections over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
        <XAxis
          dataKey="date"
          stroke="#9ca3af"
          style={{ fontSize: "12px" }}
        />
        <YAxis
          stroke="#9ca3af"
          style={{ fontSize: "12px" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(10, 20, 40, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            borderRadius: "8px",
            color: "#e5edff",
          }}
          labelStyle={{ color: "#cbd5e1" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
        />
        <Line
          type="monotone"
          dataKey="high"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444", r: 3 }}
          name="High Severity"
        />
        <Line
          type="monotone"
          dataKey="medium"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ fill: "#f59e0b", r: 3 }}
          name="Medium Severity"
        />
        <Line
          type="monotone"
          dataKey="low"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: "#22c55e", r: 3 }}
          name="Low Severity"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ThreatsChart;
