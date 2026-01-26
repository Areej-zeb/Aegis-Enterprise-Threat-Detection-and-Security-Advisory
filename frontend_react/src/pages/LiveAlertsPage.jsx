import React, { useEffect, useMemo, useState, useCallback } from "react";
import "../index.css";
import { AlertTriangle, RefreshCcw, Search, RotateCw, Circle, Wifi, WifiOff, Skull } from "lucide-react";
import { fetchAlerts, checkHealth, fetchLiveDetections } from "../api/aegisClient.ts";
import RecentAlertTrends from "../components/RecentAlertTrends.tsx";
import { ErrorAlert } from "../components/common";
import { useWebSocketAlerts } from "../hooks/useWebSocketAlerts.ts";
import { AlertToast } from "../components/alerts/AlertToast.tsx";

function LiveAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [attackTypeFilter, setAttackTypeFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [toastAlert, setToastAlert] = useState(null);

  // WebSocket integration for real-time alerts
  const handleNewAlert = useCallback((newAlert) => {
    console.log('[LiveAlerts] New alert from WebSocket:', newAlert);
    setAlerts((prev) => {
      // Add new alert to the top, remove duplicates
      const filtered = prev.filter(a => a.id !== newAlert.id);
      return [newAlert, ...filtered].slice(0, 100); // Keep max 100 alerts
    });
    
    // Show toast notification
    setToastAlert(newAlert);
  }, []);

  const {
    isConnected: wsConnected,
    lastAlert: wsLastAlert,
    error: wsError,
    reconnectAttempts,
  } = useWebSocketAlerts({
    enabled: useWebSocket && autoRefresh,
    onAlert: handleNewAlert,
    onError: (err) => {
      console.error('[LiveAlerts] WebSocket error:', err);
    },
  });

  async function loadAlerts({ silent = false } = {}) {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        // Fetch real ML detections from trained models
        const liveDetections = await fetchLiveDetections(25, 
          attackTypeFilter !== "all" ? [attackTypeFilter] : undefined
        );
        
        // Transform detections to alert format
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
        
        setAlerts(transformedAlerts);
        
        // Get health status
        const healthData = await checkHealth().catch(() => null);
        setHealthStatus(healthData);
      } catch (apiErr) {
        console.error('Failed to load live detections:', apiErr);
        setError('Unable to connect to ML detection service');
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setError("Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAlerts();
    setIsRefreshing(false);
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
  // Check backend mode
  const backendMode = healthStatus?.mode || (healthStatus?.components?.database);
  const environmentLabel = (backendMode === 'demo' || backendMode === 'static') ? 'Demo' : 'Production';

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, attackTypeFilter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      // silent refresh: keep current loading state to avoid flicker
      loadAlerts({ silent: true }).catch((err) => {
        // Swallow polling errors so UI stays stable
        console.error("Polling error:", err);
      });
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, severityFilter, attackTypeFilter]);

  const filteredAlerts = useMemo(() => {
    const base = [...alerts].sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    const term = search.trim().toLowerCase();

    return base.filter((alert) => {
      const matchesSearch =
        term.length === 0 ||
        alert.id.toLowerCase().includes(term) ||
        (alert.attack_type || "").toLowerCase().includes(term) ||
        (alert.severity || "").toLowerCase().includes(term);

      const matchesSeverity =
        severityFilter === "all" || alert.severity === severityFilter;

      const matchesAttackType =
        attackTypeFilter === "all" ||
        (alert.attack_type || "").toLowerCase() ===
          attackTypeFilter.toLowerCase();

      return matchesSearch && matchesSeverity && matchesAttackType;
    });
  }, [alerts, search, severityFilter, attackTypeFilter]);

  const uniqueAttackTypes = useMemo(() => {
    const types = new Set(
      alerts
        .map((a) => (a.attack_type || "").trim())
        .filter((v) => v && v.length > 0)
    );
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [alerts]);

  return (
    <>
      {/* Toast notification for new alerts */}
      {toastAlert && (
        <AlertToast
          alert={toastAlert}
          onClose={() => setToastAlert(null)}
          duration={4000}
        />
      )}

      <div className="aegis-page">
        <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">Live Alerts</h1>
          <p className="aegis-dash-subtitle">
            Stream of most recent alerts from the Aegis IDS API.
          </p>
        </div>
        <div className="ids-header-right-new">
          {/* WebSocket Toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#9ca3af" }}>
            <input
              type="checkbox"
              checked={useWebSocket}
              onChange={(e) => setUseWebSocket(e.target.checked)}
            />
            WebSocket
          </label>

          {/* WebSocket Status Indicator */}
          {useWebSocket && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              fontSize: "0.75rem",
              color: wsConnected ? "#4ade80" : "#fb7185"
            }}>
              {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{wsConnected ? 'Live' : reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})` : 'Disconnected'}</span>
            </div>
          )}

          {/* Polling Toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#9ca3af" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Polling (5s)
          </label>

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
            onClick={handleRefresh}
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

      {error && <ErrorAlert message={error} />}

      <div className="aegis-card">
        <div className="aegis-card-header">
          <div>
            <h2>Alerts Feed</h2>
            <span className="aegis-card-subtitle">
              Showing {filteredAlerts.length} of {alerts.length} alert
              {alerts.length === 1 ? "" : "s"}.
            </span>
          </div>
          <div className="ids-table-controls">
            <div className="ids-search-wrapper">
              <Search size={14} className="ids-search-icon" />
              <input
                type="text"
                className="ids-search-input"
                placeholder="Search by ID, type, severity…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="ids-select"
            >
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={attackTypeFilter}
              onChange={(e) => setAttackTypeFilter(e.target.value)}
              className="ids-select"
            >
              <option value="all">All attack types</option>
              {uniqueAttackTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="ids-table-wrapper">
          <table className="ids-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                    Loading alerts…
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                    No alerts to display.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.id}</td>
                    <td>{alert.attack_type || "Unknown"}</td>
                    <td className="ids-capitalize">{alert.severity}</td>
                    <td>
                      {alert.timestamp
                        ? new Date(alert.timestamp).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="ids-mobile-cards-wrapper">
          {loading ? (
            <div className="ids-alert-card">
              <div style={{ textAlign: "center", color: "#94a3b8" }}>
                Loading alerts…
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="ids-alert-card">
              <div style={{ textAlign: "center", color: "#94a3b8" }}>
                No alerts to display.
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className="ids-alert-card">
                <div className="ids-alert-card-header">
                  <div className="ids-alert-card-id">
                    <span
                      className={`ids-alert-dot ids-alert-dot--${alert.severity}`}
                    />
                    <span>{alert.id}</span>
                  </div>
                  <span
                    className={`ids-severity-pill ids-severity-${alert.severity}`}
                  >
                    {alert.severity === "critical" && <Skull className="ids-severity-icon" />}
                    {alert.severity === "high" && <AlertTriangle className="ids-severity-icon" />}
                    {alert.severity === "medium" && <AlertTriangle className="ids-severity-icon" />}
                    {alert.severity === "low" && <AlertTriangle className="ids-severity-icon" />}
                    <span className="ids-capitalize">{alert.severity}</span>
                  </span>
                </div>
                <div className="ids-alert-card-body">
                  <div className="ids-alert-card-field">
                    <div className="ids-alert-card-label">Type</div>
                    <div className="ids-alert-card-value">
                      {alert.attack_type || "Unknown"}
                    </div>
                  </div>
                  <div className="ids-alert-card-field">
                    <div className="ids-alert-card-label">Timestamp</div>
                    <div className="ids-alert-card-value">
                      {alert.timestamp
                        ? new Date(alert.timestamp).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="aegis-card" style={{ marginTop: '20px' }}>
        <div className="aegis-card-header">
          <h2>Recent Alert Trends (Last 50 Alerts)</h2>
          <span className="aegis-card-subtitle">
            Severity distribution across the most recent alerts
          </span>
        </div>
        <RecentAlertTrends alerts={alerts} />
      </div>
    </div>
    </>
  );
}

export default LiveAlertsPage;


