// src/hooks/useMockIdsStream.ts
// React hook for mock IDS data streaming

import { useEffect, useRef } from 'react';
import {
  generateMockAlert,
  generateMockOverviewMetrics,
  perturbMetrics,
  generateMockModelHealth,
  generateMockAgentStatus,
  generateMockRiskScore,
} from '../utils/mockIdsStream';
import type { Alert, MetricsOverview } from '../api/aegisClient';

interface MockStreamCallbacks {
  onMetricsUpdate?: (metrics: MetricsOverview) => void;
  onNewAlert?: (alert: Alert) => void;
  onAlertsUpdate?: (alerts: Alert[]) => void;
  onModelHealthUpdate?: (health: any) => void;
  onAgentStatusUpdate?: (status: any) => void;
  onRiskScoreUpdate?: (risk: any) => void;
}

interface UseMockIdsStreamOptions {
  enabled: boolean;
  intervalMs?: number;
  callbacks: MockStreamCallbacks;
}

/**
 * Hook for simulating live IDS data streaming
 * 
 * When enabled, generates realistic mock data at regular intervals
 * and calls the provided callbacks with updated values.
 * 
 * @param options Configuration object
 * @param options.enabled Whether mock streaming is active
 * @param options.intervalMs Update interval in milliseconds (default: 4000)
 * @param options.callbacks Object containing callback functions for different data types
 */
export function useMockIdsStream({
  enabled,
  intervalMs = 4000,
  callbacks,
}: UseMockIdsStreamOptions) {
  const metricsRef = useRef<MetricsOverview | null>(null);
  const alertsRef = useRef<Alert[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset refs
      metricsRef.current = null;
      alertsRef.current = [];
      return;
    }

    // Initialize with fresh mock data
    if (!metricsRef.current) {
      metricsRef.current = generateMockOverviewMetrics();
      if (callbacks.onMetricsUpdate) {
        callbacks.onMetricsUpdate(metricsRef.current);
      }
    }

    // Start streaming interval
    intervalRef.current = setInterval(() => {
      // Update metrics (perturb existing values for smooth changes)
      if (metricsRef.current) {
        metricsRef.current = perturbMetrics(metricsRef.current);
        if (callbacks.onMetricsUpdate) {
          callbacks.onMetricsUpdate(metricsRef.current);
        }
      }

      // Generate new alert (30% chance per interval)
      if (Math.random() > 0.7) {
        const newAlert = generateMockAlert();
        alertsRef.current = [newAlert, ...alertsRef.current].slice(0, 20);
        
        if (callbacks.onNewAlert) {
          callbacks.onNewAlert(newAlert);
        }
        if (callbacks.onAlertsUpdate) {
          callbacks.onAlertsUpdate(alertsRef.current);
        }
      }

      // Update model health
      if (callbacks.onModelHealthUpdate) {
        callbacks.onModelHealthUpdate(generateMockModelHealth());
      }

      // Update agent status
      if (callbacks.onAgentStatusUpdate) {
        callbacks.onAgentStatusUpdate(generateMockAgentStatus());
      }

      // Update risk score
      if (callbacks.onRiskScoreUpdate) {
        callbacks.onRiskScoreUpdate(generateMockRiskScore());
      }
    }, intervalMs);

    // Cleanup on unmount or when enabled changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, callbacks]);

  return {
    isStreaming: enabled && intervalRef.current !== null,
  };
}
