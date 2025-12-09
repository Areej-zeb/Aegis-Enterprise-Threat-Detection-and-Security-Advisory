import React from 'react';
import { getStatusColor } from '../../utils/severityUtils';
import '../../index.css';

interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className = '' }: StatusPillProps) {
  const colors = getStatusColor(status);
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`aegis-stat-chip ${className}`}
      style={{
        background: colors.bg,
        color: colors.color,
      }}
    >
      {displayLabel}
    </span>
  );
}
