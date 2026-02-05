// src/utils/mockIdsStream.ts
// Mock IDS streaming engine for simulating live threat detection

import type { Alert, MetricsOverview } from '../api/aegisClient';

// Helper functions for realistic randomization
function randInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(randInRange(min, max));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Attack types and their typical characteristics
const ATTACK_TYPES = [
  'DDoS_SYN',
  'DDoS_UDP',
  'BRUTE_FTP',
  'SCAN_PORT',
  'MITM_ARP',
  'DNS_Tunnel',
  'SQL_Injection',
  'XSS_Attack',
  'BENIGN',
];

const SEVERITIES: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const SOURCE_IPS = [
  '192.168.1.',
  '10.0.0.',
  '172.16.0.',
  '203.0.113.',
  '198.51.100.',
];

const DEST_IPS = [
  '10.0.0.',
  '192.168.1.',
  '172.16.0.',
];

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'ARP', 'DNS'];

// Generate a single mock alert
export function generateMockAlert(): Alert {
  const attackType = pickOne(ATTACK_TYPES);
  const severity = attackType === 'BENIGN' 
    ? 'LOW' 
    : pickOne(SEVERITIES);
  
  const srcIpPrefix = pickOne(SOURCE_IPS);
  const dstIpPrefix = pickOne(DEST_IPS);
  
  return {
    id: `alert-${Date.now()}-${randInt(1000, 9999)}`,
    timestamp: new Date().toISOString(),
    src_ip: `${srcIpPrefix}${randInt(1, 254)}`,
    dst_ip: `${dstIpPrefix}${randInt(1, 254)}`,
    attack_type: attackType,
    severity: severity as any,
    status: 'NEW' as any,
    score: attackType === 'BENIGN' ? randInRange(0.05, 0.3) : randInRange(0.6, 0.99),
    description: `Detected ${attackType.replace(/_/g, ' ')} activity`,
    tags: ['mock', 'simulated'],
    meta: {
      protocol: pickOne(PROTOCOLS),
      src_port: randInt(1024, 65535),
      dst_port: pickOne([22, 80, 443, 53, 3389, 8080]),
      pkt_rate: randInRange(1, 20000),
      byte_rate: randInRange(500, 10000000),
    },
  };
}

// Generate multiple mock alerts
export function generateMockAlerts(count: number): Alert[] {
  return Array.from({ length: count }, () => generateMockAlert());
}

// Generate mock metrics overview
export function generateMockOverviewMetrics(): MetricsOverview {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const totalAlerts = randInt(10, 50);
  
  // Generate attack counts
  const attackCounts: Record<string, number> = {};
  const numAttackTypes = randInt(3, 6);
  const selectedAttacks = [...ATTACK_TYPES]
    .sort(() => Math.random() - 0.5)
    .slice(0, numAttackTypes);
  
  selectedAttacks.forEach(attack => {
    attackCounts[attack] = randInt(1, Math.floor(totalAlerts / 2));
  });
  
  // Generate severity counts
  const severityCounts = {
    low: randInt(0, Math.floor(totalAlerts * 0.3)),
    medium: randInt(0, Math.floor(totalAlerts * 0.4)),
    high: randInt(0, Math.floor(totalAlerts * 0.2)),
    critical: randInt(0, Math.floor(totalAlerts * 0.1)),
  };
  
  // Normalize to match total
  const severityTotal = Object.values(severityCounts).reduce((a, b) => a + b, 0);
  if (severityTotal > 0) {
    const ratio = totalAlerts / severityTotal;
    Object.keys(severityCounts).forEach(key => {
      severityCounts[key as keyof typeof severityCounts] = 
        Math.floor(severityCounts[key as keyof typeof severityCounts] * ratio);
    });
  }
  
  return {
    time_range: {
      from: fiveMinAgo.toISOString(),
      to: now.toISOString(),
    },
    total_flows: randInt(1000, 5000),
    total_alerts: totalAlerts,
    attack_counts: attackCounts,
    severity_counts: severityCounts,
    last_updated: now.toISOString(),
  };
}

