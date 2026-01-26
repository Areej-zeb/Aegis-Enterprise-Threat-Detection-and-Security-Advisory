import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  emphasis?: "normal" | "primary" | "danger" | "warning";
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtext, emphasis = "normal" }) => {
  const emphasisStyles = {
    normal: "text-slate-300",
    primary: "text-cyan-400",
    danger: "text-pink-400",
    warning: "text-amber-400",
  };

  return (
    <div className="aegis-card" style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "0.5rem" }}>
        <div className="aegis-card-subtitle" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
          {label}
        </div>
        <div
          className={emphasisStyles[emphasis]}
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            lineHeight: "1.2",
          }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {subtext && (
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

interface IdsAnalyticsKpiRowProps {
  totalAlerts: number;
  detectionRate: number | null;
  highCriticalCount: number;
  uniqueSources: number;
}

export const IdsAnalyticsKpiRow: React.FC<IdsAnalyticsKpiRowProps> = ({
  totalAlerts,
  detectionRate,
  highCriticalCount,
  uniqueSources,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <KpiCard
        label="Total Alerts"
        value={totalAlerts}
        subtext="In selected time window"
        emphasis="normal"
      />
      <KpiCard
        label="Detection Rate"
        value={detectionRate !== null ? `${detectionRate.toFixed(1)}%` : "N/A"}
        subtext="Non-benign alerts"
        emphasis="primary"
      />
      <KpiCard
        label="High + Critical"
        value={highCriticalCount}
        subtext="High priority alerts"
        emphasis="danger"
      />
      <KpiCard
        label="Unique Sources"
        value={uniqueSources}
        subtext="Distinct source IPs"
        emphasis="normal"
      />
    </div>
  );
};

