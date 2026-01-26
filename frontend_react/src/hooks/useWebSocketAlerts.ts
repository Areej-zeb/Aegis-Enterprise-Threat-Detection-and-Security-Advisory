// src/hooks/useWebSocketAlerts.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Alert } from '../api/aegisClient';

const WS_BASE_URL = import.meta.env.VITE_AEGIS_WS_BASE_URL || 'ws://localhost:8000';

interface UseWebSocketAlertsOptions {
  enabled?: boolean;
  onAlert?: (alert: Alert) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketAlertsReturn {
  isConnected: boolean;
  lastAlert: Alert | null;
  error: string | null;
  reconnectAttempts: number;
  disconnect: () => void;
  connect: () => void;
}

/**
 * Custom hook for WebSocket connection to receive real-time alerts
 * from the Aegis IDS backend at ws://localhost:8000/ws/alerts
 */
export function useWebSocketAlerts(
  options: UseWebSocketAlertsOptions = {}
): UseWebSocketAlertsReturn {
  const {
    enabled = true,
    onAlert,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<Alert | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Use /ws/detection/live for real ML model predictions
      const wsUrl = `${WS_BASE_URL}/ws/detection/live`;
      console.log('[WebSocket] Connecting to ML detection stream:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data) as Alert;
          console.log('[WebSocket] Received alert:', alert);
          setLastAlert(alert);
          onAlert?.(alert);
        } catch (err) {
          console.error('[WebSocket] Failed to parse alert:', err);
          setError('Failed to parse alert data');
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
        onError?.(event);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection if enabled and within retry limits
        if (
          shouldReconnectRef.current &&
          enabled &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          console.log(
            `[WebSocket] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`
          );
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [enabled, onAlert, onError, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting');
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled) {
      shouldReconnectRef.current = true;
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastAlert,
    error,
    reconnectAttempts,
    disconnect,
    connect,
  };
}
