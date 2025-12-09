import React from "react";
import { SeverityBadge } from "../common";
import "../../index.css";

function RecentAlertCard({ id, title, severity = "Medium", time, source }) {
  const sev = severity.toLowerCase();

  return (
    <div className={`aegis-alert-card aegis-alert-card--${sev}`}>
      <div className="aegis-alert-strip" />

      <div className="aegis-alert-main">
        <div className="aegis-alert-top-row">
          <span className="aegis-alert-id">{id}</span>
          <span className="aegis-alert-title">{title}</span>
        </div>

        <div className="aegis-alert-bottom-row">
          <span className="aegis-alert-meta">
            {time}
            {source ? ` • ${source}` : ""}
          </span>

          <SeverityBadge severity={severity} withIcon={false} />
        </div>
      </div>
    </div>
  );
}

export default RecentAlertCard;


