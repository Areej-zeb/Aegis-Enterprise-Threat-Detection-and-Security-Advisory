/**
 * useStreamingState - Manages streaming state consistently
 * Prevents multiple streams and handles button states properly
 */

import { useState, useCallback } from 'react';

export interface StreamingState {
  isStreaming: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionCount: number;
}

export interface UseStreamingStateReturn extends StreamingState {
  startStream: () => Promise<void>;
  stopStream: () => void;
  resetError: () => void;
}

export function useStreamingState(
  onStart?: () => Promise<void>,
  onStop?: () => void
): UseStreamingStateReturn {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    isConnecting: false,
    error: null,
    connectionCount: 0,
  });

  const startStream = useCallback(async () => {
    if (state.isStreaming || state.isConnecting) {
      return; // Prevent multiple streams
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      await onStart?.();
      setState(prev => ({
        ...prev,
        isStreaming: true,
        isConnecting: false,
        connectionCount: prev.connectionCount + 1,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to start stream',
      }));
    }
  }, [state.isStreaming, state.isConnecting, onStart]);

  const stopStream = useCallback(() => {
    onStop?.();
    setState(prev => ({
      ...prev,
      isStreaming: false,
      isConnecting: false,
      error: null,
    }));
  }, [onStop]);

  const resetError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    startStream,
    stopStream,
    resetError,
  };
}