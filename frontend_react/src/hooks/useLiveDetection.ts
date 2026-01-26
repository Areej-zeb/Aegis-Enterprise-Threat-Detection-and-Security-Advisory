// src/hooks/useLiveDetection.ts
// React hook for consuming live ML detection data

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Detection,
  DetectionMetrics,
  DetectionInfo,
  fetchLiveDetections,
  fetchDetectionMetrics,
  fetchDetectionInfo,
  connectLiveDetectionWebSocket
} from '../api/detectionClient';

interface UseLiveDetectionOptions {
  autoConnect?: boolean;
  maxAlerts?: number;
  attackType?: string;
}

interface UseLiveDetectionReturn {
  detections: Detection[];
  metrics: DetectionMetrics | null;
  systemInfo: DetectionInfo | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearDetections: () => void;
  refreshMetrics: () => Promise<void>;
  fetchBatchDetections: (count: number) => Promise<void>;
}

export function useLiveDetection(
  options: UseLiveDetectionOptions = {}
): UseLiveDetectionReturn {
  const { autoConnect = false, maxAlerts = 200, attackType } = options;
  
  const [detections, setDetections] = useState<Detection[]>([]);
  const [metrics, setMetrics] = useState<DetectionMetrics | null>(null);
  const [systemInfo, setSystemInfo] = useState<DetectionInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  
  // Fetch system info on mount
  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const info = await fetchDetectionInfo();
        setSystemInfo(info);
      } catch (err) {
        console.error("Failed to load system info:", err);
        setError(err instanceof Error ? err.message : "Failed to load system info");
      }
    };
    
    loadSystemInfo();
  }, []);
  
  // Refresh metrics periodically
  const refreshMetrics = useCallback(async () => {
    try {
      const metricsData = await fetchDetectionMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.error("Failed to refresh metrics:", err);
    }
  }, []);
  
  // Fetch batch detections
  const fetchBatchDetections = useCallback(async (count: number = 10) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchLiveDetections(count, attackType);
      
      setDetections(prev => {
        const newDetections = [...prev, ...response.detections];
        return newDetections.slice(-maxAlerts);
      });
      
      setMetrics(response.metrics);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch detections";
      setError(errorMsg);
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [attackType, maxAlerts]);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    setError(null);
    
    const ws = connectLiveDetectionWebSocket(
      (detection) => {
        setDetections(prev => {
          const newDetections = [...prev, detection];
          return newDetections.slice(-maxAlerts);
        });
        setIsConnected(true);
      },
      (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection error");
        setIsConnected(false);
      },
      () => {
        console.log("WebSocket closed");
        setIsConnected(false);
      }
    );
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
    };
    
    wsRef.current = ws;
  }, [maxAlerts]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  // Clear all detections
  const clearDetections = useCallback(() => {
    setDetections([]);
  }, []);
  
  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  
  // Refresh metrics periodically when connected
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      refreshMetrics();
    }, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, refreshMetrics]);
  
  return {
    detections,
    metrics,
    systemInfo,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    clearDetections,
    refreshMetrics,
    fetchBatchDetections
  };
}
