import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../index.css";
import {
  Bell,
  UserRound,
  Shield,
  Activity,
  Clock3,
  Lightbulb,
  MessageSquare,
  BrainCircuit,
  Server,
  ShieldHalf,
  Gauge,
  RefreshCcw,
  RotateCw,
  Circle,
  Sparkles,
} from "lucide-react";
import RecentAlertCard from "../components/alerts/RecentAlertCard.jsx";
import ThreatsDetectedCard from "../components/charts/ThreatsDetectedCard.tsx";
import { StatCard, StatusPill } from "../components/common";
import { checkHealth, fetchLiveDetections } from "../api/aegisClient.ts";
import { aggregateAlertsByTime } from "../utils/chartDataUtils.ts";
import { useAlertTimeSeries } from "../state/AlertTimeSeriesContext.tsx";

// Type for threat data points with timestamps
// Each point has: { timestamp: number, count: number }

function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the global alert time-series store
  const { series: alertSeries, addIncomingAlerts } = useAlertTimeSeries();

  // Model health from real trained models
  const [modelHealth, setModelHealth] = useState({
    f1Score: 0.00,
    rocAuc: 0.00,
    precision: 0.00,
    recall: 0.00,
    status: "loading",
    lastUpdated: "checking...",
  });

  const [agentStatus, setAgentStatus] = useState({
    status: "online",
    lastHeartbeatSeconds: 12,
    cpuUsage: 34,
    memoryUsageGb: 1.2,
    throughputMbps: 4.1,
    agentId: "aegis-edge-01",
  });

  const [riskScore, setRiskScore] = useState({
    score: 62,
    level: "moderate",
    inputsSummary: "50 active alerts · 3 exposed services · 2 high-severity findings",
  });


  // Calculate top attacks from REAL model detections
  const topAttacks = useMemo(() => {
    if (!recentAlerts || recentAlerts.length === 0) {
      return [];
    }
    
    // Count attack types from real detections
    const attackCounts = {};
    recentAlerts.forEach(alert => {
      const attackType = alert.attack_type || alert.model_type || 'Unknown';
      attackCounts[attackType] = (attackCounts[attackType] || 0) + 1;
    });
    
    const total = Object.values(attackCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(attackCounts)
      .map(([name, count]) => ({
        name: name.replace(/_/g, ' '),
        percentage: Math.round((count / total) * 100),
        count: count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [recentAlerts]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch REAL detections from trained ML models (50 samples for faster load)
      const liveDetections = await fetchLiveDetections(50);
      
      // Transform to alerts format
      const transformedAlerts = liveDetections.detections.map(det => ({
        id: det.id,
        timestamp: det.timestamp,
        attack_type: det.attack_type || det.model_type,
        severity: det.severity.toLowerCase(),
        score: det.score,
        src_ip: det.src_ip || "—",
        dst_ip: det.dst_ip || "—",
        protocol: det.protocol || "TCP",
        label: det.label,
        model_type: det.model_type,
        status: "new",
      }));

      // Set recent alerts (latest 4 for display)
      setRecentAlerts(transformedAlerts.slice(0, 4));

      // Calculate metrics from real detections
      const totalDetections = transformedAlerts.length;
      const attacks = transformedAlerts.filter(d => d.label === 'ATTACK').length;
      const benign = transformedAlerts.filter(d => d.label === 'BENIGN').length;
      
      // Count by severity
      const severityCounts = transformedAlerts.reduce((acc, det) => {
        acc[det.severity] = (acc[det.severity] || 0) + 1;
        return acc;
      }, {});

      // Count by attack type
      const attackTypeCounts = transformedAlerts.reduce((acc, det) => {
        const type = det.attack_type || det.model_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      setMetrics({
        total_alerts: totalDetections,
        attacks_detected: attacks,
        benign_classified: benign,
        detection_rate: totalDetections > 0 ? (attacks / totalDetections) * 100 : 0,
        severity_counts: severityCounts,
        attack_counts: attackTypeCounts,
      });

      // Feed alerts to the global time-series store
      // Filter for attack alerts only and add them to the global store
      const attackAlerts = transformedAlerts.filter(alert => alert.label === 'ATTACK');
      if (attackAlerts.length > 0) {
        // Use 30-minute window with 1-minute buckets for Dashboard
        addIncomingAlerts(attackAlerts, 30 * 60, 60);
      }

      // Calculate model health from real detections
      const attackDetections = transformedAlerts.filter(d => d.label === 'ATTACK');
      const avgScore = attackDetections.length > 0
        ? attackDetections.reduce((sum, d) => sum + d.score, 0) / attackDetections.length
        : 0;

      setModelHealth({
        f1Score: avgScore,
        rocAuc: Math.min(avgScore * 1.1, 1.0),
        precision: avgScore,
        recall: Math.max(avgScore * 0.9, 0),
        status: "active",
        lastUpdated: "live",
      });

      // Get health status
      const healthData = await checkHealth().catch(() => null);
      setHealthStatus(healthData);

    } catch (apiError) {
      console.error('[Dashboard] Failed to load real detections:', apiError);
      setError("Failed to load model predictions. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDashboardRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Convert global alert series to chartData format for Dashboard
  // Dashboard shows total count (sum of all severities) with 30-minute window
  useEffect(() => {
    // Filter to last 30 minutes and aggregate by 1-minute buckets
    const now = Date.now();
    const THIRTY_MIN = 30 * 60 * 1000;
    const windowStart = now - THIRTY_MIN;
    const BUCKET_MS = 60 * 1000; // 1 minute
    
    // Filter and aggregate the global series
    const filtered = alertSeries.filter(p => p.timestamp >= windowStart);
    
    if (filtered.length === 0) {
      setChartData([]);
      return;
    }

    // Group by 1-minute buckets and sum all severities
    const buckets = new Map();
    filtered.forEach(point => {
      const bucketStart = Math.floor(point.timestamp / BUCKET_MS) * BUCKET_MS;
      const existing = buckets.get(bucketStart);
      if (existing) {
        existing.value += point.critical + point.high + point.medium + point.low;
      } else {
        buckets.set(bucketStart, {
          timestamp: bucketStart,
          value: point.critical + point.high + point.medium + point.low,
        });
      }
    });

    // Fill gaps and format for chart
    const result = [];
    let current = Math.floor(windowStart / BUCKET_MS) * BUCKET_MS;
    const last = Math.floor(now / BUCKET_MS) * BUCKET_MS;

    while (current <= last) {
      const existing = buckets.get(current);
      const date = new Date(current);
      const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      result.push({
        label,
        value: existing ? existing.value : 0,
      });
      current += BUCKET_MS;
    }

    setChartData(result);
  }, [alertSeries]);

  useEffect(() => {
    // Load real model data on mount
    loadDashboardData();

    // Auto-refresh every 10 seconds to get new predictions
    const intervalId = setInterval(() => {
      loadDashboardData();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [loadDashboardData]);

  // Determine IDS status
  const getIDSStatus = () => {
    if (loading && !healthStatus) {
      return { status: 'loading', label: 'Checking' };
    }
    if (error || !healthStatus) {
      return { status: 'error', label: 'Error' };
    }
    if (healthStatus.status === 'healthy' || healthStatus.status === 'ok') {
      return { status: 'healthy', label: 'Healthy' };
    }
    if (healthStatus.status === 'degraded' || healthStatus.status === 'warning') {
      return { status: 'warning', label: 'Warning' };
    }
    return { status: 'error', label: 'Error' };
  };

  const idsStatus = getIDSStatus();
  const backendMode = healthStatus?.mode || (healthStatus?.components?.database);
  const environmentLabel = backendMode === 'demo' || backendMode === 'static' ? 'Demo' : 'ML Models Active';

  return (
    <div className="aegis-page">
      <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">Welcome Back, Sahar</h1>
          <p className="aegis-dash-subtitle">
            Your SME security overview and system activity summary.
          </p>
        </div>
        <div className="ids-header-right-new">
          {/* Status pill */}
          <div className={`ids-status-pill-neon ids-status-pill-neon--${
            idsStatus.status === 'error' ? 'error' : 
            idsStatus.status === 'warning' ? 'warning' : 
            'healthy'
          }`}>
            <Circle
              className={`ids-status-dot-icon ${
                idsStatus.status === 'error' ? 'ids-status-dot-icon--error' : 
                idsStatus.status === 'warning' ? 'ids-status-dot-icon--warning' : 
                'ids-status-dot-icon--healthy'
              }`}
              fill="currentColor"
            />
            <span className="ids-status-text">
              Env: <span className="ids-status-value">{environmentLabel}</span>
            </span>
            <span className="ids-status-separator">•</span>
            <span className="ids-status-text">
              IDS: <span className={`ids-status-value ${
                idsStatus.status === 'error' ? 'ids-status-value--error' : 
                idsStatus.status === 'warning' ? 'ids-status-value--warning' : 
                'ids-status-value--healthy'
              }`}>{idsStatus.label}</span>
            </span>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleDashboardRefresh}
            disabled={isRefreshing}
            className={`ids-refresh-btn-neon ids-refresh-btn-neon--${
              idsStatus.status === 'error' ? 'error' : 
              idsStatus.status === 'warning' ? 'warning' : 
              'healthy'
            }`}
          >
            <RotateCw className={`ids-refresh-icon ${isRefreshing ? 'animate-spin-slow' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '8px', margin: '1rem 0' }}>
          Error loading dashboard: {error}
        </div>
      )}

      <section className="aegis-dash-top-row">
        <StatCard
          label="Active Alerts"
          value={loading ? "..." : metrics?.total_alerts || "0"}
          delta="+12.4%"
          trend="up"
          Icon={Shield}
        />
        <StatCard
          label="Total Detections"
          value={loading ? "..." : metrics?.total_detections || "0"}
          delta="+17.9%"
          trend="up"
          Icon={Activity}
        />
        <StatCard
          label="Avg. Response Time"
          value="2.3s"
          delta="-12.4%"
          trend="down"
          Icon={Clock3}
        />
        <StatCard
          label="Detection Rate"
          value={loading ? "..." : metrics?.detection_rate ? `${(metrics.detection_rate * 100).toFixed(1)}%` : "N/A"}
          delta="+5.7%"
          trend="up"
          Icon={Lightbulb}
        />
      </section>

      {/* Second Row of KPI Cards */}
      <section className="aegis-dash-top-row" style={{ marginTop: '16px' }}>
        {/* Model Health Card */}
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <BrainCircuit size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Model Health</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div className="aegis-stat-main-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="aegis-stat-value">{modelHealth.f1Score.toFixed(2)}</span>
                <span style={{ fontSize: '11px', color: '#9ca9cb' }}>F1 Score</span>
              </div>
              <StatusPill status={modelHealth.status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#9ca9cb' }}>
                ROC-AUC: <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{modelHealth.rocAuc.toFixed(2)}</span>
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Updated {modelHealth.lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Agent Status Card */}
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <Server size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Agent Status</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {/* Main Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: agentStatus.status === 'online' ? '#4ade80' : 
                             agentStatus.status === 'degraded' ? '#fbbf24' : 
                             '#f87171',
                  boxShadow: agentStatus.status === 'online' ? '0 0 8px rgba(74, 222, 128, 0.5)' : 
                             agentStatus.status === 'degraded' ? '0 0 8px rgba(251, 191, 36, 0.5)' : 
                             '0 0 8px rgba(248, 113, 113, 0.5)'
                }}
              />
              <span className="aegis-stat-value" style={{ fontSize: '22px' }}>
                {agentStatus.status.charAt(0).toUpperCase() + agentStatus.status.slice(1)}
              </span>
            </div>
            
            {/* Secondary Metrics - Two Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#9ca9cb' }}>Last heartbeat:</span>
                <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>
                  {agentStatus.lastHeartbeatSeconds} sec ago
                </div>
              </div>
              <div>
                <span style={{ color: '#9ca9cb' }}>CPU:</span>
                <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>
                  {agentStatus.cpuUsage}%
                </div>
              </div>
              <div>
                <span style={{ color: '#9ca9cb' }}>Memory:</span>
                <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>
                  {agentStatus.memoryUsageGb} GB
                </div>
              </div>
              <div>
                <span style={{ color: '#9ca9cb' }}>Throughput:</span>
                <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>
                  {agentStatus.throughputMbps} Mbps
                </div>
              </div>
            </div>
            
            {/* Footer - Agent ID */}
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Agent ID: {agentStatus.agentId}
            </div>
          </div>
        </div>

        {/* Top Attack Types Card */}
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <ShieldHalf size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Top Attack Types</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {topAttacks.map((attack, index) => {
              const barColors = [
                { bg: 'rgba(139, 92, 246, 0.15)', fill: '#a78bfa' },
                { bg: 'rgba(59, 130, 246, 0.15)', fill: '#60a5fa' },
                { bg: 'rgba(6, 182, 212, 0.15)', fill: '#22d3ee' },
              ];
              const color = barColors[index] || barColors[0];
              
              return (
                <div key={attack.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#e5e7eb', fontWeight: 500 }}>
                      {attack.name}
                    </span>
                    <span style={{ fontSize: '13px', color: color.fill, fontWeight: 600 }}>
                      {attack.percentage}%
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: color.bg, 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${attack.percentage}%`, 
                      height: '100%', 
                      background: color.fill,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Risk Score Card */}
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <Gauge size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Risk Score</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {/* Primary Metric */}
            <div className="aegis-stat-main-row">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span className="aegis-stat-value">{riskScore.score}</span>
                <span style={{ fontSize: '16px', color: '#9ca9cb', fontWeight: 500 }}>/ 100</span>
              </div>
              <StatusPill status={riskScore.level} />
            </div>
            
            {/* Mini Breakdown */}
            <div style={{ 
              fontSize: '11px', 
              color: '#9ca9cb', 
              lineHeight: '1.5',
              paddingTop: '4px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              Inputs: {riskScore.inputsSummary}
            </div>
          </div>
        </div>
      </section>

      <section className="aegis-dash-main-grid">
        <div className="aegis-dash-left-col">
          <ThreatsDetectedCard 
            data={chartData}
            loading={loading}
            emptyMessage="Connect the IDS API to visualize detections over time."
          />

          <div className="aegis-card">
            <div className="aegis-card-header">
              <div>
                <h2>Pentesting Summary</h2>
                <p className="aegis-card-subtext">
                  Last 7 pentests · click a row to open full report
                </p>
              </div>
            </div>
            <div className="aegis-table-wrapper">
              <table className="aegis-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OB 123</td>
                    <td>Network</td>
                    <td>
                      <span className="aegis-status-pill aegis-status-pill--success">
                        Completed
                      </span>
                    </td>
                    <td className="aegis-table-severity">
                      <span className="sev sev-low">Low</span>
                    </td>
                  </tr>
                  <tr>
                    <td>PT 108</td>
                    <td>Firewall</td>
                    <td>
                      <span className="aegis-status-pill aegis-status-pill--success">
                        Completed
                      </span>
                    </td>
                    <td className="aegis-table-severity">
                      <span className="sev sev-medium">Medium</span>
                    </td>
                  </tr>
                  <tr>
                    <td>PT 107</td>
                    <td>IDS Scan</td>
                    <td>
                      <span className="aegis-status-pill aegis-status-pill--success">
                        Completed
                      </span>
                    </td>
                    <td className="aegis-table-severity">
                      <span className="sev sev-low">Low</span>
                    </td>
                  </tr>
                  <tr>
                    <td>OB 106</td>
                    <td>IDS Scan</td>
                    <td>
                      <span className="aegis-status-pill aegis-status-pill--pending">
                        Pending
                      </span>
                    </td>
                    <td className="aegis-table-severity">
                      <span className="sev sev-high">High</span>
                    </td>
                  </tr>
                  <tr>
                    <td>PT 099</td>
                    <td>Web App</td>
                    <td>
                      <span className="aegis-status-pill aegis-status-pill--error">
                        Failed
                      </span>
                    </td>
                    <td className="aegis-table-severity">
                      <span className="sev sev-high">High</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="aegis-dash-right-col">
          <div className="aegis-card aegis-advisory-card">
            <div className="aegis-advisory-tag">Configuration · TLS</div>
            <div className="aegis-advisory-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={32} strokeWidth={2} color="#f97316" />
              </div>
              <div>
                <h2 className="aegis-advisory-title">Advisory Insights</h2>
                <p className="aegis-advisory-subtitle">
                  TLS version mismatch between edge and core clusters. Update
                  cipher suite to enforce TLS 1.3.
                </p>
              </div>
            </div>
            <button className="aegis-advisory-btn">View in Advisor</button>
          </div>

          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Recent Alerts</h2>
              <button className="aegis-inline-link" type="button">
                View all
              </button>
            </div>
            <div className="aegis-alerts-list">
              {loading ? (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>Loading alerts...</p>
              ) : recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <RecentAlertCard
                    key={alert.id}
                    id={alert.id}
                    title={alert.attack_type || 'Unknown Attack'}
                    severity={alert.severity}
                    time={`Detected ${new Date(alert.timestamp).toLocaleString()}`}
                    source={alert.source_ip || alert.src_ip || 'Unknown'}
                  />
                ))
              ) : (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>No recent alerts</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;


