// src/pages/IDSPage.jsx

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  RadioTower,
  ChartPie,
  Activity,
  BrainCircuit,
  LineChart,
  ShieldAlert,
  Download,
  Search,
  Info,
  Network,
  Lightbulb,
  Zap,
  RefreshCcw,
  RotateCw,
  Circle,
} from "lucide-react";

import "../index.css";
import {
  getMetricsOverview,
  getSystemStatus,
  fetchAlerts,
  getExplanation,
  checkHealth
} from "../api/aegisClient.ts";
import RecentAlertTrends from "../components/RecentAlertTrends.tsx";
import ExplainabilityPanel from "../components/ids/ExplainabilityPanel.tsx";
import MetricsSummaryCard from "../components/cards/MetricsSummaryCard.tsx";
import { SeverityBadge } from "../components/common";
import { useIdsAnalytics } from "../hooks/useIdsAnalytics.ts";
import { IdsAnalyticsKpiRow } from "../components/ids/analytics/IdsAnalyticsKpiRow.tsx";
import { AlertsOverTimeChart } from "../components/ids/analytics/AlertsOverTimeChart.tsx";
import { AttackTypeDistribution } from "../components/ids/analytics/AttackTypeDistribution.tsx";
import { SeverityBreakdownChart } from "../components/ids/analytics/SeverityBreakdownChart.tsx";
import { TopTalkersTable } from "../components/ids/analytics/TopTalkersTable.tsx";
import { TimeRangeSelector } from "../components/ids/analytics/TimeRangeSelector.tsx";

// --- Demo data (fallback for when API is unavailable) ----------------------

const mockAlerts = [
  {
    id: "OB-109",
    timestamp: "21:24:07",
    srcIp: "203.0.113.45",
    destIp: "10.0.0.12",
    protocol: "TCP",
    label: "DDoS_SYN_Flood",
    score: 0.94,
    severity: "high",
    sensor: "Edge Firewall",
    srcPort: 52014,
    destPort: 443,
    type: "DDoS Attempt",
  },
  {
    id: "OB-110",
    timestamp: "21:23:32",
    srcIp: "198.51.100.77",
    destIp: "10.0.0.20",
    protocol: "TCP",
    label: "BruteForce_SSH",
    score: 0.88,
    severity: "medium",
    sensor: "VPN Gateway",
    srcPort: 51782,
    destPort: 22,
    type: "Brute-Force",
  },
  {
    id: "OB-111",
    timestamp: "21:22:10",
    srcIp: "192.0.2.200",
    destIp: "10.0.0.35",
    protocol: "UDP",
    label: "DNS_Tunnel",
    score: 0.91,
    severity: "high",
    sensor: "Core Sensor",
    srcPort: 52110,
    destPort: 53,
    type: "DNS Tunnel",
  },
  {
    id: "OB-112",
    timestamp: "21:21:03",
    srcIp: "10.0.0.94",
    destIp: "10.0.0.15",
    protocol: "TCP",
    label: "Recon_PortScan",
    score: 0.71,
    severity: "low",
    sensor: "Internal Sensor",
    srcPort: 50213,
    destPort: 8080,
    type: "Reconnaissance",
  },
];

const tabs = [
  { id: "overview", label: "Overview", icon: ChartPie },
  { id: "live-alerts", label: "Live Alerts", icon: Activity },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "threat-intel", label: "Threat Intel", icon: ShieldAlert },
];