// Perturb existing metrics (for smooth updates)
export function perturbMetrics(current: MetricsOverview): MetricsOverview {
  const totalAlerts = Math.max(0, current.total_alerts + randInt(-3, 5));
  
  // Slightly adjust attack counts
  const attackCounts: Record<string, number> = {};
  Object.entries(current.attack_counts).forEach(([attack, count]) => {
    const newCount = Math.max(0, count + randInt(-2, 3));
    if (newCount > 0) {
      attackCounts[attack] = newCount;
    }
  });
  
  // Maybe add a new attack type
  if (Math.random() > 0.7 && Object.keys(attackCounts).length < 6) {
    const newAttack = pickOne(ATTACK_TYPES.filter(a => !attackCounts[a]));
    attackCounts[newAttack] = randInt(1, 3);
  }
  
  // Adjust severity counts
  const severityCounts = {
    low: Math.max(0, current.severity_counts.low + randInt(-2, 2)),
    medium: Math.max(0, current.severity_counts.medium + randInt(-2, 3)),
    high: Math.max(0, current.severity_counts.high + randInt(-1, 2)),
    critical: Math.max(0, current.severity_counts.critical + randInt(-1, 1)),
  };
  
  return {
    ...current,
    total_alerts: totalAlerts,
    total_flows: Math.max(0, current.total_flows + randInt(-100, 200)),
    attack_counts: attackCounts,
    severity_counts: severityCounts,
    last_updated: new Date().toISOString(),
  };
}

// Generate mock model health metrics
export function generateMockModelHealth() {
  return {
    f1Score: randInRange(0.75, 0.92),
    rocAuc: randInRange(0.82, 0.96),
    precision: randInRange(0.78, 0.94),
    recall: randInRange(0.72, 0.90),
    status: pickOne(['stable', 'training', 'optimal']),
    lastUpdated: new Date().toISOString(),
  };
}

// Generate mock agent status
export function generateMockAgentStatus() {
  return {
    status: pickOne(['online', 'active', 'monitoring']),
    lastHeartbeatSeconds: randInt(1, 30),
    cpuUsage: randInt(20, 60),
    memoryUsageGb: randInRange(0.8, 2.5),
    throughputMbps: randInRange(2.0, 8.0),
    agentId: `aegis-edge-${randInt(1, 5).toString().padStart(2, '0')}`,
  };
}

// Generate mock risk score
export function generateMockRiskScore() {
  const score = randInt(30, 85);
  let level: 'low' | 'moderate' | 'high' | 'critical';
  
  if (score < 40) level = 'low';
  else if (score < 60) level = 'moderate';
  else if (score < 80) level = 'high';
  else level = 'critical';
  
  return {
    score,
    level,
    inputsSummary: `${randInt(10, 80)} active alerts · ${randInt(1, 5)} exposed services · ${randInt(0, 4)} high-severity findings`,
  };
}

// Simple mock stream factory that emits alerts and metrics on intervals.
export function createMockStream({ alertIntervalMs = 1500, metricsIntervalMs = 5000 } = {}) {
  let alertTimer: NodeJS.Timeout | null = null;
  let metricsTimer: NodeJS.Timeout | null = null;

  const alertListeners = new Set<(a: Alert) => void>();
  const metricsListeners = new Set<(m: MetricsOverview) => void>();

  function start() {
    if (!alertTimer) {
      alertTimer = setInterval(() => {
        const alert = generateMockAlert();
        alertListeners.forEach(cb => {
          try { cb(alert); } catch (e) { /* swallow listener errors */ }
        });
      }, alertIntervalMs);
    }

    if (!metricsTimer) {
      // emit an initial metrics snapshot immediately
      const initial = generateMockOverviewMetrics();
      metricsListeners.forEach(cb => { try { cb(initial); } catch (e) {} });

      metricsTimer = setInterval(() => {
        // perturb metrics to simulate smooth changes
        const perturbed = perturbMetrics(metricsListeners.size ? generateMockOverviewMetrics() : generateMockOverviewMetrics());
        metricsListeners.forEach(cb => { try { cb(perturbed); } catch (e) {} });
      }, metricsIntervalMs);
    }
  }

  function stop() {
    if (alertTimer) { clearInterval(alertTimer); alertTimer = null; }
    if (metricsTimer) { clearInterval(metricsTimer); metricsTimer = null; }
  }

  function onAlert(cb: (a: Alert) => void) { alertListeners.add(cb); }
  function offAlert(cb: (a: Alert) => void) { alertListeners.delete(cb); }

  function onMetrics(cb: (m: MetricsOverview) => void) { metricsListeners.add(cb); }
  function offMetrics(cb: (m: MetricsOverview) => void) { metricsListeners.delete(cb); }

  return { start, stop, onAlert, offAlert, onMetrics, offMetrics };
}
