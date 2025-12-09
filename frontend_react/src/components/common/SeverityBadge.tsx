import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Skull } from 'lucide-react';
import { getSeverityColor } from '../../utils/severityUtils';
import '../../index.css';

interface SeverityBadgeProps {
  severity: string;
  withIcon?: boolean;
  className?: string;
}

export function SeverityBadge({ severity, withIcon = true, className = '' }: SeverityBadgeProps) {
  const colors = getSeverityColor(severity);
  const sev = severity.toLowerCase();
  
  const Icon = sev === 'critical' ? Skull :
               sev === 'high' ? AlertTriangle :
               sev === 'medium' ? AlertCircle :
               CheckCircle2;

  return (
    <span
      className={`ids-severity-pill ids-severity-${sev} ${className}`}
      style={{
        background: colors.bg,
        color: colors.color,
        borderColor: colors.border,
      }}
    >
      {withIcon && <Icon className="ids-severity-icon" />}
      <span style={{ textTransform: 'capitalize' }}>{severity}</span>
    </span>
  );
}
