import React, { useEffect, useState, useCallback } from "react";
import "../index.css";
import { LineChart, BarChart3, Activity, Gauge, Server, AlertTriangle, Heart, Shield, Target, TrendingUp, RefreshCcw, RotateCw, Circle, Zap } from "lucide-react";
import { getMetricsOverview, checkHealth } from "../api/aegisClient.ts";
import { generateMetricsOverview, generateMonthlyThreats } from "../utils/mockDataGenerator.ts";
import ThreatsDetectedCard from "../components/charts/ThreatsDetectedCard.tsx";
import { StatCard, StatusPill } from "../components/common";
import { useSystemStatus } from "../hooks/useSystemStatus.ts";

function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get system status for mock mode detection
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus.mockStream === 'ON';

  useEffect(() => {
    // Remove the undefined setShowMockButton calls
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // CHECK: If mock is ON, use mock data instead of API
      if (systemStatus.mockStream === 'ON') {
        console.log('[Metrics] Using mock data (Mock: ON)');
        const mockMetrics = generateMetricsOverview();
        setMetrics(mockMetrics);
        setHealthStatus({ status: 'healthy', components: { database: 'demo' } });
        return;
      }

      try {
        const [metricsData, healthData] = await Promise.all([
          getMetricsOverview(),
          checkHealth().catch(() => null),
        ]);

        setMetrics(metricsData);
        setHealthStatus(healthData);
      } catch (apiErr) {
        // If API fails but mock is ON, still use mock data
        if (systemStatus.mockStream === 'ON') {
          console.log('[Metrics] API failed, using mock fallback');
          const mockMetrics = generateMetricsOverview();
          setMetrics(mockMetrics);
          setHealthStatus({ status: 'healthy', components: { database: 'demo' } });
        } else {
          throw apiErr;
        }
      }
    } catch (err) {
      console.error("Failed to load metrics overview:", err);
      setError(err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [systemStatus.mockStream]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleDashboardRefresh = async () => {
    setIsRefreshing(true);
    await loadMetrics();
    setIsRefreshing(false);
  };

  // Mock stream toggle - removed due to undefined variables

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

  return (
    <div className="aegis-page">
      <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">Metrics Dashboard</h1>
          <p className="aegis-dash-subtitle">
            High-level attack and severity metrics from the Aegis backend, with a
            placeholder for time-series charts.
          </p>
        </div>
        <div className="ids-header-right-new">
          {/* Unified Status pill */}
          <StatusPill />

          {/* Refresh button */}
          <button type="button" onClick={handleDashboardRefresh} disabled={isRefreshing} className={`ids-refresh-btn-neon ids-refresh-btn-neon--${idsStatus.status === 'error' ? 'error' : idsStatus.status === 'warning' ? 'warning' : 'healthy'}`}>
            <RotateCw className={`ids-refresh-icon ${isRefreshing ? 'animate-spin-slow' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <section className="ids-analytics-grid">
        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Summary{isMockMode ? ' (mock)' : ''}</h2>
            <span className="aegis-card-subtitle">
              Totals from the `/metrics/overview` endpoint.
            </span>
          </div>
          <div
            className="ids-kpi-grid"
            style={{
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "1rem",
              padding: "1rem",
            }}
          >
            <div className="ids-kpi-card">
              <div className="ids-kpi-label">Total Detections</div>
              <div className="ids-kpi-value">
                {loading ? "…" : metrics?.total_detections ?? 0}
              </div>
            </div>
            <div className="ids-kpi-card">
              <div className="ids-kpi-label">Total Alerts</div>
              <div className="ids-kpi-value">
                {loading ? "…" : metrics?.total_alerts ?? 0}
              </div>
            </div>
            <div className="ids-kpi-card">
              <div className="ids-kpi-label">Detection Rate</div>
              <div className="ids-kpi-value">
                {loading
                  ? "…"
                  : metrics?.detection_rate != null
                    ? `${(metrics.detection_rate * 100).toFixed(1)}%`
                    : "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Attack Counts{isMockMode ? ' (mock)' : ''}</h2>
            <span className="aegis-card-subtitle">
              Total detections by attack type.
            </span>
          </div>
          <div className="ids-table-wrapper">
            <table className="ids-table">
              <thead>
                <tr>
                  <th>Attack Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.attack_counts ? (
                  Object.entries(metrics.attack_counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <tr key={type}>
                        <td style={{ textTransform: "capitalize" }}>
                          {type.replace(/_/g, " ")}
                        </td>
                        <td>{count}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={2} style={{ textAlign: "center", padding: "1rem" }}>
                      {loading ? "Loading metrics…" : "No attack count data available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Severity Counts{isMockMode ? ' (mock)' : ''}</h2>
            <span className="aegis-card-subtitle">
              Total detections by severity.
            </span>
          </div>
          <div className="ids-table-wrapper">
            <table className="ids-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.severity_counts ? (
                  Object.entries(metrics.severity_counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([severity, count]) => (
                      <tr key={severity}>
                        <td style={{ textTransform: "capitalize" }}>{severity}</td>
                        <td>{count}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={2} style={{ textAlign: "center", padding: "1rem" }}>
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

        <ThreatsDetectedCard 
          title="Threats Over Time"
          data={generateMonthlyThreats()}
          loading={loading}
        />
      </section>
    </div>
  );
}

export default MetricsPage;


