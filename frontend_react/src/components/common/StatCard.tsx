import React, { ReactNode, useMemo } from 'react';
import { LucideIcon } from 'lucide-react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import '../../index.css';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  Icon: LucideIcon;
  children?: ReactNode;
  mockValue?: string | number;
  mockDelta?: string;
  loading?: boolean;
}

export function StatCard({ 
  label, 
  value, 
  delta, 
  trend = 'neutral', 
  Icon, 
  children,
  mockValue,
  mockDelta,
  loading = false
}: StatCardProps) {
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.mockStream === 'ON';
  
  // Generate mock data if not provided
  const generatedMockValue = useMemo(() => {
    if (mockValue !== undefined) return mockValue;
    
    // Generate realistic mock values based on label
    const labelLower = label.toLowerCase();
    if (labelLower.includes('alert')) return Math.floor(Math.random() * 50) + 10;
    if (labelLower.includes('detection')) return Math.floor(Math.random() * 200) + 100;
    if (labelLower.includes('rate')) return `${(Math.random() * 30 + 70).toFixed(1)}%`;
    if (labelLower.includes('time')) return `${(Math.random() * 2 + 1).toFixed(1)}s`;
    if (labelLower.includes('model')) return Math.floor(Math.random() * 10) + 5;
    if (labelLower.includes('score')) return (Math.random() * 4 + 6).toFixed(1);
    if (labelLower.includes('health')) return `${(Math.random() * 10 + 90).toFixed(1)}%`;
    
    return Math.floor(Math.random() * 100) + 50;
  }, [mockValue, label]);
  
  const generatedMockDelta = useMemo(() => {
    if (mockDelta !== undefined) return mockDelta;
    
    const isPositive = Math.random() > 0.4; // 60% chance of positive
    const deltaValue = (Math.random() * 20 + 1).toFixed(1);
    return `${isPositive ? '+' : '-'}${deltaValue}%`;
  }, [mockDelta]);
  
  // Use mock data when in mock mode and no real data
  const displayValue = useMemo(() => {
    if (loading) return "...";
    if (value !== undefined && value !== null && value !== "") return value;
    if (isMockMode) return generatedMockValue;
    return "N/A";
  }, [value, isMockMode, generatedMockValue, loading]);
  
  const displayDelta = useMemo(() => {
    if (loading) return undefined;
    if (delta) return delta;
    if (isMockMode && !delta) return generatedMockDelta;
    return undefined;
  }, [delta, isMockMode, generatedMockDelta, loading]);

  return (
    <div className="aegis-stat-card">
      <div className="aegis-stat-meta">
        <div className="aegis-stat-icon">
          <Icon size={18} strokeWidth={1.6} />
        </div>
        <span className="aegis-stat-label">
          {label}
          {isMockMode && displayValue !== "..." && displayValue !== "N/A" && (
            <span style={{ 
              fontSize: '9px', 
              color: '#64748b', 
              fontStyle: 'italic',
              marginLeft: '4px'
            }}>
              (mock)
            </span>
          )}
        </span>
      </div>
      {children || (
        <div className="aegis-stat-main-row">
          <span className="aegis-stat-value">{displayValue}</span>
          {displayDelta && (
            <span className={`aegis-stat-chip aegis-stat-chip--${trend}`}>{displayDelta}</span>
          )}
        </div>
      )}
    </div>
  );
}
