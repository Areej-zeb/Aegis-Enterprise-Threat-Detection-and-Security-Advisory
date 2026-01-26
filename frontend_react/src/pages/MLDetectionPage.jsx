// src/pages/MLDetectionPage.jsx
// Real-time ML Detection Dashboard with integrated models

import { useState, useEffect } from 'react';
import { useLiveDetection } from '../hooks/useLiveDetection';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Database, 
  TrendingUp, 
  Download,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Filter,
  ScrollText,
  BrainCircuit,
  Server,
  Circle
} from 'lucide-react';
import { exportDetectionsAsJSON, exportDetectionsAsCSV } from '../api/detectionClient';
import { SeverityBadge } from '../components/common';
import { getSeverityColor, CRITICAL_SEVERITY_COLOR } from '../utils/severityUtils';
import '../index.css';

export default function MLDetectionPage() {
  const [attackTypeFilter, setAttackTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState(['critical', 'high', 'medium', 'low']);
  const [autoScroll, setAutoScroll] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  
  const {
    detections,
    metrics,
    systemInfo,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    clearDetections,
    refreshMetrics,
    fetchBatchDetections
  } = useLiveDetection({ maxAlerts: 200 });
  
  // Filter detections
  const filteredDetections = detections.filter(d => {
    const matchesAttack = attackTypeFilter === 'all' || d.model_type === attackTypeFilter;
    const matchesSeverity = severityFilter.includes(d.severity);
    return matchesAttack && matchesSeverity;
  });
  
  // Calculate stats
  const totalDetections = detections.length;
  const threats = detections.filter(d => d.label === 'ATTACK').length;
  const benign = detections.filter(d => d.label === 'BENIGN').length;
  const criticalAlerts = detections.filter(d => d.severity === 'critical').length;
  
  // Attack type distribution
  const attackDistribution = detections.reduce((acc, d) => {
    acc[d.model_type] = (acc[d.model_type] || 0) + 1;
    return acc;
  }, {});
  
  useEffect(() => {
    if (autoScroll) {
      const alertsContainer = document.getElementById('alerts-container');
      if (alertsContainer) {
        alertsContainer.scrollTop = alertsContainer.scrollHeight;
      }
    }
  }, [detections, autoScroll]);

  // Toggle severity filter
  const toggleSeverity = (severity) => {
    if (severityFilter.includes(severity)) {
      setSeverityFilter(severityFilter.filter(s => s !== severity));
    } else {
      setSeverityFilter([...severityFilter, severity]);
    }
  };

  const getLabelColor = (label) => {
    if (label === 'ATTACK') {
      return {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.6)',
      };
    }
    return {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#4ade80',
      border: '1px solid rgba(34, 197, 94, 0.7)',
    };
  };
  
  return (
    <div className="aegis-page">
      {/* Header */}
      <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">
            ML Detection Dashboard
          </h1>
          <p className="aegis-dash-subtitle">
            Real-time threat detection using XGBoost and Ensemble ML models
          </p>
        </div>
        <div className="ids-header-right-new">
          {/* Status pill */}
          <div className={`ids-status-pill-neon ids-status-pill-neon--${
            isConnected ? 'healthy' : 
            error ? 'error' : 
            'warning'
          }`}>
            <Circle
              className={`ids-status-dot-icon ${
                isConnected ? 'ids-status-dot-icon--healthy' : 
                error ? 'ids-status-dot-icon--error' : 
                'ids-status-dot-icon--warning'
              }`}
              fill="currentColor"
            />
            <span className="ids-status-text">
              Status: <span className="ids-status-value">
                {isConnected ? 'Live' : error ? 'Error' : 'Ready'}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="aegis-card" style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderColor: 'rgba(239, 68, 68, 0.5)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} color="#f87171" />
            <div>
              <strong style={{ color: '#f87171' }}>Error:</strong>
              <span style={{ color: '#fca5a5', marginLeft: '0.5rem' }}>{error}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* System Status Card */}
      {systemInfo && systemInfo.models && (
        <div className="aegis-card" style={{ marginBottom: '1.5rem' }}>
          <div className="aegis-card-header">
            <div>
              <h2>System Status</h2>
              <p className="aegis-card-subtext">
                ML models loaded and ready for detection
              </p>
            </div>
            <Server size={20} strokeWidth={1.6} style={{ color: '#60a5fa' }} />
          </div>
          <div className="aegis-dash-top-row" style={{ marginTop: '1rem' }}>
            {Object.entries(systemInfo.models).map(([name, info]) => (
              <div key={name} className="aegis-stat-card">
                <div className="aegis-stat-meta">
                  <div className="aegis-stat-icon">
                    <Database size={18} strokeWidth={1.6} />
                  </div>
                  <span className="aegis-stat-label">{name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca9cb' }}>
                    Type: <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{info.type || 'N/A'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca9cb' }}>
                    Classes: <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{info.num_classes || 'N/A'}</span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span className="ids-severity-pill ids-severity-low" style={{ 
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      borderColor: 'rgba(34, 197, 94, 0.7)',
                      fontSize: '11px',
                      padding: '2px 8px'
                    }}>
                      <CheckCircle size={10} style={{ marginRight: '4px' }} />
                      Loaded
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ML Metrics Cards */}
      <section className="aegis-dash-top-row" style={{ marginBottom: '1.5rem' }}>
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <Activity size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Total Detections</span>
          </div>
          <div className="aegis-stat-main-row">
            <span className="aegis-stat-value">{totalDetections}</span>
          </div>
        </div>
        
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <Shield size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Threats Detected</span>
          </div>
          <div className="aegis-stat-main-row">
            <span className="aegis-stat-value" style={{ color: '#f87171' }}>{threats}</span>
          </div>
        </div>
        
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <CheckCircle size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Benign Traffic</span>
          </div>
          <div className="aegis-stat-main-row">
            <span className="aegis-stat-value" style={{ color: '#4ade80' }}>{benign}</span>
          </div>
        </div>
        
        <div className="aegis-stat-card">
          <div className="aegis-stat-meta">
            <div className="aegis-stat-icon">
              <Zap size={18} strokeWidth={1.6} />
            </div>
            <span className="aegis-stat-label">Critical Alerts</span>
          </div>
          <div className="aegis-stat-main-row">
            <span className="aegis-stat-value" style={{ color: CRITICAL_SEVERITY_COLOR }}>
              {criticalAlerts}
            </span>
          </div>
        </div>
      </section>

      {/* Performance Metrics Card */}
      {metrics && (
        <div className="aegis-card" style={{ marginBottom: '1.5rem' }}>
          <div className="aegis-card-header">
            <div>
              <h2>Model Performance</h2>
              <p className="aegis-card-subtext">
                Real-time accuracy metrics from active models
              </p>
            </div>
            <TrendingUp size={20} strokeWidth={1.6} style={{ color: '#60a5fa' }} />
          </div>
          <div className="aegis-dash-top-row" style={{ marginTop: '1rem' }}>
            <div className="aegis-stat-card">
              <div className="aegis-stat-meta">
                <div className="aegis-stat-icon">
                  <Activity size={18} strokeWidth={1.6} />
                </div>
                <span className="aegis-stat-label">Accuracy</span>
              </div>
              <div className="aegis-stat-main-row">
                <span className="aegis-stat-value" style={{ color: '#60a5fa' }}>
                  {(metrics.accuracy * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="aegis-stat-card">
              <div className="aegis-stat-meta">
                <div className="aegis-stat-icon">
                  <Shield size={18} strokeWidth={1.6} />
                </div>
                <span className="aegis-stat-label">Precision</span>
              </div>
              <div className="aegis-stat-main-row">
                <span className="aegis-stat-value" style={{ color: '#4ade80' }}>
                  {(metrics.precision * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="aegis-stat-card">
              <div className="aegis-stat-meta">
                <div className="aegis-stat-icon">
                  <AlertTriangle size={18} strokeWidth={1.6} />
                </div>
                <span className="aegis-stat-label">Recall</span>
              </div>
              <div className="aegis-stat-main-row">
                <span className="aegis-stat-value" style={{ color: '#fbbf24' }}>
                  {(metrics.recall * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="aegis-stat-card">
              <div className="aegis-stat-meta">
                <div className="aegis-stat-icon">
                  <TrendingUp size={18} strokeWidth={1.6} />
                </div>
                <span className="aegis-stat-label">F1 Score</span>
              </div>
              <div className="aegis-stat-main-row">
                <span className="aegis-stat-value" style={{ color: '#a78bfa' }}>
                  {(metrics.f1_score * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          {metrics.true_positives !== undefined && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <h3 style={{ fontSize: '13px', color: '#9ca9cb', marginBottom: '1rem', fontWeight: 600 }}>
                Confusion Matrix
              </h3>
              <div className="aegis-dash-top-row">
                <div className="aegis-stat-card">
                  <div className="aegis-stat-meta">
                    <span className="aegis-stat-label">True Positives</span>
                  </div>
                  <div className="aegis-stat-main-row">
                    <span className="aegis-stat-value" style={{ color: '#4ade80', fontSize: '20px' }}>
                      {metrics.true_positives}
                    </span>
                  </div>
                </div>
                <div className="aegis-stat-card">
                  <div className="aegis-stat-meta">
                    <span className="aegis-stat-label">False Positives</span>
                  </div>
                  <div className="aegis-stat-main-row">
                    <span className="aegis-stat-value" style={{ color: '#f87171', fontSize: '20px' }}>
                      {metrics.false_positives}
                    </span>
                  </div>
                </div>
                <div className="aegis-stat-card">
                  <div className="aegis-stat-meta">
                    <span className="aegis-stat-label">False Negatives</span>
                  </div>
                  <div className="aegis-stat-main-row">
                    <span className="aegis-stat-value" style={{ color: '#fbbf24', fontSize: '20px' }}>
                      {metrics.false_negatives}
                    </span>
                  </div>
                </div>
                <div className="aegis-stat-card">
                  <div className="aegis-stat-meta">
                    <span className="aegis-stat-label">True Negatives</span>
                  </div>
                  <div className="aegis-stat-main-row">
                    <span className="aegis-stat-value" style={{ color: '#60a5fa', fontSize: '20px' }}>
                      {metrics.true_negatives}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Controls Card */}
      <div className="aegis-card" style={{ marginBottom: '1.5rem' }}>
        <div className="aegis-card-header">
          <div>
            <h2>Controls</h2>
            <p className="aegis-card-subtext">
              Filter detections and manage live stream
            </p>
          </div>
          <Filter size={20} strokeWidth={1.6} style={{ color: '#60a5fa' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Attack Type Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#9ca9cb', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Attack Type
            </label>
            <select
              value={attackTypeFilter}
              onChange={(e) => setAttackTypeFilter(e.target.value)}
              className="aegis-input"
              style={{ 
                width: '100%',
                maxWidth: '300px',
                background: 'rgba(15, 24, 50, 0.65)',
                border: '1px solid rgba(114, 135, 187, 0.4)',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                color: '#f5f7fb',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Types</option>
              <option value="Syn">SYN Flood</option>
              <option value="mitm_arp">MITM ARP</option>
              <option value="dns_exfiltration">DNS Exfiltration</option>
            </select>
          </div>

          {/* Severity Filters - Pill Toggles */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#9ca9cb', 
              marginBottom: '0.75rem',
              fontWeight: 500
            }}>
              Severity Filter
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {['critical', 'high', 'medium', 'low'].map(sev => {
                const isActive = severityFilter.includes(sev);
                const colors = getSeverityColor(sev);
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => toggleSeverity(sev)}
                    className="ids-severity-pill"
                    style={{
                      background: isActive ? colors.bg : 'rgba(148, 163, 184, 0.1)',
                      color: isActive ? colors.color : '#94a3b8',
                      border: `1px solid ${isActive ? colors.border || colors.color : 'rgba(148, 163, 184, 0.4)'}`,
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'capitalize',
                      opacity: isActive ? 1 : 0.6
                    }}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            alignItems: 'center'
          }}>
            {/* Auto-scroll Toggle */}
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className="aegis-pill-switch"
              style={{
                background: autoScroll ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                borderColor: autoScroll ? 'rgba(59, 130, 246, 0.7)' : 'rgba(148, 163, 184, 0.4)',
                color: autoScroll ? '#60a5fa' : '#9ca9cb'
              }}
            >
              <ScrollText size={14} />
              Auto-scroll
            </button>

            {/* Compact Action Buttons Group */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.75rem',
              marginLeft: 'auto'
            }}>
              {/* Start/Stop Live Stream */}
              <button
                type="button"
                onClick={isConnected ? disconnect : connect}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: isConnected 
                    ? '1px solid rgba(255, 51, 102, 0.5)' 
                    : '1px solid rgba(34, 197, 94, 0.5)',
                  background: isConnected 
                    ? 'rgba(255, 51, 102, 0.15)' 
                    : 'rgba(34, 197, 94, 0.15)',
                  color: isConnected ? '#ff6b9d' : '#4ade80',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease-out',
                  boxShadow: isConnected 
                    ? '0 0 12px rgba(255, 51, 102, 0.2)' 
                    : '0 0 12px rgba(34, 197, 94, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = isConnected 
                      ? 'rgba(255, 51, 102, 0.25)' 
                      : 'rgba(34, 197, 94, 0.25)';
                    e.currentTarget.style.boxShadow = isConnected 
                      ? '0 0 16px rgba(255, 51, 102, 0.4)' 
                      : '0 0 16px rgba(34, 197, 94, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isConnected 
                    ? 'rgba(255, 51, 102, 0.15)' 
                    : 'rgba(34, 197, 94, 0.15)';
                  e.currentTarget.style.boxShadow = isConnected 
                    ? '0 0 12px rgba(255, 51, 102, 0.2)' 
                    : '0 0 12px rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isConnected ? (
                  <>
                    <Square size={14} />
                    Stop Live Stream
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Start Live Stream
                  </>
                )}
              </button>

              {/* Fetch Batch */}
              <button
                type="button"
                onClick={() => fetchBatchDetections(20)}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease-out',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin-slow' : ''} />
                Fetch Batch
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={clearDetections}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  boxShadow: '0 0 8px rgba(148, 163, 184, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.7)';
                  e.currentTarget.style.color = '#cbd5e1';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(148, 163, 184, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.5)';
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(148, 163, 184, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#a78bfa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(139, 92, 246, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Download size={14} />
                Export
              </button>
              {exportMenuOpen && (
                <>
                  <div 
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 10
                    }}
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'rgba(10, 18, 39, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    minWidth: '180px',
                    zIndex: 20,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        exportDetectionsAsJSON(detections);
                        setExportMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                        fontSize: '14px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Export as JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportDetectionsAsCSV(detections);
                        setExportMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                        fontSize: '14px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Export as CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Live Detections Table Card */}
      <div className="aegis-card">
        <div className="aegis-card-header">
          <div>
            <h2>Live Detections</h2>
            <p className="aegis-card-subtext">
              {filteredDetections.length} detection{filteredDetections.length !== 1 ? 's' : ''} shown
            </p>
          </div>
          <Activity size={20} strokeWidth={1.6} style={{ color: isConnected ? '#4ade80' : '#9ca9cb' }} />
        </div>
        
        <div 
          id="alerts-container" 
          style={{ 
            overflow: 'auto', 
            maxHeight: '600px',
            marginTop: '1rem'
          }}
        >
          {filteredDetections.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                {isConnected 
                  ? 'Waiting for detections...' 
                  : 'Click "Start Live Stream" to begin monitoring'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="aegis-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Protocol</th>
                    <th>Attack Type</th>
                    <th>Severity</th>
                    <th>Score</th>
                    <th>Label</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDetections.map((detection) => {
                    const labelStyle = getLabelColor(detection.label);
                    return (
                      <tr key={detection.id}>
                        <td style={{ fontSize: '13px', color: '#e5e7eb' }}>
                          {new Date(detection.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace' }}>
                          {detection.src_ip || 'N/A'}:{detection.src_port || 'N/A'}
                        </td>
                        <td style={{ fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace' }}>
                          {detection.dst_ip || 'N/A'}:{detection.dst_port || 'N/A'}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.4)'
                          }}>
                            {detection.protocol || 'N/A'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#e5e7eb' }}>
                          {detection.attack_type || detection.model_type || 'N/A'}
                        </td>
                        <td>
                          <SeverityBadge severity={detection.severity} />
                        </td>
                        <td style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 500 }}>
                          {(detection.score * 100).toFixed(1)}%
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            ...labelStyle
                          }}>
                            {detection.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
