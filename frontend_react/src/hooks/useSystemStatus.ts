/**
 * useSystemStatus Hook
 * Manages global system status including mock stream state
 * Provides consistent status across all components
 * 
 * IMPORTANT: Mock mode and ML models are ALWAYS opposite:
 * - Mock mode ON → ML models OFF (use fake data)
 * - Mock mode OFF → ML models ON (use real ML predictions)
 */

import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../api/aegisClient';

export interface SystemStatus {
  environment: 'ML Models' | 'Production';
  idsStatus: 'Healthy' | 'Warning' | 'Error' | 'Checking';
  isMockMode: boolean;  // Changed from mockStream to isMockMode for clarity
  mlModelsEnabled: boolean;  // Always opposite of isMockMode
  overallStatus: 'healthy' | 'warning' | 'error' | 'loading';
}

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    environment: 'ML Models',
    idsStatus: 'Checking',
    isMockMode: false,  // Default: mock mode OFF
    mlModelsEnabled: true,  // Default: ML models ON
    overallStatus: 'loading'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load mock mode state from localStorage
  const loadMockModeState = useCallback(() => {
    try {
      const enabled = localStorage.getItem("aegis_mock_mode_enabled") === "true";
      return enabled;
    } catch {
      return false;  // Default to mock mode OFF
    }
  }, []);

  // Check system health and update status
  const checkSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const healthData = await checkHealth();
      
      // Get current mock mode state
      const isMockMode = loadMockModeState();
      const mlModelsEnabled = !isMockMode;  // Always opposite

      // Determine environment
      const environment = isMockMode ? 'Production' : 'ML Models';

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

      setSystemStatus({
        environment,
        idsStatus,
        isMockMode,
        mlModelsEnabled,
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
  }, [loadMockModeState]);

  // Listen for mock mode toggle events
  useEffect(() => {
    const handleMockModeToggle = (event: CustomEvent) => {
      const isMockMode = event.detail?.enabled ?? false;
      const mlModelsEnabled = !isMockMode;  // Always opposite
      
      setSystemStatus(prev => ({
        ...prev,
        isMockMode,
        mlModelsEnabled
      }));
    };

    window.addEventListener('mockModeToggle', handleMockModeToggle as EventListener);
    
    return () => {
      window.removeEventListener('mockModeToggle', handleMockModeToggle as EventListener);
    };
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    checkSystemHealth();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  // Update mock mode state on mount
  useEffect(() => {
    const isMockMode = loadMockModeState();
    const mlModelsEnabled = !isMockMode;
    
    setSystemStatus(prev => ({
      ...prev,
      isMockMode,
      mlModelsEnabled
    }));
  }, [loadMockModeState]);

  return {
    systemStatus,
    loading,
    error,
    refresh: checkSystemHealth
  };
}