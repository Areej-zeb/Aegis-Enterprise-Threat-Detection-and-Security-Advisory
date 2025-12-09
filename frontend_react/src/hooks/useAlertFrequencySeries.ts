import { useState, useCallback } from 'react';

// Alert point with severity breakdown
export interface AlertFrequencyPoint {
  timestamp: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// Alert input type
export interface AlertInput {
  timestamp: string | Date;
  severity: string;
}

/**
 * Reusable hook for accumulating alert frequency data over time
 * with sliding time window and gap filling
 */
export function useAlertFrequencySeries(
  timeWindowSeconds: number = 60,
  bucketSizeSeconds: number = 10
) {
  const [series, setSeries] = useState<AlertFrequencyPoint[]>([]);

  /**
   * Normalize incoming alerts into bucketed frequency points
   */
  const normalizeIncomingData = useCallback((alerts: AlertInput[]): AlertFrequencyPoint[] => {
    const bucketSize = bucketSizeSeconds * 1000; // Convert to milliseconds
    const buckets = new Map<number, AlertFrequencyPoint>();

    alerts.forEach(alert => {
      const alertTime = new Date(alert.timestamp).getTime();
      // Align to bucket boundary
      const bucketStart = Math.floor(alertTime / bucketSize) * bucketSize;
      
      const existing = buckets.get(bucketStart);
      if (existing) {
        const severity = alert.severity.toLowerCase();
        if (severity === 'critical') {
          existing.critical++;
        } else if (severity === 'high') {
          existing.high++;
        } else if (severity === 'medium') {
          existing.medium++;
        } else {
          existing.low++;
        }
      } else {
        const severity = alert.severity.toLowerCase();
        buckets.set(bucketStart, {
          timestamp: bucketStart,
          critical: severity === 'critical' ? 1 : 0,
          high: severity === 'high' ? 1 : 0,
          medium: severity === 'medium' ? 1 : 0,
          low: severity === 'low' ? 1 : 0,
        });
      }
    });

    return Array.from(buckets.values());
  }, [bucketSizeSeconds]);

  /**
   * Fill missing buckets with zero counts
   * Fills the entire time window from windowStart to now
   */
  const fillMissingBuckets = useCallback((
    points: AlertFrequencyPoint[],
    bucketMs: number,
    windowStart: number,
    now: number
  ): AlertFrequencyPoint[] => {
    if (!points.length) {
      // If no points at all, return empty array to show empty state
      return [];
    }

    const result: AlertFrequencyPoint[] = [];
    // Start from window start, aligned to bucket boundary
    let current = Math.floor(windowStart / bucketMs) * bucketMs;
    const last = Math.floor(now / bucketMs) * bucketMs; // Align end to bucket boundary

    const byTime = new Map<number, AlertFrequencyPoint>();
    for (const p of points) {
      // Align timestamp to bucket boundary
      const alignedTimestamp = Math.floor(p.timestamp / bucketMs) * bucketMs;
      byTime.set(alignedTimestamp, { ...p, timestamp: alignedTimestamp });
    }

    while (current <= last) {
      const existing = byTime.get(current);
      result.push(
        existing ?? { timestamp: current, critical: 0, high: 0, medium: 0, low: 0 }
      );
      current += bucketMs;
    }

    return result;
  }, []);

  /**
   * Update series with new alert data from API
   */
  const updateFromApi = useCallback((alerts: AlertInput[]) => {
    setSeries(prev => {
      const incomingPoints = normalizeIncomingData(alerts);
      
      // Merge previous and incoming data by timestamp
      const byTime = new Map<number, AlertFrequencyPoint>();

      // Add previous points
      for (const p of prev) {
        byTime.set(p.timestamp, p);
      }

      // Merge incoming points (sum counts if timestamp exists, otherwise add new)
      for (const p of incomingPoints) {
        const existing = byTime.get(p.timestamp);
        if (existing) {
          // Sum counts to accumulate all alerts in this bucket
          byTime.set(p.timestamp, {
            timestamp: existing.timestamp,
            critical: existing.critical + p.critical,
            high: existing.high + p.high,
            medium: existing.medium + p.medium,
            low: existing.low + p.low,
          });
        } else {
          byTime.set(p.timestamp, p);
        }
      }

      // Convert back to array and sort by timestamp
      let merged = Array.from(byTime.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Apply sliding time window
      const now = Date.now();
      const windowMs = timeWindowSeconds * 1000;
      const windowStart = now - windowMs;
      merged = merged.filter(p => p.timestamp >= windowStart);

      // Fill gaps with zero-count buckets
      const bucketMs = bucketSizeSeconds * 1000;
      const filled = fillMissingBuckets(merged, bucketMs, windowStart, now);

      return filled;
    });
  }, [normalizeIncomingData, fillMissingBuckets, timeWindowSeconds, bucketSizeSeconds]);

  /**
   * Format series for chart display (convert timestamps to time labels)
   */
  const getChartData = useCallback(() => {
    return series.map(point => {
      const date = new Date(point.timestamp);
      const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return {
        time,
        critical: point.critical,
        high: point.high,
        medium: point.medium,
        low: point.low,
      };
    });
  }, [series]);

  return {
    series,
    chartData: getChartData(),
    updateFromApi,
  };
}

