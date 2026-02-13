/**
 * MockAwareMetrics Component
 * Provides mock metrics data when system is in mock mode
 * 
 * IMPORTANT: Mock mode and ML models are ALWAYS opposite:
 * - Mock mode ON → Use fake/simulated data (ML models OFF)
 * - Mock mode OFF → Use real ML predictions (ML models ON)
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
  const isMockMode = systemStatus.isMockMode;
  const mlModelsEnabled = systemStatus.mlModelsEnabled;
  
  // Generate mock metrics only when mock mode is ON
  const mockMetrics = useMemo(() => {
    if (!isMockMode) return null;
    return generateMetricsOverview();
  }, [isMockMode]);
  
  // Use mock data if in mock mode, otherwise use real data
  const displayMetrics = useMemo(() => {
    if (isMockMode) {
      // Mock mode ON → Use fake data
      return mockMetrics;
    } else {
      // Mock mode OFF → Use real ML model data
      return realMetrics;
    }
  }, [realMetrics, isMockMode, mockMetrics]);
  
  return <>{children(displayMetrics, loading, isMockMode)}</>;
}

// Hook version for easier use
export function useMockAwareMetrics(realMetrics?: any, loading = false) {
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.isMockMode;
  const mlModelsEnabled = systemStatus.mlModelsEnabled;
  
  const mockMetrics = useMemo(() => {
    if (!isMockMode) return null;
    return generateMetricsOverview();
  }, [isMockMode]);
  
  const displayMetrics = useMemo(() => {
    if (isMockMode) {
      // Mock mode ON → Use fake data
      return mockMetrics;
    } else {
      // Mock mode OFF → Use real ML model data
      return realMetrics;
    }
  }, [realMetrics, isMockMode, mockMetrics]);
  
  return {
    metrics: displayMetrics,
    loading,
    isMockMode,
    mlModelsEnabled  // Always opposite of isMockMode
  };
}