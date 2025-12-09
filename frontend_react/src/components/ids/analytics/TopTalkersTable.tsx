import React from "react";

interface TopTalker {
  sourceIp: string;
  total: number;
  critical: number;
  high: number;
  dominantAttackType: string;
}

interface TopTalkersTableProps {
  topSources: TopTalker[];
}

export const TopTalkersTable: React.FC<TopTalkersTableProps> = ({ topSources }) => {
  if (!topSources || topSources.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        <p>No source IP data available</p>
      </div>
    );
  }

  return (
    <div className="ids-table-wrapper">
      <table className="ids-table">
        <thead>
          <tr>
            <th>Source IP</th>
            <th>Total</th>
            <th>Critical</th>
            <th>High</th>
            <th>Dominant Attack</th>
          </tr>
        </thead>
        <tbody>
          {topSources.map((source, index) => (
            <tr key={source.sourceIp || index}>
              <td style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                {source.sourceIp || "—"}
              </td>
              <td style={{ fontWeight: "600" }}>{source.total}</td>
              <td>
                {source.critical > 0 ? (
                  <span style={{ color: "#ff3366", fontWeight: "600" }}>
                    {source.critical}
                  </span>
                ) : (
                  <span style={{ color: "#64748b" }}>0</span>
                )}
              </td>
              <td>
                {source.high > 0 ? (
                  <span style={{ color: "#ef4444", fontWeight: "600" }}>
                    {source.high}
                  </span>
                ) : (
                  <span style={{ color: "#64748b" }}>0</span>
                )}
              </td>
              <td style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                {source.dominantAttackType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

