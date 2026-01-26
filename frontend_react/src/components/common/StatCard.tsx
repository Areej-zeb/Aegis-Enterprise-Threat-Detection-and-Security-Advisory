import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import '../../index.css';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  Icon: LucideIcon;
  children?: ReactNode;
}

export function StatCard({ label, value, delta, trend = 'neutral', Icon, children }: StatCardProps) {
  return (
    <div className="aegis-stat-card">
      <div className="aegis-stat-meta">
        <div className="aegis-stat-icon">
          <Icon size={18} strokeWidth={1.6} />
        </div>
        <span className="aegis-stat-label">{label}</span>
      </div>
      {children || (
        <div className="aegis-stat-main-row">
          <span className="aegis-stat-value">{value}</span>
          {delta && (
            <span className={`aegis-stat-chip aegis-stat-chip--${trend}`}>{delta}</span>
          )}
        </div>
      )}
    </div>
  );
}
