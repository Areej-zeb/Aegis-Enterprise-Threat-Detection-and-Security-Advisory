// Mock data generator for simulating threat detection data

export interface MockThreatData {
  month: string;
  value: number;
}

export interface MockAlert {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  attack_type: string;
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'acknowledged' | 'resolved';
  score: number;
  description: string;
}

const attackTypes = [
  'SYN Flood',
  'ARP MITM',
  'Brute Force',
  'DNS Exfiltration',
  'L7 Anomaly',
];

const severities: Array<'low' | 'medium' | 'high'> = [
  'low',
  'medium',
  'high',
];

// Generate random IP address
function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Generate threat data for the last 12 months
export function generateMonthlyThreats(): MockThreatData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.map((month, index) => {
    // Generate realistic threat counts with some variation
    const baseValue = 80 + Math.floor(Math.random() * 60);
    const trend = index <= currentMonth ? 1.2 : 1; // Higher values for current year
    const seasonalVariation = Math.sin(index / 2) * 20; // Seasonal pattern
    
    return {
      month,
      value: Math.floor(baseValue * trend + seasonalVariation),
    };
  });
}

// Generate recent alerts
export function generateRecentAlerts(count: number = 10): MockAlert[] {
  const alerts: MockAlert[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const hoursAgo = Math.floor(Math.random() * 48); // Last 48 hours
    const timestamp = new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();
    
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    
    alerts.push({
      id: `alert-${Date.now()}-${i}`,
      timestamp,
      src_ip: generateRandomIP(),
      dst_ip: generateRandomIP(),
      attack_type: attackType,
      severity,
      status: i < 3 ? 'new' : Math.random() > 0.5 ? 'acknowledged' : 'resolved',
      score: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      description: `Detected ${attackType} attempt from suspicious source`,
    });
  }
  
  // Sort by timestamp (newest first)
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Generate metrics overview
export function generateMetricsOverview() {
  const alerts = generateRecentAlerts(50);
  
  const severityCounts = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const attackCounts = alerts.reduce((acc, alert) => {
    acc[alert.attack_type] = (acc[alert.attack_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    time_range: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    total_flows: Math.floor(Math.random() * 10000) + 50000,
    total_alerts: alerts.length,
    total_detections: Math.floor(Math.random() * 500) + 1000,
    detection_rate: 0.85 + Math.random() * 0.1, // 85-95%
    attack_counts: attackCounts,
    severity_counts: severityCounts,
    last_updated: new Date().toISOString(),
  };
}

// Simulate real-time threat generation
export class ThreatSimulator {
  private interval: NodeJS.Timeout | null = null;
  private callbacks: Array<(alert: MockAlert) => void> = [];
  
  start(intervalMs: number = 5000) {
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      const newAlert = generateRecentAlerts(1)[0];
      this.callbacks.forEach(callback => callback(newAlert));
    }, intervalMs);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  onNewThreat(callback: (alert: MockAlert) => void) {
    this.callbacks.push(callback);
  }
  
  removeCallback(callback: (alert: MockAlert) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }
}
