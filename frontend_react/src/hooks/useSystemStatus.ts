/**
 * useSystemStatus Hook
 * Manages global system status including mock stream state
 * Provides consistent status across all components
 */

import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../api/aegisClient';

export interface SystemStatus {
  environment: 'ML Models' | 'Production';
  idsStatus: 'Healthy' | 'Warning' | 'Error' | 'Checking';
  mockStream: 'ON' | 'OFF';
  overallStatus: 'healthy' | 'warning' | 'error' | 'loading';
}

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    environment: 'ML Models',
    idsStatus: 'Checking',
    mockStream: 'OFF',
    overallStatus: 'loading'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load mock stream state from localStorage
  const loadMockStreamState = useCallback(() => {
    try {
      const enabled = localStorage.getItem("aegis_mock_stream_enabled") === "true";
      return enabled ? 'ON' : 'OFF';
    } catch {
      return 'OFF';
    }
  }, []);

  // Check system health and update status
  const checkSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const healthData = await checkHealth();
      
      // Determine environment
      const backendMode = healthData?.mode || healthData?.components?.database;
      const environment = (backendMode === 'demo' || backendMode === 'static') ? 'ML Models' : 'Production';

      // Determine IDS status
      let idsStatus: SystemStatus['idsStatus'] = 'Healthy';
      let overallStatus: SystemStatus['overallStatus'] = 'healthy';

      if (!healthData) {
        idsStatus = 'Error';
        overallStatus = 'error';
      } else if (healthData.status === 'healthy' || healthData.status === 'ok') {
        idsStatus = 'Healthy';
        overallStatus = 'healthy';
      } else if (healthData.status === 'degraded' || healthData.status === 'warning') {
        idsStatus = 'Warning';
        overallStatus = 'warning';
      } else {
        idsStatus = 'Error';
        overallStatus = 'error';
      }

      // Get current mock stream state
      const mockStream = loadMockStreamState();

      setSystemStatus({
        environment,
        idsStatus,
        mockStream,
        overallStatus
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check system health');
      setSystemStatus(prev => ({
        ...prev,
        idsStatus: 'Error',
        overallStatus: 'error'
      }));
    } finally {
      setLoading(false);
    }
  }, [loadMockStreamState]);

  // Listen for mock stream toggle events
  useEffect(() => {
    const handleMockStreamToggle = (event: CustomEvent) => {
      const enabled = event.detail?.enabled ?? false;
      setSystemStatus(prev => ({
        ...prev,
        mockStream: enabled ? 'ON' : 'OFF'
      }));
    };

    window.addEventListener('mockStreamToggle', handleMockStreamToggle as EventListener);
    
    return () => {
      window.removeEventListener('mockStreamToggle', handleMockStreamToggle as EventListener);
    };
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    checkSystemHealth();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  // Update mock stream state on mount
  useEffect(() => {
    const mockStream = loadMockStreamState();
    setSystemStatus(prev => ({
      ...prev,
      mockStream
    }));
  }, [loadMockStreamState]);

  return {
    systemStatus,
    loading,
    error,
    refresh: checkSystemHealth
  };
}