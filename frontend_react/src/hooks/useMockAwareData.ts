/**
 * useMockAwareData Hook
 * Provides mock data when system is in mock mode, real data otherwise
 * Integrates with unified status system
 */

import { useState, useEffect, useCallback } from 'react';
import { useSystemStatus } from './useSystemStatus';
import { 
  generateRecentAlerts, 
  generateMetricsOverview, 
  generateMonthlyThreats,
  MockAlert 
} from '../utils/mockDataGenerator';

export interface MockAwareDataOptions {
  refreshInterval?: number;
  enableRealTime?: boolean;
}

export interface MockAwareDataReturn {
  // Data
  alerts: MockAlert[];
  metrics: any;
  threatTrends: any[];
  
  // State
  loading: boolean;
  error: string | null;
  isMockMode: boolean;
  
  // Actions
  refresh: () => void;
  clearError: () => void;
}

export function useMockAwareData(
  realDataFetcher?: () => Promise<any>,
  options: MockAwareDataOptions = {}
): MockAwareDataReturn {
  const { systemStatus } = useSystemStatus();
  const { refreshInterval = 30000, enableRealTime = false } = options;
  
  const [alerts, setAlerts] = useState<MockAlert[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [threatTrends, setThreatTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMockMode = systemStatus.mockStream === 'ON';
  
  // Generate mock data
  const generateMockData = useCallback(() => {
    const mockAlerts = generateRecentAlerts(20);
    const mockMetrics = generateMetricsOverview();
    const mockTrends = generateMonthlyThreats();
    
    setAlerts(mockAlerts);
    setMetrics(mockMetrics);
    setThreatTrends(mockTrends);
    setLoading(false);
    setError(null);
  }, []);
  
  // Fetch real data
  const fetchRealData = useCallback(async () => {
    if (!realDataFetcher) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await realDataFetcher();
      
      // Process real data based on structure
      if (data.alerts) setAlerts(data.alerts);
      if (data.metrics) setMetrics(data.metrics);
      if (data.trends) setThreatTrends(data.trends);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      // Fallback to mock data on error if in mock mode
      if (isMockMode) {
        generateMockData();
      }
    } finally {
      setLoading(false);
    }
  }, [realDataFetcher, isMockMode, generateMockData]);
  
  // Main refresh function
  const refresh = useCallback(() => {
    if (isMockMode) {
      generateMockData();
    } else {
      fetchRealData();
    }
  }, [isMockMode, generateMockData, fetchRealData]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Initial load and mode changes
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Auto-refresh interval
  useEffect(() => {
    if (!enableRealTime) return;
    
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval, enableRealTime]);
  
  // Real-time mock data updates
  useEffect(() => {
    if (!isMockMode || !enableRealTime) return;
    
    const interval = setInterval(() => {
      // Add new mock alert occasionally
      if (Math.random() > 0.7) {
        const newAlert = generateRecentAlerts(1)[0];
        setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      }
      
      // Update metrics occasionally
      if (Math.random() > 0.8) {
        setMetrics(generateMetricsOverview());
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isMockMode, enableRealTime]);
  
  return {
    alerts,
    metrics,
    threatTrends,
    loading,
    error,
    isMockMode,
    refresh,
    clearError,
  };
}