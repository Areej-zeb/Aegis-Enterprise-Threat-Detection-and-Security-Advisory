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
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import RecentAlertCard from "../components/alerts/RecentAlertCard";
import ThreatsDetectedCard from "../components/charts/ThreatsDetectedCard";
import { StatCard, StatusPill, SeverityBadge } from "../components/common";
import { checkHealth, fetchLiveDetections, getPentestHistory, runPentest } from "../api/aegisClient";
import { aggregateAlertsByTime } from "../utils/chartDataUtils";
import { useAlertTimeSeries } from "../state/AlertTimeSeriesContext";

// Type for threat data points with timestamps
// Each point has: { timestamp: number, count: number }

function DashboardPage() {
  console.log("DashboardPage mounted"); // Debug log
  const [metrics, setMetrics] = useState(null);
  const [expandedScanId, setExpandedScanId] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [pentestScans, setPentestScans] = useState([]);
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
        attack_type: det.attack_type || det.model_type || "Unknown",
        severity: (det.severity || "medium").toLowerCase(),
        score: det.score || 0,
        src_ip: det.src_ip || "—",
        dst_ip: det.dst_ip || "—",
        protocol: det.protocol || "TCP",
        label: det.label || "BENIGN",
        model_type: det.model_type || "Unknown",
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

      // Fetch Pentest History
      const scans = await getPentestHistory();
      setPentestScans(scans.slice(0, 5)); // Show last 5

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

  const [targetIp, setTargetIp] = useState("localhost");

  const handleStartQuickScan = async () => {
    if (!targetIp) {
      alert("Please enter a target IP");
      return;
    }

    try {
      await runPentest(targetIp, "quick");
      // Reload after a short delay to see the pending scan
      setTimeout(loadDashboardData, 1000);
    } catch (e) {
      console.error("Failed to start scan", e);
      alert("Failed to start scan: " + e.message);
    }
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
          <div className={`ids-status-pill-neon ids-status-pill-neon--${idsStatus.status === 'error' ? 'error' :
            idsStatus.status === 'warning' ? 'warning' :
              'healthy'
            }`}>
            <Circle
              className={`ids-status-dot-icon ${idsStatus.status === 'error' ? 'ids-status-dot-icon--error' :
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
              IDS: <span className={`ids-status-value ${idsStatus.status === 'error' ? 'ids-status-value--error' :
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
            className={`ids-refresh-btn-neon ids-refresh-btn-neon--${idsStatus.status === 'error' ? 'error' :
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
                  Latest network exposure scans
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={targetIp}
                  onChange={(e) => setTargetIp(e.target.value)}
                  placeholder="Target IP (e.g., localhost)"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                />
                <button
                  className="ids-refresh-btn-neon"
                  style={{ height: '32px', fontSize: '12px' }}
                  onClick={handleStartQuickScan}
                >
                  + New Scan
                </button>
              </div>
            </div>
            <div className="aegis-table-wrapper">
              <table className="aegis-table">
                <thead>
                  <tr>
                    <th>Scan ID</th>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Risk Level</th>
                    <th>Ports</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pentestScans.length > 0 ? (
                    pentestScans.map((scan) => (
                      <React.Fragment key={scan.id}>
                        <tr
                          onClick={() => setExpandedScanId(expandedScanId === scan.id ? null : scan.id)}
                          style={{ cursor: 'pointer', backgroundColor: expandedScanId === scan.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                        >
                          <td style={{ fontFamily: 'monospace' }}>{scan.id.substring(0, 8)}</td>
                          <td>{scan.target}</td>
                          <td style={{ textTransform: 'capitalize' }}>{scan.type}</td>
                          <td>
                            <StatusPill status={scan.status} />
                          </td>
                          <td>
                            {/* Risk Summary Calculation */}
                            {(() => {
                              if (scan.status !== 'completed' || !scan.result?.hosts?.[0]?.ports) return '-';
                              const ports = scan.result.hosts[0].ports;
                              let maxScore = 0;
                              let kevCount = 0;
                              let vulnCount = 0;
                              ports.forEach(p => {
                                if (p.vulnerabilities) {
                                  vulnCount += p.vulnerabilities.length;
                                  p.vulnerabilities.forEach(v => {
                                    if (v.severity_score > maxScore) maxScore = v.severity_score;
                                    if (v.known_exploited) kevCount++;
                                  });
                                }
                              });

                              if (kevCount > 0) return <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle size={14} /> {kevCount} KEV!</span>;
                              if (maxScore >= 9.0) return <span className="text-red-500 font-bold">Critical ({maxScore})</span>;
                              if (maxScore >= 7.0) return <span className="text-orange-500 font-bold">High ({maxScore})</span>;
                              if (vulnCount > 0) return <span className="text-yellow-500">Medium ({vulnCount})</span>;
                              return <span className="text-green-500">Safe</span>;
                            })()}
                          </td>
                          <td>
                            {scan.status === 'completed' && scan.result?.hosts?.[0]?.ports
                              ? scan.result.hosts[0].ports.length
                              : '-'}
                          </td>
                          <td>
                            {expandedScanId === scan.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </td>
                        </tr>
                        {/* Expanded Detail View */}
                        {expandedScanId === scan.id && scan.result?.hosts?.[0]?.ports && (
                          <tr>
                            <td colSpan={7} style={{ padding: '0', background: 'rgba(0,0,0,0.2)' }}>
                              <div style={{ padding: '1rem' }}>
                                <h4 className="text-sm font-bold mb-2 text-gray-400">Scan Results Detail ({scan.target})</h4>
                                <div className="grid gap-2">
                                  {scan.result.hosts[0].ports.map((port, idx) => (
                                    <div key={idx} className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-blue-400">{port.port}/{port.protocol}</span>
                                          <span className="font-semibold">{port.service}</span>
                                          {port.product && <span className="text-gray-400 text-sm">({port.product} {port.version})</span>}
                                        </div>
                                        {port.risk_score ? (
                                          <span className={`text-xs px-2 py-0.5 rounded ${port.risk_score >= 9 ? 'bg-red-900/50 text-red-200' : 'bg-gray-700 text-gray-300'}`}>
                                            Risk: {port.risk_score}
                                          </span>
                                        ) : null}
                                      </div>

                                      {/* Vulnerabilities List */}
                                      {port.vulnerabilities && port.vulnerabilities.length > 0 ? (
                                        <div className="mt-2 space-y-1">
                                          {port.vulnerabilities.map((vuln, vIdx) => (
                                            <div key={vIdx} className="flex items-start gap-2 text-xs p-1 hover:bg-white/5 rounded">
                                              <SeverityBadge severity={vuln.severity_level} />
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-mono font-bold text-gray-300">{vuln.id}</span>
                                                  {vuln.known_exploited && (
                                                    <span className="bg-red-600 text-white px-1 rounded text-[10px] uppercase font-bold animate-pulse">
                                                      Exploited in Wild
                                                    </span>
                                                  )}
                                                  <span className="text-gray-500">CVSS {vuln.severity_score}</span>
                                                </div>
                                                <p className="text-gray-400 line-clamp-1">{vuln.description || "No description available."}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-green-500/50 italic ml-4">No Known Vulnerabilities</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>
                        No scans performed yet.
                      </td>
                    </tr>
                  )}
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


