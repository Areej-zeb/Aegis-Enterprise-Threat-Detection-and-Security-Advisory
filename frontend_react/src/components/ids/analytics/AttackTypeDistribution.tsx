import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface AttackTypeDistributionProps {
  attackCounts: { attackType: string; count: number }[];
}

const COLORS = {
  "DDoS_SYN": "#ef4444",
  "MITM_ARP + Sniffing": "#f59e0b",
  "dns_exfiltration": "#8b5cf6",
  "DNS_Exfiltration": "#8b5cf6",
  "BENIGN": "#22c55e",
  "UNKNOWN": "#64748b",
};

const DEFAULT_COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#22c55e", "#64748b", "#06b6d4", "#ec4899"];

export const AttackTypeDistribution: React.FC<AttackTypeDistributionProps> = ({ attackCounts }) => {
  if (!attackCounts || attackCounts.length === 0) {
    return (
      <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        <p>No attack type data available</p>
      </div>
    );
  }

  // Show top 5 + "Other" bucket
  const top5 = attackCounts.slice(0, 5);
  const otherCount = attackCounts.slice(5).reduce((sum, item) => sum + item.count, 0);
  
  const chartData = [
    ...top5.map(item => ({
      name: item.attackType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      value: item.count,
      attackType: item.attackType,
    })),
    ...(otherCount > 0 ? [{ name: "Other", value: otherCount, attackType: "OTHER" }] : []),
  ];

  const getColor = (attackType: string, index: number) => {
    return COLORS[attackType as keyof typeof COLORS] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.attackType, index)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(10, 20, 40, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            borderRadius: "8px",
            color: "#e5edff",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

