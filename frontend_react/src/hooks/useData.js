import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useData - small data-fetching hook with optional polling
 * @param {Function} fetcher async function that returns data
 * @param {Object} options { initialData, pollInterval (ms), deps }
 */
function useData(fetcher, { initialData = null, pollInterval = null, deps = [] } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    if (pollInterval) {
      timerRef.current = setInterval(() => {
        load();
      }, pollInterval);
    }

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, pollInterval]);

  return { data, loading, error, refresh: load };
}

export default useData;
