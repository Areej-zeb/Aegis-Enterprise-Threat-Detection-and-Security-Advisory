import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAnalyticsDashboard } from '../../../hooks/useAnalyticsDashboard';
import { AnalyticsTimeRangeSelector } from './AnalyticsTimeRangeSelector';
import { AnalyticsMetricsCards } from './AnalyticsMetricsCards';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AnalyticsTopTalkers } from './AnalyticsTopTalkers';

interface AnalyticsDashboardProps {
  alerts?: any[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ alerts }) => {
  const {
    timeRange,
    setTimeRangePreset,
    data,
    loading,
    error,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    refetch,
  } = useAnalyticsDashboard();

  // Update analytics when alerts change
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      refetch();
    }
  }, [alerts, refetch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f5f7fb', margin: 0 }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#9fb3d9', margin: '4px 0 0 0' }}>
            Real-time intelligence from IDS alerts
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#5ac9ff',
            border: 'none',
            borderRadius: '6px',
            color: '#050b1a',
            fontWeight: '600',
            fontSize: '13px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = '#4ab8ee';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = '#5ac9ff';
          }}
        >
          <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Time Range Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <AnalyticsTimeRangeSelector
          currentRange={timeRange.label}
          onRangeChange={setTimeRangePreset}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#ff6b6b',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#9fb3d9', fontWeight: '600' }}>Active Filters:</span>
          {Object.entries(filters).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: 'rgba(90, 201, 255, 0.1)',
                border: '1px solid rgba(90, 201, 255, 0.3)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#5ac9ff',
              }}
            >
              <span>{key}: {value}</span>
              <button
                onClick={() => removeFilter(key)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5ac9ff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={clearFilters}
            style={{
              padding: '4px 12px',
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '4px',
              color: '#9fb3d9',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <AnalyticsMetricsCards summary={data?.summary || null} loading={loading} />

      {/* Charts */}
      {data && (
        <AnalyticsCharts
          timeline={data.timeline}
          attackTypes={data.attack_types}
          severityBreakdown={data.severity_breakdown}
          onAttackTypeClick={(type) => addFilter('attackType', type)}
          loading={loading}
        />
      )}

      {/* Top Talkers */}
      {data && (
        <AnalyticsTopTalkers
          talkers={data.top_talkers}
          onIPClick={(ip) => addFilter('ip', ip)}
          loading={loading}
        />
      )}
    </div>
  );
};
