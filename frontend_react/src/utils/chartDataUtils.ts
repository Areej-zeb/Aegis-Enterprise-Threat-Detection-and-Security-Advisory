/**
 * Utility functions for chart data processing
 */

export interface TimeBucket {
  label: string;
  value: number;
  timestamp: number;
}

/**
 * Aggregate alerts into time buckets for time-series charts
 * @param alerts Array of alerts with timestamp property
 * @param windowMinutes Time window in minutes (default: 1440 = 24 hours)
 * @param bucketMinutes Size of each bucket in minutes (default: 5)
 * @returns Array of time buckets sorted by timestamp
 */
export function aggregateAlertsByTime(
  alerts: Array<{ timestamp: string | Date }>,
  windowMinutes: number = 1440, // 24 hours
  bucketMinutes: number = 5
): TimeBucket[] {
  if (!alerts || alerts.length === 0) {
    return [];
  }

  const now = Date.now();
  const windowStart = now - windowMinutes * 60 * 1000;
  
  // Create buckets
  const buckets: Map<number, number> = new Map();
  const bucketSize = bucketMinutes * 60 * 1000; // Convert to milliseconds

  alerts.forEach(alert => {
    const alertTime = new Date(alert.timestamp).getTime();
    
    // Only include alerts within the time window
    if (alertTime < windowStart || alertTime > now) {
      return;
    }

    // Calculate which bucket this alert belongs to
    const bucketStart = Math.floor((alertTime - windowStart) / bucketSize) * bucketSize + windowStart;
    
    // Increment count for this bucket
    buckets.set(bucketStart, (buckets.get(bucketStart) || 0) + 1);
  });

  // Convert to array and format labels
  const result: TimeBucket[] = Array.from(buckets.entries())
    .map(([timestamp, value]) => {
      const date = new Date(timestamp);
      // Format label based on bucket size
      let label: string;
      if (bucketMinutes < 60) {
        // For sub-hour buckets, show HH:MM
        label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (bucketMinutes < 1440) {
        // For hour-level buckets, show HH:00
        label = `${date.getHours().toString().padStart(2, '0')}:00`;
      } else {
        // For day-level buckets, show MM/DD
        label = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate()}`;
      }
      
      return {
        label,
        value,
        timestamp,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  return result;
}

/**
 * Format time bucket labels for display
 */
export function formatTimeLabel(timestamp: number, bucketMinutes: number): string {
  const date = new Date(timestamp);
  
  if (bucketMinutes < 60) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (bucketMinutes < 1440) {
    return `${date.getHours().toString().padStart(2, '0')}:00`;
  } else {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate()}`;
  }
}

