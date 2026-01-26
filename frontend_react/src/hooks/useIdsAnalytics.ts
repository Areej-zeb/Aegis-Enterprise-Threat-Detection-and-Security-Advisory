import { useMemo } from "react";
import { IdsAlert } from "../types/idsAlert";

export type AnalyticsSummary = {
  totalAlerts: number;
  totalDetections: number;           // alerts with non-benign label
  totalFlows: number;                // can be same as totalAlerts if flows==alerts
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  criticalSeverityCount: number;
  detectionRate: number | null;      // detections / totalAlerts, or null if not computable

  attackCounts: { attackType: string; count: number }[];
  severityCounts: { severity: string; count: number }[];

  // time series for last N minutes
  alertsOverTime: { bucketTs: string; total: number; critical: number; high: number; medium: number; low: number }[];

  // per-attack-type share per time bucket
  attackSeries: { bucketTs: string; [attackType: string]: number }[];

  // "top talkers" – hottest sources
  topSources: { sourceIp: string; total: number; critical: number; high: number; dominantAttackType: string }[];

  // optional: per-model counts
  modelCounts: { model: string; count: number }[];
};

type UseIdsAnalyticsOptions = {
  minutesWindow?: number;
  bucketSizeMinutes?: number;
};

/**
 * Normalize alert data to ensure consistent field names
 */
function normalizeAlert(alert: IdsAlert): IdsAlert {
  return {
    ...alert,
    attackType: alert.attackType || alert.label || "UNKNOWN",
    sourceIp: alert.sourceIp || alert.src_ip || alert.srcIp || alert.source_ip || "",
    destIp: alert.destIp || alert.dst_ip || alert.destIp || alert.destination_ip || "",
    severity: (alert.severity || "low").toLowerCase() as any,
    model: alert.model || alert.model_type || alert.sensor || "unknown",
  };
}

/**
 * Extract timestamp as milliseconds from alert
 */
function getAlertTimestamp(alert: IdsAlert): number {
  // Try to extract from ID first (format: attack_type_index_timestamp_random)
  if (alert.id && typeof alert.id === 'string' && alert.id.includes('_')) {
    const parts = alert.id.split('_');
    if (parts.length >= 3) {
      const ts = Number(parts[2]);
      // Timestamp should be reasonable Unix timestamp (between 2020 and 2100)
      if (!isNaN(ts) && ts > 1577836800 && ts < 4102444800) {
        return ts * 1000; // Convert to milliseconds
      }
    }
  }
  
  // Parse from timestamp field
  const timestamp = new Date(alert.timestamp).getTime();
  if (!isNaN(timestamp) && timestamp > 0) {
    return timestamp;
  }
  
  // Fallback to current time if invalid
  return Date.now();
}

