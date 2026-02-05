/**
 * StatusPill Component
 * Unified status display showing: Env: Demo • IDS: Healthy • Mock: ON/OFF
 * Reads from global system state and updates automatically
 */

import React from 'react';
import { Circle } from 'lucide-react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import '../../index.css';

interface StatusPillProps {
  className?: string;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function StatusPill({ 
  className = '', 
  showRefreshButton = false,
  onRefresh,
  isRefreshing = false
}: StatusPillProps) {
  const { systemStatus, loading } = useSystemStatus();

  if (loading) {
    return (
      <div className={`ids-status-pill-neon ids-status-pill-neon--loading ${className}`}>
        <Circle className="ids-status-dot-icon ids-status-dot-icon--loading animate-pulse" fill="currentColor" />
        <span className="ids-status-text">
          Env: <span className="ids-status-value">Checking</span>
        </span>
        <span className="ids-status-separator">•</span>
        <span className="ids-status-text">
          IDS: <span className="ids-status-value">Checking</span>
        </span>
        <span className="ids-status-separator">•</span>
        <span className="ids-status-text">
          Mock: <span className="ids-status-value">--</span>
        </span>
      </div>
    );
  }

  const statusClass = systemStatus.overallStatus === 'error' ? 'error' : 
                     systemStatus.overallStatus === 'warning' ? 'warning' : 
                     'healthy';

  const idsStatusClass = systemStatus.idsStatus === 'Error' ? 'ids-status-value--error' :
                         systemStatus.idsStatus === 'Warning' ? 'ids-status-value--warning' :
                         'ids-status-value--healthy';

  const mockStatusClass = systemStatus.mockStream === 'ON' ? 'ids-status-value--mock-on' : 'ids-status-value--mock-off';

  return (
    <div className={`ids-status-pill-neon ids-status-pill-neon--${statusClass} ${className}`}>
      <Circle
        className={`ids-status-dot-icon ids-status-dot-icon--${statusClass}`}
        fill="currentColor"
      />
      <span className="ids-status-text">
        Env: <span className="ids-status-value">{systemStatus.environment}</span>
      </span>
      <span className="ids-status-separator">•</span>
      <span className="ids-status-text">
        IDS: <span className={`ids-status-value ${idsStatusClass}`}>{systemStatus.idsStatus}</span>
      </span>
      <span className="ids-status-separator">•</span>
      <span className="ids-status-text">
        Mock: <span className={`ids-status-value ${mockStatusClass}`}>{systemStatus.mockStream}</span>
      </span>
    </div>
  );
}
