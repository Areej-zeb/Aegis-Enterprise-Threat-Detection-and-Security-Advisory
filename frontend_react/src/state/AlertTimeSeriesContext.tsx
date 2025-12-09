import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  id?: string;
}

interface AlertTimeSeriesContextType {
  series: AlertFrequencyPoint[];
  chartData: Array<{
    time: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  addIncomingAlerts: (alerts: AlertInput[], timeWindowSeconds?: number, bucketSizeSeconds?: number) => void;
  clearSeries: () => void;
}

const AlertTimeSeriesContext = createContext<AlertTimeSeriesContextType | undefined>(undefined);

/**
 * Global alert time-series provider
 * Maintains accumulated alert frequency data across the entire app
 */
export function AlertTimeSeriesProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<AlertFrequencyPoint[]>([]);

  /**
   * Normalize incoming alerts into bucketed frequency points
   */
  const normalizeIncomingData = useCallback((alerts: AlertInput[], bucketSizeSeconds: number): AlertFrequencyPoint[] => {
    const bucketSize = bucketSizeSeconds * 1000; // Convert to milliseconds
    const buckets = new Map<number, AlertFrequencyPoint>();

    alerts.forEach(alert => {
      let alertTime: number;
      
      // Try to extract timestamp from alert ID if it's in format attack_type_index_timestamp_random
      // Example: "Syn_1806_1765311632_6" -> timestamp is at index 2
      if (alert.id && typeof alert.id === 'string' && alert.id.includes('_')) {
        const parts = alert.id.split('_');
        // Check if we have at least 3 parts and the third part looks like a timestamp
        if (parts.length >= 3) {
          const ts = Number(parts[2]);
          // Timestamp should be a reasonable Unix timestamp (between 2020 and 2100)
          if (!isNaN(ts) && ts > 1577836800 && ts < 4102444800) {
            alertTime = ts * 1000; // Convert to milliseconds
          } else {
            // Try parsing from timestamp field
            alertTime = new Date(alert.timestamp).getTime();
          }
        } else {
          alertTime = new Date(alert.timestamp).getTime();
        }
      } else {
        // Parse from timestamp field (ISO string or Date object)
        alertTime = new Date(alert.timestamp).getTime();
      }
      
      // Validate timestamp
      if (isNaN(alertTime) || alertTime <= 0) {
        console.warn('[AlertTimeSeries] Invalid timestamp for alert:', alert.id, alert.timestamp);
        return; // Skip this alert
      }

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
  }, []);

  /**
   * Fill missing buckets with zero counts
   */
  const fillMissingBuckets = useCallback((
    points: AlertFrequencyPoint[],
    bucketMs: number,
    windowStart: number,
    now: number
  ): AlertFrequencyPoint[] => {
    if (!points.length) {
      return [];
    }

    const result: AlertFrequencyPoint[] = [];
    let current = Math.floor(windowStart / bucketMs) * bucketMs;
    const last = Math.floor(now / bucketMs) * bucketMs;

    const byTime = new Map<number, AlertFrequencyPoint>();
    for (const p of points) {
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
   * Add incoming alerts to the global time series
   */
  const addIncomingAlerts = useCallback((
    alerts: AlertInput[],
    timeWindowSeconds: number = 60,
    bucketSizeSeconds: number = 10
  ) => {
    if (!alerts || alerts.length === 0) return;

    setSeries(prev => {
      const incomingPoints = normalizeIncomingData(alerts, bucketSizeSeconds);
      
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
  }, [normalizeIncomingData, fillMissingBuckets]);

  /**
   * Format series for chart display
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

  const clearSeries = useCallback(() => {
    setSeries([]);
  }, []);

  return (
    <AlertTimeSeriesContext.Provider
      value={{
        series,
        chartData: getChartData(),
        addIncomingAlerts,
        clearSeries,
      }}
    >
      {children}
    </AlertTimeSeriesContext.Provider>
  );
}

/**
 * Hook to access the global alert time-series store
 */
export function useAlertTimeSeries() {
  const context = useContext(AlertTimeSeriesContext);
  if (context === undefined) {
    throw new Error('useAlertTimeSeries must be used within an AlertTimeSeriesProvider');
  }
  return context;
}

