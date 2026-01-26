import React, { useState, useEffect } from "react";
import "../index.css";
import "./SettingsPage.css";
import { Settings, Bell, Zap, Plug2, Save, Circle } from "lucide-react";
import { checkHealth } from "../api/aegisClient";

type TabType = "general" | "alerts" | "notifications" | "integrations";

type AttackKey = "synFlood" | "mitmArp" | "dnsExfil" | "bruteForce" | "httpAbuse";

type AttackToggle = {
  key: AttackKey;
  label: string;
  description: string;
  enabled: boolean;
};

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // General settings state
  const [organizationName, setOrganizationName] = useState("Acme Security Labs");
  const [environment, setEnvironment] = useState<"demo" | "live">("demo");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");

  // Alerts & Detection settings state
  const [attackToggles, setAttackToggles] = useState<AttackToggle[]>([
    {
      key: "synFlood",
      label: "SYN Flood",
      description: "Detect volumetric TCP SYN-based denial of service attacks.",
      enabled: true,
    },
    {
      key: "mitmArp",
      label: "MITM ARP Spoofing",
      description: "Detect ARP poisoning and man-in-the-middle attempts on local segments.",
      enabled: true,
    },
    {
      key: "dnsExfil",
      label: "DNS Exfiltration",
      description: "Detect suspicious DNS tunneling and data exfiltration patterns.",
      enabled: true,
    },
    {
      key: "bruteForce",
      label: "Brute Force Logins",
      description: "Detect repeated failed authentication attempts against exposed services.",
      enabled: true,
    },
    {
      key: "httpAbuse",
      label: "HTTP Layer 7 Abuse",
      description: "Detect abnormal HTTP request rates and application-layer DoS behavior.",
      enabled: true,
    },
  ]);

  const [detectionSensitivity, setDetectionSensitivity] = useState<number>(70);
  const [minSeverityForAlert, setMinSeverityForAlert] = useState<"low" | "medium" | "high" | "critical">("low");
  const [autoCloseLowSeverity, setAutoCloseLowSeverity] = useState<boolean>(false);
  const [autoCloseHours, setAutoCloseHours] = useState<number>(24);

  // Notifications settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(true);
  const [emailForAlerts, setEmailForAlerts] = useState<string>("security@acme-sec.com");
  const [slackEnabled, setSlackEnabled] = useState<boolean>(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState<string>("");
  const [genericWebhookEnabled, setGenericWebhookEnabled] = useState<boolean>(false);
  const [genericWebhookUrl, setGenericWebhookUrl] = useState<string>("");
  const [summaryFrequency, setSummaryFrequency] = useState<"none" | "daily" | "weekly">("daily");
  const [minSeverityForNotification, setMinSeverityForNotification] = useState<"low" | "medium" | "high" | "critical">("medium");

  // Integrations settings state
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyVisible, setApiKeyVisible] = useState<boolean>(false);
  const [agentToken, setAgentToken] = useState<string>("");
  const [agentTokenVisible, setAgentTokenVisible] = useState<boolean>(false);
  const [integrationStatus, setIntegrationStatus] = useState<{
    siem: boolean;
    webhook: boolean;
    cloud: boolean;
  }>({
    siem: false,
    webhook: false,
    cloud: false,
  });
  const [siemEndpoint, setSiemEndpoint] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [cloudEndpoint, setCloudEndpoint] = useState<string>("");

  const toggleAttackEnabled = (key: AttackKey) => {
    setAttackToggles((prev) =>
      prev.map((a) => (a.key === key ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const getSensitivityLabel = (value: number): string => {
    if (value <= 40) return "Low";
    if (value <= 70) return "Balanced";
    return "Aggressive";
  };

  const handleSaveSettings = () => {
    const settings = {
      // General
      organizationName,
      environment,
      timezone,
      dateFormat,
      // Alerts & Detection
      attackToggles,
      detectionSensitivity,
      minSeverityForAlert,
      autoCloseLowSeverity,
      autoCloseHours,
      // Notifications
      notificationsEnabled,
      emailNotificationsEnabled,
      emailForAlerts,
      slackEnabled,
      slackWebhookUrl,
      genericWebhookEnabled,
      genericWebhookUrl,
      summaryFrequency,
      minSeverityForNotification,
      // Integrations
      apiKey,
      agentToken,
      integrationStatus,
      siemEndpoint,
      webhookUrl,
      cloudEndpoint,
    };
    console.log("Saving settings:", settings);
    // TODO: Add API call to save settings
  };

  const handleTestSlack = () => {
    console.log("Testing Slack notification...");
  };

  const handleTestWebhook = () => {
    console.log("Testing webhook notification...");
  };

  const generateApiKey = () => {
    const newKey = `aegis_${crypto.randomUUID().replace(/-/g, "")}`;
    setApiKey(newKey);
  };

  const generateAgentToken = () => {
    const newToken = `agent_${crypto.randomUUID().replace(/-/g, "")}`;
    setAgentToken(newToken);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: "general" as TabType, label: "General", icon: Settings },
    { id: "alerts" as TabType, label: "Alerts & Detection", icon: Bell },
    { id: "notifications" as TabType, label: "Notifications", icon: Zap },
    { id: "integrations" as TabType, label: "Integrations", icon: Plug2 },
  ];

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const healthData = await checkHealth();
        setHealthStatus(healthData);
      } catch (err) {
        console.error('Failed to load health status:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHealth();
  }, []);

  // Determine IDS status
  const getIDSStatus = () => {
    if (loading && !healthStatus) {
      return { status: 'loading', label: 'Checking' };
    }
    if (!healthStatus) {
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
  const environmentLabel = environment === 'live' ? 'Production' : 'Demo';

  return (
    <div className="aegis-page">
      <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">Settings</h1>
          <p className="aegis-dash-subtitle">
            Configure your Aegis environment, alerts, and integrations.
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
        </div>
      </header>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
          paddingBottom: "2px",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: isActive
                  ? "rgba(59, 130, 246, 0.12)"
                  : "transparent",
                border: "none",
                borderRadius: "8px 8px 0 0",
                color: isActive ? "#60a5fa" : "#9ca9cb",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: isActive
                  ? "2px solid #60a5fa"
                  : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.06)";
                  e.currentTarget.style.color = "#cbd5e1";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9ca9cb";
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "general" && (
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>General Settings</h2>
              <span className="aegis-card-subtitle">
                Configure basic system preferences and environment settings.
              </span>
            </div>
            <div style={{ padding: "24px" }}>
              {/* Settings Form Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                {/* Organization Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label
                    htmlFor="org-name"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#e5e7eb",
                    }}
                  >
                    Organization name
                  </label>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca9cb",
                      margin: 0,
                      marginBottom: "4px",
                    }}
                  >
                    Shown in the dashboard header and reports.
                  </p>
                  <input
                    id="org-name"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Security Labs"
                    style={{
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#60a5fa";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    }}
                  />
                </div>

                {/* Environment Mode */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label
                    htmlFor="environment"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#e5e7eb",
                    }}
                  >
                    Environment
                  </label>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca9cb",
                      margin: 0,
                      marginBottom: "4px",
                    }}
                  >
                    Switch between demo data and live agent telemetry.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      padding: "4px",
                      background: "rgba(15, 23, 42, 0.6)",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <button
                      onClick={() => setEnvironment("demo")}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        background:
                          environment === "demo"
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent",
                        border:
                          environment === "demo"
                            ? "1px solid #60a5fa"
                            : "1px solid transparent",
                        borderRadius: "6px",
                        color: environment === "demo" ? "#60a5fa" : "#9ca9cb",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Demo
                    </button>
                    <button
                      onClick={() => setEnvironment("live")}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        background:
                          environment === "live"
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent",
                        border:
                          environment === "live"
                            ? "1px solid #60a5fa"
                            : "1px solid transparent",
                        borderRadius: "6px",
                        color: environment === "live" ? "#60a5fa" : "#9ca9cb",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Live
                    </button>
                  </div>
                </div>

                {/* Timezone */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label
                    htmlFor="timezone"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#e5e7eb",
                    }}
                  >
                    Timezone
                  </label>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca9cb",
                      margin: 0,
                      marginBottom: "4px",
                    }}
                  >
                    Used for alert timestamps and reporting.
                  </p>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                      fontSize: "14px",
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#60a5fa";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    }}
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="UTC+5">UTC+5 (PKT - Pakistan Standard Time)</option>
                    <option value="UTC+1">UTC+1 (CET - Central European Time)</option>
                    <option value="UTC-5">UTC-5 (EST - Eastern Standard Time)</option>
                    <option value="UTC-8">UTC-8 (PST - Pacific Standard Time)</option>
                    <option value="UTC+8">UTC+8 (CST - China Standard Time)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label
                    htmlFor="date-format"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#e5e7eb",
                    }}
                  >
                    Date format
                  </label>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca9cb",
                      margin: 0,
                      marginBottom: "4px",
                    }}
                  >
                    Controls how dates appear in alerts and logs.
                  </p>
                  <select
                    id="date-format"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                      fontSize: "14px",
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#60a5fa";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    }}
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-05)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (05/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/05/2024)</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <button
                  onClick={handleSaveSettings}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
                  }}
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Alerts & Detection</h2>
              <span className="aegis-card-subtitle">
                Configure detection rules, attack coverage, and alert thresholds.
              </span>
            </div>
            <div style={{ padding: "24px" }}>
              {/* Main Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                {/* Left Column - Attack Coverage */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                      Attack coverage
                    </h3>
                    <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0 }}>
                      Choose which attacks are actively monitored by the IDS pipeline.
                    </p>
                  </div>

                  {/* Attack Toggle Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {attackToggles.map((attack) => (
                      <div
                        key={attack.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "14px 16px",
                          background: "rgba(15, 23, 42, 0.7)",
                          borderRadius: "10px",
                          border: "1px solid rgba(148, 163, 184, 0.15)",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", marginBottom: "4px" }}>
                            {attack.label}
                          </div>
                          <div style={{ fontSize: "12px", color: "#9ca9cb", lineHeight: "1.4" }}>
                            {attack.description}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleAttackEnabled(attack.key)}
                          style={{
                            minWidth: "48px",
                            padding: "4px",
                            borderRadius: "999px",
                            background: attack.enabled ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                            border: attack.enabled ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: attack.enabled ? "flex-end" : "flex-start",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "999px",
                              background: attack.enabled ? "#22c55e" : "#64748b",
                              transition: "all 0.2s ease",
                            }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column - Thresholds & Auto-handling */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Detection Sensitivity */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                        Detection sensitivity
                      </h3>
                      <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0 }}>
                        Controls how aggressive the model is when flagging anomalies (higher = more alerts).
                      </p>
                    </div>

                    <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontSize: "13px", color: "#9ca9cb" }}>Sensitivity level</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb" }}>
                          {detectionSensitivity} / 100 <span style={{ color: "#9ca9cb", fontWeight: 400 }}>({getSensitivityLabel(detectionSensitivity)})</span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={detectionSensitivity}
                        onChange={(e) => setDetectionSensitivity(Number(e.target.value))}
                        className="aegis-sensitivity-slider"
                      />
                    </div>
                  </div>

                  {/* Alert Routing */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                        Alert routing
                      </h3>
                      <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0 }}>
                        Control which severities are raised to the dashboard and how low-risk alerts are handled.
                      </p>
                    </div>

                    <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)", display: "flex", flexDirection: "column", gap: "16px" }}>
                      {/* Minimum Severity */}
                      <div>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#e5e7eb", display: "block", marginBottom: "8px" }}>
                          Minimum severity for dashboard alerts
                        </label>
                        <div style={{ display: "flex", gap: "8px", padding: "4px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                          {(["low", "medium", "high", "critical"] as const).map((severity) => (
                            <button
                              key={severity}
                              onClick={() => setMinSeverityForAlert(severity)}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                background: minSeverityForAlert === severity ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                border: minSeverityForAlert === severity ? "1px solid #60a5fa" : "1px solid transparent",
                                borderRadius: "6px",
                                color: minSeverityForAlert === severity ? "#60a5fa" : "#9ca9cb",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                textTransform: "capitalize",
                              }}
                            >
                              {severity === "low" ? "Low+" : severity === "medium" ? "Med+" : severity === "high" ? "High+" : "Crit"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Auto-close Toggle */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#e5e7eb", display: "block" }}>
                              Auto-close low severity alerts
                            </label>
                            <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0, marginTop: "2px" }}>
                              Automatically close low severity alerts that remain unchanged.
                            </p>
                          </div>
                          <button
                            onClick={() => setAutoCloseLowSeverity(!autoCloseLowSeverity)}
                            style={{
                              minWidth: "48px",
                              padding: "4px",
                              borderRadius: "999px",
                              background: autoCloseLowSeverity ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                              border: autoCloseLowSeverity ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: autoCloseLowSeverity ? "flex-end" : "flex-start",
                              transition: "all 0.2s ease",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "999px",
                                background: autoCloseLowSeverity ? "#22c55e" : "#64748b",
                                transition: "all 0.2s ease",
                              }}
                            />
                          </button>
                        </div>

                        {/* Auto-close Hours Input */}
                        {autoCloseLowSeverity && (
                          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
                            <label style={{ fontSize: "12px", color: "#9ca9cb", display: "block", marginBottom: "6px" }}>
                              Auto-close after (hours)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="168"
                              value={autoCloseHours}
                              onChange={(e) => setAutoCloseHours(Number(e.target.value))}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                background: "rgba(15, 23, 42, 0.6)",
                                border: "1px solid rgba(148, 163, 184, 0.2)",
                                borderRadius: "6px",
                                color: "#e5e7eb",
                                fontSize: "13px",
                                outline: "none",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <button
                  onClick={handleSaveSettings}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
                  }}
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Notifications</h2>
              <span className="aegis-card-subtitle">
                Manage how Aegis delivers alerts, summaries, and channel-specific notifications.
              </span>
            </div>
            <div style={{ padding: "24px" }}>
              {/* Main Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                {/* Left Column - Global + Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Global Notifications Toggle */}
                  <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                          Notifications
                        </h3>
                        <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0 }}>
                          Turn all outbound notifications on or off for this environment.
                        </p>
                      </div>
                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        style={{
                          minWidth: "48px",
                          padding: "4px",
                          borderRadius: "999px",
                          background: notificationsEnabled ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                          border: notificationsEnabled ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: notificationsEnabled ? "flex-end" : "flex-start",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "999px",
                            background: notificationsEnabled ? "#22c55e" : "#64748b",
                            transition: "all 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Email Alerts Section */}
                  <div
                    style={{
                      opacity: notificationsEnabled ? 1 : 0.5,
                      pointerEvents: notificationsEnabled ? "auto" : "none",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                        Email alerts
                      </h3>
                      <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0 }}>
                        Configure direct email alerts for high-priority events.
                      </p>
                    </div>

                    <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)", display: "flex", flexDirection: "column", gap: "16px" }}>
                      {/* Email Toggle */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#e5e7eb" }}>
                          Email notifications
                        </label>
                        <button
                          onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                          disabled={!notificationsEnabled}
                          style={{
                            minWidth: "48px",
                            padding: "4px",
                            borderRadius: "999px",
                            background: emailNotificationsEnabled ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                            border: emailNotificationsEnabled ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: emailNotificationsEnabled ? "flex-end" : "flex-start",
                            transition: "all 0.2s ease",
                            cursor: notificationsEnabled ? "pointer" : "not-allowed",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "999px",
                              background: emailNotificationsEnabled ? "#22c55e" : "#64748b",
                              transition: "all 0.2s ease",
                            }}
                          />
                        </button>
                      </div>

                      {/* Email Input */}
                      <div>
                        <label htmlFor="email-alerts" style={{ fontSize: "13px", fontWeight: 600, color: "#e5e7eb", display: "block", marginBottom: "6px" }}>
                          Alert recipient email
                        </label>
                        <input
                          id="email-alerts"
                          type="email"
                          value={emailForAlerts}
                          onChange={(e) => setEmailForAlerts(e.target.value)}
                          disabled={!notificationsEnabled || !emailNotificationsEnabled}
                          placeholder="security@company.com"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            borderRadius: "8px",
                            color: "#e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                            transition: "all 0.2s ease",
                            cursor: notificationsEnabled && emailNotificationsEnabled ? "text" : "not-allowed",
                          }}
                          onFocus={(e) => {
                            if (notificationsEnabled && emailNotificationsEnabled) {
                              e.currentTarget.style.borderColor = "#60a5fa";
                              e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
                            }
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                            e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                          }}
                        />
                        <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0, marginTop: "6px" }}>
                          Critical and high-severity alerts will be sent to this address based on your thresholds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Severity, Summaries, Channels */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    opacity: notificationsEnabled ? 1 : 0.5,
                    pointerEvents: notificationsEnabled ? "auto" : "none",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {/* Minimum Severity for Notifications */}
                  <div>
                    <div style={{ marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                        Minimum severity for notifications
                      </h3>
                      <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0 }}>
                        Control which alert severities trigger outbound notifications.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", padding: "4px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                      {(["low", "medium", "high", "critical"] as const).map((severity) => (
                        <button
                          key={severity}
                          onClick={() => setMinSeverityForNotification(severity)}
                          disabled={!notificationsEnabled}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            background: minSeverityForNotification === severity ? "rgba(59, 130, 246, 0.2)" : "transparent",
                            border: minSeverityForNotification === severity ? "1px solid #60a5fa" : "1px solid transparent",
                            borderRadius: "6px",
                            color: minSeverityForNotification === severity ? "#60a5fa" : "#9ca9cb",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: notificationsEnabled ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                            textTransform: "capitalize",
                          }}
                        >
                          {severity === "low" ? "Low+" : severity === "medium" ? "Med+" : severity === "high" ? "High+" : "Crit"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Emails */}
                  <div>
                    <div style={{ marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                        Summary emails
                      </h3>
                      <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0 }}>
                        Receive a digest of alerts and activity instead of individual messages.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", padding: "4px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
                      {(["none", "daily", "weekly"] as const).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setSummaryFrequency(freq)}
                          disabled={!notificationsEnabled}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            background: summaryFrequency === freq ? "rgba(59, 130, 246, 0.2)" : "transparent",
                            border: summaryFrequency === freq ? "1px solid #60a5fa" : "1px solid transparent",
                            borderRadius: "6px",
                            color: summaryFrequency === freq ? "#60a5fa" : "#9ca9cb",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: notificationsEnabled ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                            textTransform: "capitalize",
                          }}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0, marginTop: "8px" }}>
                      Summaries are sent at 09:00 environment time and include trends, top attacks, and unresolved alerts.
                    </p>
                  </div>

                  {/* Other Channels - Slack & Webhook */}
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "12px" }}>
                      Other channels
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {/* Slack Card */}
                      <div style={{ padding: "14px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "2px" }}>
                              Slack
                            </h4>
                            <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0 }}>
                              Forward alerts to a Slack channel via incoming webhook.
                            </p>
                          </div>
                          <button
                            onClick={() => setSlackEnabled(!slackEnabled)}
                            disabled={!notificationsEnabled}
                            style={{
                              minWidth: "44px",
                              padding: "3px",
                              borderRadius: "999px",
                              background: slackEnabled ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                              border: slackEnabled ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: slackEnabled ? "flex-end" : "flex-start",
                              transition: "all 0.2s ease",
                              cursor: notificationsEnabled ? "pointer" : "not-allowed",
                            }}
                          >
                            <span
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "999px",
                                background: slackEnabled ? "#22c55e" : "#64748b",
                                transition: "all 0.2s ease",
                              }}
                            />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={slackWebhookUrl}
                          onChange={(e) => setSlackWebhookUrl(e.target.value)}
                          disabled={!notificationsEnabled || !slackEnabled}
                          placeholder="https://hooks.slack.com/..."
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            borderRadius: "6px",
                            color: "#e5e7eb",
                            fontSize: "12px",
                            outline: "none",
                            marginBottom: "8px",
                            cursor: notificationsEnabled && slackEnabled ? "text" : "not-allowed",
                          }}
                        />
                        <button
                          onClick={handleTestSlack}
                          disabled={!notificationsEnabled || !slackEnabled || !slackWebhookUrl}
                          style={{
                            width: "100%",
                            padding: "6px 12px",
                            background: "rgba(59, 130, 246, 0.15)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "6px",
                            color: "#60a5fa",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: notificationsEnabled && slackEnabled && slackWebhookUrl ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Send test notification
                        </button>
                      </div>

                      {/* Generic Webhook Card */}
                      <div style={{ padding: "14px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "2px" }}>
                              HTTP webhook
                            </h4>
                            <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0 }}>
                              Send JSON alert payloads to an external system or SIEM.
                            </p>
                          </div>
                          <button
                            onClick={() => setGenericWebhookEnabled(!genericWebhookEnabled)}
                            disabled={!notificationsEnabled}
                            style={{
                              minWidth: "44px",
                              padding: "3px",
                              borderRadius: "999px",
                              background: genericWebhookEnabled ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                              border: genericWebhookEnabled ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: genericWebhookEnabled ? "flex-end" : "flex-start",
                              transition: "all 0.2s ease",
                              cursor: notificationsEnabled ? "pointer" : "not-allowed",
                            }}
                          >
                            <span
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "999px",
                                background: genericWebhookEnabled ? "#22c55e" : "#64748b",
                                transition: "all 0.2s ease",
                              }}
                            />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={genericWebhookUrl}
                          onChange={(e) => setGenericWebhookUrl(e.target.value)}
                          disabled={!notificationsEnabled || !genericWebhookEnabled}
                          placeholder="https://api.example.com/webhook"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            borderRadius: "6px",
                            color: "#e5e7eb",
                            fontSize: "12px",
                            outline: "none",
                            marginBottom: "8px",
                            cursor: notificationsEnabled && genericWebhookEnabled ? "text" : "not-allowed",
                          }}
                        />
                        <button
                          onClick={handleTestWebhook}
                          disabled={!notificationsEnabled || !genericWebhookEnabled || !genericWebhookUrl}
                          style={{
                            width: "100%",
                            padding: "6px 12px",
                            background: "rgba(59, 130, 246, 0.15)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "6px",
                            color: "#60a5fa",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: notificationsEnabled && genericWebhookEnabled && genericWebhookUrl ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Send test notification
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <button
                  onClick={handleSaveSettings}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
                  }}
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Integrations</h2>
              <span className="aegis-card-subtitle">
                Connect Aegis to external systems, agents, and automation tools.
              </span>
            </div>
            <div style={{ padding: "24px" }}>
              {/* Main Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                {/* Left Column - API Keys & Tokens */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* API Key Management */}
                  <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                      API Key
                    </h3>
                    <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0, marginBottom: "12px" }}>
                      Used for backend integrations and automation workflows.
                    </p>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                      <input
                        type={apiKeyVisible ? "text" : "password"}
                        value={apiKey}
                        placeholder="No API key generated"
                        disabled
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          background: "rgba(15, 23, 42, 0.6)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px",
                          color: "#e5e7eb",
                          fontSize: "13px",
                          outline: "none",
                          fontFamily: "monospace",
                        }}
                      />
                      <button
                        onClick={() => setApiKeyVisible(!apiKeyVisible)}
                        style={{
                          padding: "10px 16px",
                          background: "rgba(148, 163, 184, 0.15)",
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          borderRadius: "8px",
                          color: "#9ca9cb",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {apiKeyVisible ? "Hide" : "Show"}
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={generateApiKey}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Generate new key
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey)}
                        disabled={!apiKey}
                        style={{
                          padding: "10px 16px",
                          background: "rgba(148, 163, 184, 0.15)",
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          borderRadius: "8px",
                          color: "#9ca9cb",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: apiKey ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Agent Token */}
                  <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                      Agent Token
                    </h3>
                    <p style={{ fontSize: "12px", color: "#9ca9cb", margin: 0, marginBottom: "12px" }}>
                      Used by Aegis agents installed on endpoints to authenticate securely.
                    </p>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                      <input
                        type={agentTokenVisible ? "text" : "password"}
                        value={agentToken}
                        placeholder="No agent token generated"
                        disabled
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          background: "rgba(15, 23, 42, 0.6)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px",
                          color: "#e5e7eb",
                          fontSize: "13px",
                          outline: "none",
                          fontFamily: "monospace",
                        }}
                      />
                      <button
                        onClick={() => setAgentTokenVisible(!agentTokenVisible)}
                        style={{
                          padding: "10px 16px",
                          background: "rgba(148, 163, 184, 0.15)",
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          borderRadius: "8px",
                          color: "#9ca9cb",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {agentTokenVisible ? "Hide" : "Show"}
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={generateAgentToken}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Generate new token
                      </button>
                      <button
                        onClick={() => copyToClipboard(agentToken)}
                        disabled={!agentToken}
                        style={{
                          padding: "10px 16px",
                          background: "rgba(148, 163, 184, 0.15)",
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          borderRadius: "8px",
                          color: "#9ca9cb",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: agentToken ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Connected Integrations */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "4px" }}>
                    Connected Integrations
                  </h3>

                  {/* SIEM Integration */}
                  <div style={{ padding: "14px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "2px" }}>
                          SIEM / Log Ingestion
                        </h4>
                        <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0 }}>
                          Forward IDS alerts to Splunk, ELK, Chronicle, or any SIEM supporting JSON ingestion.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setIntegrationStatus((prev) => ({ ...prev, siem: !prev.siem }))
                        }
                        style={{
                          minWidth: "44px",
                          padding: "3px",
                          borderRadius: "999px",
                          background: integrationStatus.siem ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                          border: integrationStatus.siem ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: integrationStatus.siem ? "flex-end" : "flex-start",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "999px",
                            background: integrationStatus.siem ? "#22c55e" : "#64748b",
                            transition: "all 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                    {integrationStatus.siem && (
                      <div>
                        <label style={{ fontSize: "12px", color: "#9ca9cb", display: "block", marginBottom: "6px" }}>
                          Ingestion endpoint URL
                        </label>
                        <input
                          type="text"
                          value={siemEndpoint}
                          onChange={(e) => setSiemEndpoint(e.target.value)}
                          placeholder="https://siem.example.com/api/ingest"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            borderRadius: "6px",
                            color: "#e5e7eb",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Webhook Integration */}
                  <div style={{ padding: "14px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "2px" }}>
                          Automation Webhook
                        </h4>
                        <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0 }}>
                          Trigger external workflows such as SOAR playbooks or ticketing systems.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setIntegrationStatus((prev) => ({ ...prev, webhook: !prev.webhook }))
                        }
                        style={{
                          minWidth: "44px",
                          padding: "3px",
                          borderRadius: "999px",
                          background: integrationStatus.webhook ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                          border: integrationStatus.webhook ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: integrationStatus.webhook ? "flex-end" : "flex-start",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "999px",
                            background: integrationStatus.webhook ? "#22c55e" : "#64748b",
                            transition: "all 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                    {integrationStatus.webhook && (
                      <div>
                        <label style={{ fontSize: "12px", color: "#9ca9cb", display: "block", marginBottom: "6px" }}>
                          Webhook URL
                        </label>
                        <input
                          type="text"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://automation.example.com/webhook"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            borderRadius: "6px",
                            color: "#e5e7eb",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Cloud Integration */}
                  <div style={{ padding: "14px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "10px", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", margin: 0, marginBottom: "2px" }}>
                          Cloud Monitoring
                        </h4>
                        <p style={{ fontSize: "11px", color: "#9ca9cb", margin: 0 }}>
                          Send telemetry to AWS Security Hub or GCP SCC.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setIntegrationStatus((prev) => ({ ...prev, cloud: !prev.cloud }))
                        }
                        style={{
                          minWidth: "44px",
                          padding: "3px",
                          borderRadius: "999px",
                          background: integrationStatus.cloud ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.15)",
                          border: integrationStatus.cloud ? "1px solid #22c55e" : "1px solid rgba(148, 163, 184, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: integrationStatus.cloud ? "flex-end" : "flex-start",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "999px",
                            background: integrationStatus.cloud ? "#22c55e" : "#64748b",
                            transition: "all 0.2s ease",
                          }}
                        />
                      </button>
                    </div>
                    {integrationStatus.cloud && (
                      <div>
                        <label style={{ fontSize: "12px", color: "#9ca9cb", display: "block", marginBottom: "6px" }}>
                          Cloud endpoint
                        </label>
                        <input
                          type="text"
                          value={cloudEndpoint}
                          onChange={(e) => setCloudEndpoint(e.target.value)}
                          placeholder="arn:aws:securityhub:..."
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            borderRadius: "6px",
                            color: "#e5e7eb",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <button
                  onClick={handleSaveSettings}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
                  }}
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