// Analytics Tab Content Component
function AnalyticsTabContent({ alerts, loading, error }) {
  const [timeRange, setTimeRange] = React.useState("1h");

  // Convert alerts to IdsAlert format
  const idsAlerts = React.useMemo(() => {
    return alerts.map(alert => ({
      id: alert.id || alert.detection_id || "",
      timestamp: alert.timestamp || new Date().toISOString(),
      attackType: alert.attack_type || alert.label || alert.attackType || "UNKNOWN",
      label: alert.label || alert.attack_type,
      severity: (alert.severity || "low"),
      score: alert.score || alert.confidence || 0,
      sourceIp: alert.source_ip || alert.src_ip || alert.srcIp || "",
      destIp: alert.destination_ip || alert.dst_ip || alert.destIp || "",
      protocol: alert.protocol || alert.proto || "",
      model: alert.model || alert.model_type || alert.sensor || "",
      model_type: alert.model_type || alert.model,
    }));
  }, [alerts]);

  const minutesWindow = timeRange === "15m" ? 15 : timeRange === "1h" ? 60 : 24 * 60;
  const analytics = useIdsAnalytics(idsAlerts, { minutesWindow, bucketSizeMinutes: 5 });

  if (loading) {
    return (
      <section className="ids-analytics-grid">
        <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: '#666' }}>
          <RefreshCcw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading analytics data...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ids-analytics-grid">
        <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#f44' }}>
          <p>Error loading analytics: {error}</p>
        </div>
      </section>
    );
  }

  if (idsAlerts.length === 0) {
    return (
      <section className="ids-analytics-grid">
        <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#999' }}>
          <p>No alerts available in the selected time window.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ids-analytics-grid" style={{ padding: '1.5rem' }}>
      {/* Header with Time Range Selector */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Analytics</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Real-time intelligence from IDS alerts</p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* KPI Row */}
      <IdsAnalyticsKpiRow
        totalAlerts={analytics.totalAlerts}
        detectionRate={analytics.detectionRate}
        highCriticalCount={analytics.highSeverityCount + analytics.criticalSeverityCount}
        uniqueSources={analytics.topSources.length}
      />

      {/* Row 2: Volume & Mix */}
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Alerts Over Time */}
        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Alerts Over Time</h2>
            <span className="aegis-card-subtitle">
              Stacked by severity (last {timeRange})
            </span>
          </div>
          <AlertsOverTimeChart data={analytics.alertsOverTime} />
        </div>

        {/* Attack Type Distribution */}
        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Attack Type Distribution</h2>
            <span className="aegis-card-subtitle">
              Share of detections by attack type
            </span>
          </div>
          <AttackTypeDistribution attackCounts={analytics.attackCounts} />
        </div>
      </div>

      {/* Row 3: Severity & Top Talkers */}
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Severity Breakdown */}
        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Severity Breakdown</h2>
            <span className="aegis-card-subtitle">
              Alert distribution by severity level
            </span>
          </div>
          <SeverityBreakdownChart severityCounts={analytics.severityCounts} />
        </div>

        {/* Top Talkers */}
        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Top Talkers</h2>
            <span className="aegis-card-subtitle">
              Most active source IPs
            </span>
          </div>
          <TopTalkersTable topSources={analytics.topSources} />
        </div>
      </div>

      {/* Row 4: Model Overview (if available) */}
      {analytics.modelCounts.length > 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Detections by Model</h2>
              <span className="aegis-card-subtitle">
                Alert distribution across ML models
              </span>
            </div>
            <div className="ids-table-wrapper">
              <table className="ids-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.modelCounts.map((item, index) => {
                    const percentage = analytics.totalAlerts > 0 
                      ? ((item.count / analytics.totalAlerts) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <tr key={item.model || index}>
                        <td style={{ textTransform: 'capitalize' }}>
                          {item.model.replace(/_/g, ' ')}
                        </td>
                        <td>{item.count}</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function IDSPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // API state
  const [metrics, setMetrics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertsPagination, setAlertsPagination] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load Overview data
  useEffect(() => {
    if (activeTab !== "overview" && activeTab !== "analytics") return;

    async function loadOverviewData() {
      try {
        console.log('[Overview/Analytics] Starting data load...');
        setLoading(true);
        setError(null);

        const [metricsData, statusData, healthData] = await Promise.all([
          getMetricsOverview(),
          getSystemStatus(),
          checkHealth().catch(() => null)
        ]);

        console.log('[Overview/Analytics] Data received:', {
          metrics: metricsData,
          status: statusData,
          health: healthData
        });

        // Validate metrics has required data
        if (metricsData && (metricsData.attack_counts || metricsData.total_detections >= 0)) {
          setMetrics(metricsData);
          console.log('[Overview/Analytics] Metrics set successfully');
        } else {
          console.warn('[Overview/Analytics] Metrics data is empty or invalid:', metricsData);
          setError('No metrics data available from backend');
        }
        
        setSystemStatus(statusData);
        setHealthStatus(healthData);
        setInitialLoadComplete(true);
        console.log('[Overview/Analytics] State updated, initialLoadComplete=true');
      } catch (err) {
        const errorMsg = err.message || 'Failed to connect to ML detection service';
        setError(errorMsg);
        console.error('[Overview/Analytics] Error:', err);
      } finally {
        setLoading(false);
        console.log('[Overview/Analytics] Loading complete');
      }
    }

    loadOverviewData();
  }, [activeTab]);

  // Load Live Alerts data
  useEffect(() => {
    if (activeTab !== "live-alerts") return;

    async function loadAlerts() {
      try {
        console.log('[Live Alerts] Starting data load...');
        setLoading(true);
        setError(null);

        const response = await fetchAlerts({
          page: 1,
          page_size: 20,
          ...(severityFilter !== "all" && { severity: severityFilter })
        });

        console.log('[Live Alerts] Response received:', response);
        
        const alertsData = response.alerts || [];
        console.log('[Live Alerts] Alerts count:', alertsData.length);
        
        if (alertsData.length > 0) {
          setAlerts(alertsData);
          setAlertsPagination(response.meta);
          if (!selectedAlertId) {
            setSelectedAlertId(alertsData[0].id);
          }
          console.log('[Live Alerts] Alerts set successfully');
        } else {
          console.warn('[Live Alerts] No alerts received from backend');
          setAlerts([]);
          setError('No alerts available. The ML models may not be generating detections.');
        }
        
        setInitialLoadComplete(true);
        console.log('[Live Alerts] State updated, initialLoadComplete=true');
      } catch (err) {
        const errorMsg = err.message || 'Failed to load alerts from ML models';
        console.error('[Live Alerts] Error:', err);
        setError(errorMsg);
        // Keep existing alerts on error rather than clearing
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, [activeTab, severityFilter]);

  // Polling for Live Alerts
  useEffect(() => {
    if (activeTab !== "live-alerts" || !autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetchAlerts({
          page: 1,
          page_size: 20,
          ...(severityFilter !== "all" && { severity: severityFilter })
        });

        setAlerts(response.alerts);
        setAlertsPagination(response.meta);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, autoRefresh, severityFilter]);


  // Compute Security Overview metrics from a single source of truth
  // Prefer alerts array if available, otherwise use metrics.severity_counts
  const securityOverviewMetrics = useMemo(() => {
    // If we have alerts array, compute everything from it
    if (alerts && alerts.length > 0) {
      const severityCounts = alerts.reduce(
        (acc, alert) => {
          const key = (alert.severity || '').toLowerCase().trim();
          if (key === 'critical' || key === 'high' || key === 'medium' || key === 'low') {
            acc[key] = (acc[key] || 0) + 1;
          }
          return acc;
        },
        { low: 0, medium: 0, high: 0, critical: 0 }
      );

      const totalAlerts = alerts.length;
      const computedSum = severityCounts.low + severityCounts.medium + severityCounts.high + severityCounts.critical;

      // Validation: ensure counts add up
      if (totalAlerts !== computedSum) {
        console.warn('[Security Overview] Alert count mismatch:', {
          totalAlerts,
          lowCount: severityCounts.low,
          mediumCount: severityCounts.medium,
          highCount: severityCounts.high,
          criticalCount: severityCounts.critical,
          computedSum,
          alertsWithUnknownSeverity: totalAlerts - computedSum
        });
      }

      return {
        totalAlerts,
        lowCount: severityCounts.low,
        mediumCount: severityCounts.medium,
        highCount: severityCounts.high,
        criticalCount: severityCounts.critical
      };
    }

    // Fallback: use metrics.severity_counts if available
    if (metrics?.severity_counts) {
      const severityCounts = metrics.severity_counts;
      const lowCount = severityCounts.low || 0;
      const mediumCount = severityCounts.medium || 0;
      const highCount = severityCounts.high || 0;
      const criticalCount = severityCounts.critical || 0;
      const totalAlerts = lowCount + mediumCount + highCount + criticalCount;

      // Validation: compare with metrics.total_alerts if available
      if (metrics.total_alerts !== undefined && metrics.total_alerts !== totalAlerts) {
        console.warn('[Security Overview] Metrics mismatch:', {
          metricsTotalAlerts: metrics.total_alerts,
          computedTotalAlerts: totalAlerts,
          lowCount,
          mediumCount,
          highCount,
          criticalCount
        });
        // Use computed total for consistency
      }

      return {
        totalAlerts,
        lowCount,
        mediumCount,
        highCount,
        criticalCount
      };
    }

    // Final fallback: use metrics.total_alerts if available, but set all counts to 0
    return {
      totalAlerts: metrics?.total_alerts || 0,
      lowCount: 0,
      mediumCount: 0,
      highCount: 0,
      criticalCount: 0
    };
  }, [alerts, metrics]);

  const totalAlerts = securityOverviewMetrics.totalAlerts;
  const criticalCount = securityOverviewMetrics.criticalCount;
  const highCount = securityOverviewMetrics.highCount;
  const mediumCount = securityOverviewMetrics.mediumCount;
  const lowCount = securityOverviewMetrics.lowCount;

  const selectedAlert = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId) || alerts[0],
    [selectedAlertId, alerts]
  );

  const filteredAlerts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesSeverity =
        severityFilter === "all" || alert.severity === severityFilter;
      const matchesSearch =
        term.length === 0 ||
        alert.id.toLowerCase().includes(term) ||
        (alert.source_ip || alert.srcIp || "").toLowerCase().includes(term) ||
        (alert.destination_ip || alert.destIp || "").toLowerCase().includes(term) ||
        (alert.attack_type || alert.label || "").toLowerCase().includes(term) ||
        (alert.type || "").toLowerCase().includes(term);
      return matchesSeverity && matchesSearch;
    });
  }, [searchTerm, severityFilter, alerts]);

  // Refresh function
  const handleDashboardRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [metricsData, statusData, healthData] = await Promise.all([
        getMetricsOverview(),
        getSystemStatus(),
        checkHealth().catch(() => null)
      ]);
      setMetrics(metricsData);
      setSystemStatus(statusData);
      setHealthStatus(healthData);
      
      // Also refresh alerts if on live-alerts tab
      if (activeTab === "live-alerts") {
        const response = await fetchAlerts({
          page: 1,
          page_size: 20,
          ...(severityFilter !== "all" && { severity: severityFilter })
        });
        setAlerts(response.alerts);
        setAlertsPagination(response.meta);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

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
  const environmentLabel = (backendMode === 'demo' || backendMode === 'static') ? 'Demo' : 'ML Models Active';

  return (
    <div className="aegis-page">
      {/* Header */}
      <header className="ids-header-new">
        <div>
          <h1 className="aegis-dash-title">
            Aegis IDS — Real-Time Threat Detection
          </h1>
          <p className="aegis-dash-subtitle">
            Live network threat intelligence with explainability and analytics
            for SME networks.
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

      {/* Tabs */}
      <div className="ids-tab-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`ids-tab-new ${isActive ? "ids-tab-new--active" : ""}`}
            >
              <Icon className="ids-tab-icon" size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <section className="ids-overview-grid">
          {/* Left column */}
          <div className="ids-overview-left">
            {/* Enterprise-Ready Architecture */}
            <div className="aegis-card ids-arch-card">
              <div className="aegis-card-header">
                <h2>Enterprise-Ready Architecture</h2>
                <span className="aegis-card-subtitle">
                  How Aegis IDS operates in your environment.
                </span>
              </div>
              <div className="ids-arch-content">
                <p>
                  Aegis IDS runs as a 24/7 control-plane for SME networks, tuned
                  for noisy production traffic.
                </p>
                <ul className="ids-arch-list">
                  <li>
                    <span className="ids-arch-dot ids-arch-dot--purple" />
                    Backend sensors continuously capture traffic and stream alerts
                    to the IDS engine.
                  </li>
                  <li>
                    <span className="ids-arch-dot ids-arch-dot--cyan" />
                    <strong>Live Alerts</strong> supports optional auto-refresh
                    streaming for NOC-style monitoring.
                  </li>
                  <li>
                    <span className="ids-arch-dot ids-arch-dot--indigo" />
                    <strong>Explainability</strong>, <strong>Analytics</strong>{" "}
                    and <strong>Threat Intel</strong> remain static for deep-dive
                    investigations.
                  </li>
                  <li>
                    <span className="ids-arch-dot ids-arch-dot--emerald" />
                    Use <strong>"Refresh Dashboard"</strong> to sync metrics
                    across all tabs with the latest IDS state.
                  </li>
                </ul>
                <button className="ids-refresh-btn">
                  <LineChart size={14} />
                  Refresh Dashboard
                </button>
              </div>
            </div>

            {/* Security Overview */}
            <div className="aegis-card">
              <div className="aegis-card-header">
                <h2>Security Overview</h2>
                <span className="aegis-card-subtitle">
                  Last 5 min snapshot
                </span>
              </div>
              <div className="ids-kpi-grid">
                <div className="ids-kpi-card">
                  <div className="ids-kpi-label">Total Alerts</div>
                  <div className="ids-kpi-value">{totalAlerts}</div>
                  <div className="ids-kpi-meta">
                    Across all sensors and attack families.
                  </div>
                </div>
                <div className="ids-kpi-card">
                  <div className="ids-kpi-label">Critical Severity</div>
                  <div className="ids-kpi-value ids-kpi-value--red">
                    {criticalCount}
                  </div>
                  <SeverityBadge severity="critical" className="ids-kpi-pill" />
                  <div className="ids-kpi-meta">
                    Immediate action required - active threat detected.
                  </div>
                </div>
                <div className="ids-kpi-card">
                  <div className="ids-kpi-label">High Severity</div>
                  <div className="ids-kpi-value ids-kpi-value--red">
                    {highCount}
                  </div>
                  <SeverityBadge severity="high" className="ids-kpi-pill" />
                  <div className="ids-kpi-meta">
                    Requires immediate triage and response.
                  </div>
                </div>
                <div className="ids-kpi-card">
                  <div className="ids-kpi-label">Medium Severity</div>
                  <div className="ids-kpi-value ids-kpi-value--amber">
                    {mediumCount}
                  </div>
                  <SeverityBadge severity="medium" className="ids-kpi-pill" />
                  <div className="ids-kpi-meta">
                    Monitor and correlate with adjacent activity.
                  </div>
                </div>
                <div className="ids-kpi-card">
                  <div className="ids-kpi-label">Low Severity</div>
                  <div className="ids-kpi-value ids-kpi-value--emerald">
                    {lowCount}
                  </div>
                  <SeverityBadge severity="low" className="ids-kpi-pill" />
                  <div className="ids-kpi-meta">
                    Benign or informational signals in current window.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Distributions */}
          <div className="ids-overview-right">
            {/* Recent Alert Trends */}
            <div className="aegis-card" style={{ minHeight: "400px" }}>
              <div className="aegis-card-header">
                <h2>Recent Alert Trends (Last 50 Alerts)</h2>
                <span className="aegis-card-subtitle">
                  Severity distribution across the most recent alerts
                </span>
              </div>
              <RecentAlertTrends alerts={alerts} />
            </div>

            <div className="aegis-card">
              <div className="aegis-card-header">
                <h2>Distributions</h2>
                <span className="aegis-card-subtitle">
                  Based on active alerts
                </span>
              </div>
              <div className="ids-dist-grid-new">
                {/* Attack Type Distribution */}
                <div className="ids-dist-section">
                  <div className="ids-dist-section-title">
                    <ChartPie size={16} />
                    Attack Type Distribution
                  </div>
                  {metrics?.attack_counts ? (
                    Object.entries(metrics.attack_counts).map(([label, value], index) => {
                      const total = Object.values(metrics.attack_counts).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                      const colors = ["ids-bar-fill--purple", "ids-bar-fill--cyan", "ids-bar-fill--amber", "ids-bar-fill--slate"];

                      return (
                        <div key={label} className="ids-bar-row">
                          <span style={{ textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</span>
                          <div className="ids-bar">
                            <div
                              className={`ids-bar-fill ${colors[index % colors.length]}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="ids-bar-value">{percentage}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '1rem', color: '#888', fontStyle: 'italic' }}>
                      No attack data available
                    </div>
                  )}
                </div>

                {/* Severity Distribution */}
                <div className="ids-dist-section">
                  <div className="ids-dist-section-title">
                    <ShieldAlert size={16} />
                    Severity Distribution
                  </div>
                  {metrics?.severity_counts ? (
                    Object.entries(metrics.severity_counts).map(([label, value]) => {
                      const total = Object.values(metrics.severity_counts).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                      let color = "ids-bar-fill--slate";
                      if (label === "critical") color = "ids-bar-fill--critical";
                      if (label === "high") color = "ids-bar-fill--red";
                      if (label === "medium") color = "ids-bar-fill--amber";
                      if (label === "low") color = "ids-bar-fill--green";

                      return (
                        <div key={label} className="ids-bar-row">
                          <span style={{ textTransform: 'capitalize' }}>{label}</span>
                          <div className="ids-bar">
                            <div
                              className={`ids-bar-fill ${color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="ids-bar-value">{percentage}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '1rem', color: '#888', fontStyle: 'italic' }}>
                      No severity data available
                    </div>
                  )}
                </div>

                {/* Protocol Distribution - Placeholder as API doesn't provide this yet */}
                <div className="ids-dist-section">
                  <div className="ids-dist-section-title">
                    <Activity size={16} />
                    Protocol Distribution
                  </div>
                  <div style={{ padding: '0.5rem 0', color: '#666', fontSize: '0.85rem' }}>
                    Protocol statistics will be available in the next API update.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Live Alerts Tab */}
      {activeTab === "live-alerts" && (
        <section className="ids-live-grid">
          {/* Left column */}
          <div className="ids-left-stack">
            {/* Streaming toolbar */}
            <div className="aegis-card">
              <div className="ids-live-toolbar">
                <div className="ids-live-left">
                  <div className="ids-live-status">
                    <span
                      className={`ids-live-dot ${autoRefresh ? "ids-live-dot--on" : "ids-live-dot--off"
                        }`}
                    />
                    {autoRefresh
                      ? "LIVE STREAMING — auto-refresh enabled."
                      : "No auto-refresh — navigate freely between tabs."}
                  </div>
                  <div className="ids-live-toggle">
                    <span>Enable Auto-Refresh</span>
                    <button
                      type="button"
                      onClick={() => setAutoRefresh((prev) => !prev)}
                      className={`ids-toggle ${autoRefresh ? "ids-toggle--on" : "ids-toggle--off"
                        }`}
                    >
                      <span className="ids-toggle-knob" />
                    </button>
                  </div>
                </div>
                <div className="ids-live-kpis">
                  <div className="ids-inline-kpi">
                    <span className="ids-inline-kpi-label">Total alerts:</span>
                    <span className="ids-inline-kpi-value">{totalAlerts}</span>
                  </div>
                  <div className="ids-inline-kpi">
                    <span className="ids-inline-kpi-label">Last 5 min:</span>
                    <span className="ids-inline-kpi-value">
                      10 <span className="ids-inline-kpi-delta">(+1)</span>
                    </span>
                  </div>
                  <div className="ids-inline-kpi">
                    <span className="ids-inline-kpi-label">Last update:</span>
                    <span className="ids-inline-kpi-value">21:24:07</span>
                  </div>
                  <button className="ids-download-btn cursor-hotspot-action">
                    <Download size={14} />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts feed */}
            <div className="aegis-card">
              <div className="aegis-card-header">
                <div>
                  <h2>Live Alerts Feed</h2>
                  <span className="aegis-card-subtitle">
                    Showing {filteredAlerts.length} of {totalAlerts} alerts
                    (after filters).
                  </span>
                </div>
                <div className="ids-table-controls">
                  <div className="ids-search-wrapper">
                    <Search size={14} className="ids-search-icon" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search alerts..."
                      className="ids-search-input"
                    />
                  </div>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="ids-select"
                  >
                    <option value="all">All severities</option>
                    <option value="critical">Critical only</option>
                    <option value="high">High only</option>
                    <option value="medium">Medium only</option>
                    <option value="low">Low only</option>
                  </select>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="ids-table-wrapper">
                {loading && !initialLoadComplete ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                    <RefreshCcw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                    <p>Loading alerts from ML models...</p>
                  </div>
                ) : error ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#f44' }}>
                    <p>Error: {error}</p>
                    <button onClick={handleDashboardRefresh} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                      Retry
                    </button>
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    <p>No alerts available. Generating detections from ML models...</p>
                    <button onClick={handleDashboardRefresh} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                      Refresh
                    </button>
                  </div>
                ) : (
                <table className="ids-table">
                  <thead>
                    <tr>
                      <th>Alert</th>
                      <th>Timestamp</th>
                      <th>Source IP</th>
                      <th>Dest IP</th>
                      <th>Protocol</th>
                      <th>Label</th>
                      <th>Score</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert) => {
                      const isSelected = alert.id === selectedAlert?.id;
                      // Handle both API and mock data fields
                      const srcIp = alert.source_ip || alert.srcIp || "—";
                      const destIp = alert.destination_ip || alert.destIp || "—";
                      const label = alert.attack_type || alert.label || "Unknown";
                      const score = alert.confidence !== undefined ? alert.confidence : (alert.score !== undefined ? alert.score : 0);

                      return (
                        <tr
                          key={alert.id}
                          onClick={() => setSelectedAlertId(alert.id)}
                          className={`ids-row ${isSelected ? "ids-row--selected" : ""
                            }`}
                        >
                          <td>
                            <div className="ids-alert-id-cell">
                              <span
                                className={`ids-alert-dot ids-alert-dot--${alert.severity}`}
                              />
                              <span>{alert.id}</span>
                            </div>
                          </td>
                          <td>{new Date(alert.timestamp).toLocaleTimeString()}</td>
                          <td>{srcIp}</td>
                          <td>{destIp}</td>
                          <td>{alert.protocol || "TCP"}</td>
                          <td>{label}</td>
                          <td>{score.toFixed(2)}</td>
                          <td>
                            <SeverityBadge severity={alert.severity} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}
              </div>

              {/* Mobile Card View */}
              <div className="ids-mobile-cards-wrapper">
                {loading && !initialLoadComplete ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                    <RefreshCcw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                    <p>Loading alerts...</p>
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    <p>No alerts to display</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => {
                  const isSelected = alert.id === selectedAlert?.id;
                  const srcIp = alert.source_ip || alert.srcIp || "—";
                  const destIp = alert.destination_ip || alert.destIp || "—";
                  const label = alert.attack_type || alert.label || "Unknown";
                  const score = alert.confidence !== undefined ? alert.confidence : (alert.score !== undefined ? alert.score : 0);

                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={`ids-alert-card ${isSelected ? "ids-row--selected" : ""}`}
                    >
                      <div className="ids-alert-card-header">
                        <div className="ids-alert-card-id">
                          <span
                            className={`ids-alert-dot ids-alert-dot--${alert.severity}`}
                          />
                          <span>{alert.id}</span>
                        </div>
                        <SeverityBadge severity={alert.severity} />
                      </div>
                      <div className="ids-alert-card-body">
                        <div className="ids-alert-card-field">
                          <div className="ids-alert-card-label">Label</div>
                          <div className="ids-alert-card-value">{label}</div>
                        </div>
                        <div className="ids-alert-card-field">
                          <div className="ids-alert-card-label">Score</div>
                          <div className="ids-alert-card-value">{score.toFixed(2)}</div>
                        </div>
                        <div className="ids-alert-card-field">
                          <div className="ids-alert-card-label">Source IP</div>
                          <div className="ids-alert-card-value">{srcIp}</div>
                        </div>
                        <div className="ids-alert-card-field">
                          <div className="ids-alert-card-label">Dest IP</div>
                          <div className="ids-alert-card-value">{destIp}</div>
                        </div>
                        <div className="ids-alert-card-field">
                          <div className="ids-alert-card-label">Protocol</div>
                          <div className="ids-alert-card-value">{alert.protocol || "TCP"}</div>
                        </div>
                        <div className="ids-alert-card-field">
                          <div className="ids-alert-card-label">Timestamp</div>
                          <div className="ids-alert-card-value">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
                )}
              </div>

            </div>
          </div>

          {/* Right column */}
          <div className="ids-right-stack">
            {/* Selected Alert Summary */}
            <div className="aegis-card ids-selected-summary">
              <div className="ids-selected-header">
                <div>
                  <h2 className="ids-selected-title">
                    {selectedAlert
                      ? `${selectedAlert.id} · ${selectedAlert.attack_type || selectedAlert.type || selectedAlert.label}`
                      : "No alert selected"}
                  </h2>
                  {selectedAlert && (
                    <p className="ids-selected-meta">
                      {new Date(selectedAlert.timestamp).toLocaleString()} · {selectedAlert.sensor || "Network Sensor"}
                    </p>
                  )}
                </div>
                {selectedAlert && (
                  <SeverityBadge severity={selectedAlert.severity} />
                )}
              </div>
              {selectedAlert && (
                <>
                  <div className="ids-score-display">
                    <span className="ids-score-label">Detection score</span>
                    <span className="ids-score-value">
                      {(selectedAlert.confidence !== undefined ? selectedAlert.confidence : (selectedAlert.score || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="ids-tags">
                    <span className="ids-tag">{selectedAlert.attack_type || selectedAlert.label}</span>
                    <span className="ids-tag">
                      {selectedAlert.protocol || "TCP"}
                      {(selectedAlert.destPort || selectedAlert.destination_port) ? ` · ${selectedAlert.destPort || selectedAlert.destination_port}` : ""}
                    </span>
                    <span className="ids-tag">{selectedAlert.sensor || "Network Sensor"}</span>
                  </div>
                </>
              )}
            </div>

            {/* Alert Details */}
            <div className="aegis-card ids-details-card">
              <div className="ids-details-section">
                <h3>
                  <Info size={15} />
                  General Information
                </h3>
                {selectedAlert && (
                  <dl className="ids-details-grid">
                    <div>
                      <dt>Alert ID</dt>
                      <dd>{selectedAlert.id}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{selectedAlert.attack_type || selectedAlert.type || selectedAlert.label}</dd>
                    </div>
                    <div>
                      <dt>Severity</dt>
                      <dd className="ids-capitalize">{selectedAlert.severity}</dd>
                    </div>
                    <div>
                      <dt>Detection score</dt>
                      <dd>{(selectedAlert.confidence !== undefined ? selectedAlert.confidence : (selectedAlert.score || 0)).toFixed(2)}</dd>
                    </div>
                  </dl>
                )}
              </div>

              <div className="ids-details-section">
                <h3>
                  <Network size={15} />
                  Network Information
                </h3>
                {selectedAlert && (
                  <dl className="ids-details-grid">
                    <div>
                      <dt>Source IP</dt>
                      <dd>{selectedAlert.source_ip || selectedAlert.srcIp || "—"}</dd>
                    </div>
                    <div>
                      <dt>Destination IP</dt>
                      <dd>{selectedAlert.destination_ip || selectedAlert.destIp || "—"}</dd>
                    </div>
                    <div>
                      <dt>Source port</dt>
                      <dd>{selectedAlert.srcPort || selectedAlert.source_port || "—"}</dd>
                    </div>
                    <div>
                      <dt>Destination port</dt>
                      <dd>{selectedAlert.destPort || selectedAlert.destination_port || "—"}</dd>
                    </div>
                    <div>
                      <dt>Protocol</dt>
                      <dd>{selectedAlert.protocol || "TCP"}</dd>
                    </div>
                    <div>
                      <dt>Sensor</dt>
                      <dd>{selectedAlert.sensor || "Network Sensor"}</dd>
                    </div>
                  </dl>
                )}
              </div>

              <div className="ids-details-section">
                <h3>
                  <Lightbulb size={15} />
                  Detection Notes
                </h3>
                <p className="ids-details-text">
                  {selectedAlert?.description || "High rate of suspicious packets observed from this source within a short time window. Pattern matches known attack profiles used against exposed services in SME networks."}
                </p>
              </div>
            </div>

            {/* Explainability Panel */}
            <ExplainabilityPanel detectionId={selectedAlert?.id || null} />

            {/* AI Advisory Insight */}
            <div className="aegis-card ids-advisory-card">
              <div className="ids-advisory-header">
                <div className="ids-advisory-icon-wrap">
                  <Zap size={18} />
                </div>
                <div>
                  <h2 className="ids-advisory-title">AI Advisory Insight</h2>
                  <p className="ids-advisory-subtitle">
                    Next best action for this alert.
                  </p>
                </div>
              </div>
              <ul className="ids-advisory-list">
                <li>
                  <span className="ids-advisory-dot ids-advisory-dot--purple" />
                  Rate-limit the suspicious source IP on the edge firewall and
                  VPN concentrator.
                </li>
                <li>
                  <span className="ids-advisory-dot ids-advisory-dot--cyan" />
                  Enable or tighten WAF DDoS protections on exposed HTTP / HTTPS
                  services.
                </li>
                <li>
                  <span className="ids-advisory-dot ids-advisory-dot--emerald" />
                  Add indicators of compromise to the threat intel watchlist and
                  SIEM correlation rules.
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && <AnalyticsTabContent alerts={alerts} loading={loading} error={error} />}

      {/* Threat Intel Tab */}
      {activeTab === "threat-intel" && (
        <section className="ids-intel-grid">
          {/* AI powered threat analysis */}
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>AI-Powered Threat Analysis</h2>
            </div>
            <div className="ids-intel-grid-mini">
              <div className="ids-intel-card">
                <p className="ids-intel-card-label">Most prevalent attack</p>
                <p className="ids-intel-card-value">DDoS / Flooding</p>
                <p className="ids-intel-card-meta">46% of malicious traffic.</p>
              </div>
              <div className="ids-intel-card">
                <p className="ids-intel-card-label">Attack types detected</p>
                <p className="ids-intel-card-value ids-intel-card-value--sky">7</p>
                <p className="ids-intel-card-meta">Across L3–L7 telemetry.</p>
              </div>
              <div className="ids-intel-card">
                <p className="ids-intel-card-label">Total incidents (24h)</p>
                <p className="ids-intel-card-value">2,934</p>
                <p className="ids-intel-card-meta ids-intel-card-meta--emerald">
                  +18.4% vs previous day.
                </p>
              </div>
              <div className="ids-intel-card">
                <p className="ids-intel-card-label">High severity incidents</p>
                <p className="ids-intel-card-value ids-intel-card-value--red">124</p>
                <p className="ids-intel-card-meta">
                  Prioritized for immediate triage.
                </p>
              </div>
            </div>
          </div>

          {/* Recommended actions */}
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Recommended Security Actions</h2>
            </div>
            <ul className="ids-intel-list">
              <li>
                <span className="ids-intel-dot ids-intel-dot--purple" />
                Enforce rate-limiting and connection caps on public ingress
                points receiving DDoS-like traffic.
              </li>
              <li>
                <span className="ids-intel-dot ids-intel-dot--cyan" />
                Enable deeper L7 inspection on VPN and remote-access gateways
                to catch credential stuffing and brute-force attempts.
              </li>
              <li>
                <span className="ids-intel-dot ids-intel-dot--emerald" />
                Push high-risk indicators to firewall, WAF, and EDR policies via
                automated playbooks.
              </li>
              <li>
                <span className="ids-intel-dot ids-intel-dot--amber" />
                Schedule targeted threat-hunting sessions on DNS tunnels and
                suspicious long-lived flows.
              </li>
            </ul>
          </div>

          {/* Known malicious IPs */}
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Known Malicious IPs (Demo)</h2>
              <span className="aegis-card-subtitle">
                Ready to integrate AbuseIPDB / external feeds
              </span>
            </div>
            <table className="ids-metrics-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>First seen</th>
                  <th>Last seen</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    ip: "203.0.113.45",
                    first: "2025-03-01",
                    last: "2025-03-09",
                    status: "Blocked at edge",
                    statusClass: "ids-status-badge ids-status-badge--red",
                  },
                  {
                    ip: "198.51.100.77",
                    first: "2025-02-12",
                    last: "2025-03-08",
                    status: "Under watch",
                    statusClass: "ids-status-badge ids-status-badge--amber",
                  },
                  {
                    ip: "192.0.2.200",
                    first: "2025-03-05",
                    last: "2025-03-09",
                    status: "Repeated DNS tunnel",
                    statusClass: "ids-status-badge ids-status-badge--purple",
                  },
                ].map((row) => (
                  <tr key={row.ip}>
                    <td>{row.ip}</td>
                    <td>{row.first}</td>
                    <td>{row.last}</td>
                    <td>
                      <span className={row.statusClass}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MITRE / CVEs */}
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Attack Signatures & MITRE ATT&CK</h2>
            </div>
            <ul className="ids-intel-list">
              <li>
                <span className="ids-intel-dot ids-intel-dot--purple" />
                <strong>DDoS / Resource Exhaustion</strong> — MITRE ATT&CK{" "}
                <code>T1499</code> (Endpoint Denial-of-Service).
              </li>
              <li>
                <span className="ids-intel-dot ids-intel-dot--cyan" />
                <strong>Credential Access / Brute Force</strong> — MITRE ATT&CK{" "}
                <code>T1110</code> (Brute Force) on VPN + SSH surfaces.
              </li>
              <li>
                <span className="ids-intel-dot ids-intel-dot--emerald" />
                <strong>Command & Control over DNS</strong> — MITRE ATT&CK{" "}
                <code>T1071.004</code> (Application Layer Protocol: DNS).
              </li>
              <li>
                <span className="ids-intel-dot ids-intel-dot--amber" />
                <strong>Reconnaissance / Network Scanning</strong> — MITRE ATT&CK{" "}
                <code>T1046</code> (Network Service Discovery).
              </li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

export default IDSPage;
