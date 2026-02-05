/**
 * MockAwareMetrics Component
 * Provides mock metrics data when system is in mock mode
 */

import React, { useMemo } from 'react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { generateMetricsOverview } from '../../utils/mockDataGenerator';

interface MockAwareMetricsProps {
  children: (metrics: any, loading: boolean, isMockMode: boolean) => React.ReactNode;
  realMetrics?: any;
  loading?: boolean;
}

export function MockAwareMetrics({ 
  children, 
  realMetrics, 
  loading = false 
}: MockAwareMetricsProps) {
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.mockStream === 'ON';
  
  // Generate mock metrics
  const mockMetrics = useMemo(() => {
    if (!isMockMode) return null;
    return generateMetricsOverview();
  }, [isMockMode]);
  
  // Use mock data if in mock mode and no real data
  const displayMetrics = useMemo(() => {
    if (realMetrics) return realMetrics;
    if (isMockMode && mockMetrics) return mockMetrics;
    return null;
  }, [realMetrics, isMockMode, mockMetrics]);
  
  return <>{children(displayMetrics, loading, isMockMode)}</>;
}

// Hook version for easier use
export function useMockAwareMetrics(realMetrics?: any, loading = false) {
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.mockStream === 'ON';
  
  const mockMetrics = useMemo(() => {
    if (!isMockMode) return null;
    return generateMetricsOverview();
  }, [isMockMode]);
  
  const displayMetrics = useMemo(() => {
    if (realMetrics) return realMetrics;
    if (isMockMode && mockMetrics) return mockMetrics;
    return null;
  }, [realMetrics, isMockMode, mockMetrics]);
  
  return {
    metrics: displayMetrics,
    loading,
    isMockMode
  };
}