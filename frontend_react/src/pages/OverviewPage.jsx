import React, { useEffect, useState, useCallback } from "react";
import "../index.css";
import "./SettingsPage.css";
import { Activity, Gauge, Server, AlertTriangle, Heart, Shield, Target, TrendingUp, RefreshCcw, RotateCw, Circle, Zap } from "lucide-react";
import { getMetricsOverview, getSystemStatus, checkHealth } from "../api/aegisClient.ts";
import { StatCard, StatusPill } from "../components/common";
import { useSystemStatus } from "../hooks/useSystemStatus.ts";
import { generateMetricsOverview } from "../utils/mockDataGenerator.ts";

function OverviewPage() {
  const [metrics, setMetrics] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get system status for mock mode detection
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.mockStream === 'ON';

  useEffect(() => {
    // Removed showMockButton handler
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // CHECK: If mock is ON, use mock data instead of API
      if (systemStatus.mockStream === 'ON') {
        console.log('[Overview] Using mock data (Mock: ON)');
        const mockMetrics = generateMetricsOverview();
        setMetrics(mockMetrics);
        setHealthStatus({ status: 'healthy', components: { database: 'demo' } });
        return;
      }

      try {
        const [metricsData, , healthData] = await Promise.all([
          getMetricsOverview(),
          getSystemStatus(),
          checkHealth().catch(() => null), // Don't fail if health check fails
        ]);

        setMetrics(metricsData);
        setHealthStatus(healthData);
      } catch (apiErr) {
        // If API fails but mock is ON, still use mock data
        if (systemStatus.mockStream === 'ON') {
          console.log('[Overview] API failed, using mock fallback');
          const mockMetrics = generateMetricsOverview();
          setMetrics(mockMetrics);
          setHealthStatus({ status: 'healthy', components: { database: 'demo' } });
        } else {
          throw apiErr;
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load overview data");
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  }, [systemStatus.mockStream]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleDashboardRefresh = async () => {
    setIsRefreshing(true);
    await loadOverview();
    setIsRefreshing(false);
  };

  const totalDetections = metrics?.total_detections ?? 0;
  const totalAlerts = metrics?.total_alerts ?? 0;
  const detectionRate =
    metrics?.detection_rate != null
      ? `${(metrics.detection_rate * 100).toFixed(1)}%`
      : "N/A";

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
  // Check backend mode

  return (
    <div className="aegis-page">
      <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">Aegis Overview</h1>
          <p className="aegis-dash-subtitle">
            High-level summary of IDS metrics and system health.
          </p>
        </div>
        <div className="ids-header-right-new">
          {/* Unified Status pill */}
          <StatusPill />

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
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            borderRadius: '8px',
            margin: '1rem 0',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '0.875rem'
          }}
        >
          <strong>Error:</strong> {error}. Unable to fetch IDS health. Check backend connectivity.
        </div>
      )}

      <section className="aegis-dash-top-row">
        <StatCard
          label="Total Detections"
          value={loading ? "…" : totalDetections}
          Icon={Activity}
        />
        <StatCard
          label="Total Alerts"
          value={loading ? "…" : totalAlerts}
          Icon={AlertTriangle}
        />
        <StatCard
          label="Detection Rate"
          value={loading ? "…" : detectionRate}
          Icon={Gauge}
        />
        <StatCard
          label="Loaded Models"
          value={loading ? "…" : systemStatus?.loaded_models ? systemStatus.loaded_models.length : 0}
          Icon={Server}
        />
      </section>

      {/* Second Row of KPI Cards */}
      <section className="aegis-dash-top-row" style={{ marginTop: '16px' }}>
        <StatCard
          label="Model Health"
          value={loading ? "…" : "98.5%"}
          delta="Healthy"
          Icon={Heart}
        />
        <StatCard
          label="Agent Status"
          value={loading ? "…" : "Active"}
          delta="Online"
          Icon={Shield}
        />
        <StatCard
          label="Top Attack Type"
          value={loading ? "…" : "SYN Flood"}
          delta="32%"
          Icon={Target}
        />
        <StatCard
          label="Overall Risk Score"
          value={loading ? "…" : "6.2"}
          delta="Medium"
          Icon={TrendingUp}
        />
      </section>

      <section className="aegis-dash-main-grid">
        <div className="aegis-dash-left-col">
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>System Status{isMockMode ? ' (mock)' : ''}</h2>
              <span className="aegis-card-subtitle">
                Raw information returned from the Aegis API.
              </span>
            </div>
            <div style={{ padding: "1rem" }}>
              {loading && <p>Loading system status…</p>}
              {!loading && !systemStatus && (
                <p style={{ color: "#888" }}>No system status available.</p>
              )}
              {!loading && systemStatus && (
                <pre
                  style={{
                    fontSize: "0.8rem",
                    background: "#040816",
                    color: "#e5e7eb",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(systemStatus, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="aegis-dash-right-col">
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Metrics Summary{isMockMode ? ' (mock)' : ''}</h2>
              <span className="aegis-card-subtitle">
                Attack and severity counts from the metrics overview endpoint.
              </span>
            </div>
            <div className="ids-metrics-grid">
              <div className="ids-metrics-table-wrap">
                <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  Attack Counts
                </h3>
                <table className="ids-metrics-table">
                  <thead>
                    <tr>
                      <th>Attack</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.attack_counts ? (
                      Object.entries(metrics.attack_counts).map(
                        ([attack, count]) => (
                          <tr key={attack}>
                            <td style={{ textTransform: "capitalize" }}>
                              {attack.replace(/_/g, " ")}
                            </td>
                            <td>{count}</td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td colSpan={2} style={{ textAlign: "center" }}>
                          {loading
                            ? "Loading metrics…"
                            : "No attack count data available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="ids-metrics-table-wrap">
                <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  Severity Counts
                </h3>
                <table className="ids-metrics-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.severity_counts ? (
                      Object.entries(metrics.severity_counts).map(
                        ([severity, count]) => (
                          <tr key={severity}>
                            <td style={{ textTransform: "capitalize" }}>
                              {severity}
                            </td>
                            <td>{count}</td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td colSpan={2} style={{ textAlign: "center" }}>
                          {loading
                            ? "Loading metrics…"
                            : "No severity count data available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;


