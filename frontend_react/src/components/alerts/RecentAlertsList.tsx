/**
 * RecentAlertsList Component
 * Mock-aware component that shows recent alerts with fallback to mock data
 */

import React, { useMemo } from 'react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { generateRecentAlerts } from '../../utils/mockDataGenerator';
import RecentAlertCard from './RecentAlertCard';

interface RecentAlertsListProps {
  alerts?: any[];
  loading?: boolean;
  maxItems?: number;
  emptyMessage?: string;
}

export function RecentAlertsList({ 
  alerts, 
  loading = false, 
  maxItems = 5,
  emptyMessage = "No recent alerts"
}: RecentAlertsListProps) {
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.mockStream === 'ON';
  
  // Generate mock alerts when needed
  const mockAlerts = useMemo(() => {
    if (!isMockMode) return [];
    return generateRecentAlerts(maxItems);
  }, [isMockMode, maxItems]);
  
  // Use mock data if in mock mode and no real data
  const displayAlerts = useMemo(() => {
    if (alerts && alerts.length > 0) return alerts.slice(0, maxItems);
    if (isMockMode) return mockAlerts;
    return [];
  }, [alerts, isMockMode, mockAlerts, maxItems]);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i}
            style={{
              height: '60px',
              background: 'rgba(148, 163, 184, 0.1)',
              borderRadius: '8px',
              animation: 'pulse 2s infinite'
            }}
          />
        ))}
      </div>
    );
  }
  
  if (displayAlerts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#64748b',
        fontSize: '14px'
      }}>
        {isMockMode ? "Generating mock alerts..." : emptyMessage}
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {isMockMode && (
        <div style={{
          fontSize: '10px',
          color: '#64748b',
          fontStyle: 'italic',
          textAlign: 'right',
          marginBottom: '8px'
        }}>
          Mock Data
        </div>
      )}
      {displayAlerts.map((alert, index) => (
        <RecentAlertCard
          key={alert.id || `alert-${index}`}
          id={alert.id || `alert-${index}`}
          title={alert.description || alert.attack_type || 'Security Alert'}
          severity={alert.severity || 'medium'}
          time={alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
          source={alert.src_ip || 'Unknown'}
        />
      ))}
    </div>
  );
}