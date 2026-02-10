import { useState, useEffect, useCallback } from 'react';

interface TimeRange {
  from: Date;
  to: Date;
  label: string;
}

interface AnalyticsData {
  summary: {
    total_alerts: number;
    detection_rate: number;
    high_critical_count: number;
    unique_sources: number;
    avg_confidence: number;
  };
  timeline: Array<{
    timestamp: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  }>;
  attack_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  severity_breakdown: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  top_talkers: Array<{
    ip: string;
    count: number;
    last_seen: string;
    threat_score: number;
  }>;
}

export const useAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: new Date(Date.now() - 60 * 60 * 1000),
    to: new Date(),
    label: 'last_1_hour',
  });

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    attackType?: string;
    severity?: string;
    ip?: string;
  }>({});

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        from_time: timeRange.from.toISOString(),
        to_time: timeRange.to.toISOString(),
      });

      const response = await fetch(`/api/analytics/summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const result = await response.json();
      if (result.status === 'success') {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const setTimeRangePreset = useCallback((preset: string) => {
    const now = new Date();
    let from: Date;

    switch (preset) {
      case 'last_15_min':
        from = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case 'last_1_hour':
        from = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'last_24_hours':
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last_7_days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 60 * 60 * 1000);
    }

    setTimeRange({
      from,
      to: now,
      label: preset,
    });
  }, []);

  const setCustomTimeRange = useCallback((from: Date, to: Date) => {
    setTimeRange({
      from,
      to,
      label: 'custom',
    });
  }, []);

  const addFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key as keyof typeof newFilters];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const getFilteredData = useCallback(() => {
    if (!data) return null;

    let filteredTimeline = data.timeline;
    let filteredAttackTypes = data.attack_types;
    let filteredTopTalkers = data.top_talkers;

    if (filters.attackType) {
      filteredAttackTypes = filteredAttackTypes.filter(
        (a) => a.type === filters.attackType
      );
    }

    if (filters.ip) {
      filteredTopTalkers = filteredTopTalkers.filter(
        (t) => t.ip === filters.ip
      );
    }

    return {
      ...data,
      timeline: filteredTimeline,
      attack_types: filteredAttackTypes,
      top_talkers: filteredTopTalkers,
    };
  }, [data, filters]);

  return {
    timeRange,
    setTimeRangePreset,
    setCustomTimeRange,
    data: getFilteredData(),
    loading,
    error,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    refetch: fetchAnalytics,
  };
};
