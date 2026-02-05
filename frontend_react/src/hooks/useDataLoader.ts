/**
 * useDataLoader Hook
 * Manages loading, error, and empty states for data fetching
 * Enforces consistent patterns across the app
 */

import { useState, useCallback, useEffect } from 'react';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface UseDataLoaderOptions<T> {
  onFetch: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseDataLoaderReturn<T> {
  data: T | null;
  state: LoadingState;
  error: Error | null;
  isLoading: boolean;
  isEmpty: boolean;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useDataLoader<T>({
  onFetch,
  onSuccess,
  onError,
}: UseDataLoaderOptions<T>): UseDataLoaderReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);

  const isEmpty = data === null || (Array.isArray(data) && data.length === 0);

  const fetchData = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const result = await onFetch();
      setData(result);
      setState('success');
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setState('error');
      onError?.(error);
    }
  }, [onFetch, onSuccess, onError]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(null);
    setState('idle');
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    state,
    error,
    isLoading: state === 'loading',
    isEmpty,
    refresh,
    reset,
  };
}