export function useIdsAnalytics(
  alerts: IdsAlert[],
  options: UseIdsAnalyticsOptions = {}
): AnalyticsSummary {
  const { minutesWindow = 60, bucketSizeMinutes = 5 } = options;

  return useMemo(() => {
    const now = Date.now();
    const windowMs = minutesWindow * 60 * 1000;
    const windowStart = now - windowMs;
    const bucketMs = bucketSizeMinutes * 60 * 1000;

    // Normalize and filter alerts within time window
    const normalizedAlerts = alerts
      .map(normalizeAlert)
      .filter(alert => {
        const alertTime = getAlertTimestamp(alert);
        return alertTime >= windowStart && alertTime <= now;
      });

    // Basic counts
    const totalAlerts = normalizedAlerts.length;
    const totalDetections = normalizedAlerts.filter(a => 
      a.attackType && a.attackType.toUpperCase() !== "BENIGN"
    ).length;
    const totalFlows = totalAlerts; // Assuming flows == alerts for now

    // Severity counts
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    normalizedAlerts.forEach(alert => {
      const sev = alert.severity.toLowerCase();
      if (sev === 'critical') severityCounts.critical++;
      else if (sev === 'high') severityCounts.high++;
      else if (sev === 'medium') severityCounts.medium++;
      else severityCounts.low++;
    });

    // Attack type counts
    const attackCountsMap = new Map<string, number>();
    normalizedAlerts.forEach(alert => {
      const attackType = alert.attackType || "UNKNOWN";
      attackCountsMap.set(attackType, (attackCountsMap.get(attackType) || 0) + 1);
    });

    const attackCounts = Array.from(attackCountsMap.entries())
      .map(([attackType, count]) => ({ attackType, count }))
      .sort((a, b) => b.count - a.count);

    // Severity counts array
    const severityCountsArray = Object.entries(severityCounts)
      .map(([severity, count]) => ({ severity, count }))
      .sort((a, b) => b.count - a.count);

    // Detection rate
    const detectionRate = totalAlerts > 0 ? (totalDetections / totalAlerts) * 100 : null;

    // Time series: Alerts over time
    const timeBuckets = new Map<number, { total: number; critical: number; high: number; medium: number; low: number }>();
    
    // Initialize buckets
    let current = Math.floor(windowStart / bucketMs) * bucketMs;
    const last = Math.floor(now / bucketMs) * bucketMs;
    while (current <= last) {
      timeBuckets.set(current, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });
      current += bucketMs;
    }

    // Fill buckets with alert data
    normalizedAlerts.forEach(alert => {
      const alertTime = getAlertTimestamp(alert);
      const bucketStart = Math.floor(alertTime / bucketMs) * bucketMs;
      const bucket = timeBuckets.get(bucketStart);
      if (bucket) {
        bucket.total++;
        const sev = alert.severity.toLowerCase();
        if (sev === 'critical') bucket.critical++;
        else if (sev === 'high') bucket.high++;
        else if (sev === 'medium') bucket.medium++;
        else bucket.low++;
      }
    });

    const alertsOverTime = Array.from(timeBuckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, counts]) => ({
        bucketTs: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        ...counts,
      }));

    // Attack series: per-attack-type over time
    const attackBuckets = new Map<number, Map<string, number>>();
    current = Math.floor(windowStart / bucketMs) * bucketMs;
    while (current <= last) {
      attackBuckets.set(current, new Map());
      current += bucketMs;
    }

    normalizedAlerts.forEach(alert => {
      const alertTime = getAlertTimestamp(alert);
      const bucketStart = Math.floor(alertTime / bucketMs) * bucketMs;
      const bucket = attackBuckets.get(bucketStart);
      const attackType = alert.attackType || "UNKNOWN";
      if (bucket) {
        bucket.set(attackType, (bucket.get(attackType) || 0) + 1);
      }
    });

    const attackSeries = Array.from(attackBuckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, attackMap]) => {
        const result: { bucketTs: string; [attackType: string]: number } = {
          bucketTs: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
        };
        attackMap.forEach((count, attackType) => {
          result[attackType] = count;
        });
        return result;
      });

    // Top sources (top talkers)
    const sourceMap = new Map<string, { total: number; critical: number; high: number; attacks: Map<string, number> }>();
    
    normalizedAlerts.forEach(alert => {
      const sourceIp = alert.sourceIp || "";
      if (!sourceIp) return;

      if (!sourceMap.has(sourceIp)) {
        sourceMap.set(sourceIp, { total: 0, critical: 0, high: 0, attacks: new Map() });
      }
      
      const source = sourceMap.get(sourceIp)!;
      source.total++;
      
      const sev = alert.severity.toLowerCase();
      if (sev === 'critical') source.critical++;
      else if (sev === 'high') source.high++;
      
      const attackType = alert.attackType || "UNKNOWN";
      source.attacks.set(attackType, (source.attacks.get(attackType) || 0) + 1);
    });

    const topSources = Array.from(sourceMap.entries())
      .map(([sourceIp, data]) => {
        // Find dominant attack type
        let dominantAttackType = "Unknown";
        let maxCount = 0;
        data.attacks.forEach((count, attackType) => {
          if (count > maxCount) {
            maxCount = count;
            dominantAttackType = attackType;
          }
        });

        return {
          sourceIp,
          total: data.total,
          critical: data.critical,
          high: data.high,
          dominantAttackType,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    // Model counts
    const modelCountsMap = new Map<string, number>();
    normalizedAlerts.forEach(alert => {
      const model = alert.model || "unknown";
      modelCountsMap.set(model, (modelCountsMap.get(model) || 0) + 1);
    });

    const modelCounts = Array.from(modelCountsMap.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAlerts,
      totalDetections,
      totalFlows,
      highSeverityCount: severityCounts.high,
      mediumSeverityCount: severityCounts.medium,
      lowSeverityCount: severityCounts.low,
      criticalSeverityCount: severityCounts.critical,
      detectionRate,
      attackCounts,
      severityCounts: severityCountsArray,
      alertsOverTime,
      attackSeries,
      topSources,
      modelCounts,
    };
  }, [alerts, minutesWindow, bucketSizeMinutes]);
}

