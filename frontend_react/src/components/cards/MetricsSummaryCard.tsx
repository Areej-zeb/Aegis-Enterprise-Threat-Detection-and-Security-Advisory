import React from "react";
import "./MetricsSummaryCard.css";

export type Metric = {
  id: string;
  label: string;
  value: string | number;
  emphasis?: "normal" | "primary" | "warning" | "danger";
};

export type MetricsSummaryCardProps = {
  title?: string;
  subtitle?: string;
  metrics: Metric[];
};

const MetricsSummaryCard: React.FC<MetricsSummaryCardProps> = ({
  title = "Metrics Summary",
  subtitle = "Overview of system activity",
  metrics,
}) => {
  const getValueClassName = (emphasis?: string) => {
    const baseClass = "metrics-card__value";
    if (!emphasis || emphasis === "normal") return baseClass;
    return `${baseClass} metrics-card__value--${emphasis}`;
  };

  return (
    <div className="metrics-card">
      <div className="metrics-card__header">
        <h2 className="metrics-card__title">{title}</h2>
        <p className="metrics-card__subtitle">{subtitle}</p>
      </div>

      <div className="metrics-card__grid">
        {metrics.map((metric) => (
          <div key={metric.id} className="metrics-card__tile">
            <p className="metrics-card__label">{metric.label}</p>
            <p className={getValueClassName(metric.emphasis)}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsSummaryCard;
