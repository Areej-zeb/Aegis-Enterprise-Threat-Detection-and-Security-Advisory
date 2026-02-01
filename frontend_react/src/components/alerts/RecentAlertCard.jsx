import React from "react";
import { SeverityBadge } from "../common";
import "../../index.css";

function RecentAlertCard({ id, title, severity = "Medium", time, source, correlation }) {
  const sev = severity.toLowerCase().trim();

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

        {/* Smart Context / Correlation Hit */}
        {correlation && correlation.is_vulnerable && (
          <div style={{
            marginTop: '8px',
            padding: '6px 8px',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚠️ Target Vulnerable
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#fca5a5' }}>
              {correlation.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentAlertCard;


