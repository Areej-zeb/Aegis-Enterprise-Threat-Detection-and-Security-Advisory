import React from "react";

export type TimeRange = "15m" | "1h" | "24h";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const options: { value: TimeRange; label: string }[] = [
    { value: "15m", label: "Last 15 min" },
    { value: "1h", label: "Last 1 hour" },
    { value: "24h", label: "Last 24 hours" },
  ];

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.875rem", color: "#94a3b8", marginRight: "0.5rem" }}>
        Time Range:
      </span>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.875rem",
            borderRadius: "0.375rem",
            border: "1px solid",
            borderColor: value === option.value ? "#06b6d4" : "rgba(148, 163, 184, 0.3)",
            backgroundColor: value === option.value 
              ? "rgba(6, 182, 212, 0.1)" 
              : "transparent",
            color: value === option.value ? "#06b6d4" : "#94a3b8",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.borderColor = "#06b6d4";
              e.currentTarget.style.color = "#06b6d4";
            }
          }}
          onMouseLeave={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
              e.currentTarget.style.color = "#94a3b8";
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

