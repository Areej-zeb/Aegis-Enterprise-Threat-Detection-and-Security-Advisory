/**
 * Analyze Page
 * Deep investigation and analytics with charts
 * Uses AnalyzeLayout with design system components and tokens
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyzeLayout } from '@/components/layouts';
import { Button, Card, Input } from '@/components/base';
import { Select } from '@/components/composite';
import { TimeSeriesChart, DonutChart, BarChart } from '@/components/shared/charts';
import { useWorkflow } from '@/context/WorkflowContext';
import { useDataLoader } from '@/hooks/useDataLoader';
import { DataStateRenderer } from '@/components/common';
import { spacing, colors, typography } from '@/theme/tokens';

interface AnalyticsData {
  timeSeriesData: Array<{ timestamp: string; value: number }>;
  attackDistribution: Array<{ label: string; value: number }>;
  severityBreakdown: Array<{ label: string; value: number }>;
  topTalkers: Array<{ ip: string; count: number; severity: string }>;
  protocolDistribution: Array<{ label: string; value: number }>;
  geoDistribution: Array<{ country: string; count: number }>;
}

const TIME_RANGE_OPTIONS = [
  { value: '15m', label: 'Last 15 minutes' },
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

/**
 * Analyze Page Component
 * Deep investigation and analytics dashboard
 */
export const Analyze: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAlert } = useWorkflow();

  const [timeRange, setTimeRange] = useState('24h');
  const [compareEnabled, setCompareEnabled] = useState(false);

  // Load analytics data
  const {
    data: analyticsData,
    state: analyticsState,
    error: analyticsError,
    refresh: refreshAnalytics,
  } = useDataLoader<AnalyticsData>({
    onFetch: () => fetchAnalyticsData(timeRange),
  });

  const headerActions = (
    <div style={{
      display: 'flex',
      gap: spacing[3],
      flexWrap: 'wrap',
    }}>
      <Select
        options={TIME_RANGE_OPTIONS}
        value={timeRange}
        onChange={(value: string) => setTimeRange(value)}
        size="sm"
      />
      <Button variant="secondary" size="sm" onClick={refreshAnalytics}>
        Refresh
      </Button>
      <Button variant="secondary" size="sm">
        Export PDF
      </Button>
    </div>
  );

  const sidebar = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[6],
    }}>
      <Card elevation="md">
        <Card.Header title="Analysis Context" />
        <Card.Body>
          {selectedAlert ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[3],
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[1],
              }}>
                <span style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Alert Type:</span>
                <code style={{
                  fontFamily: 'monospace',
                  fontSize: typography.fontSize.sm,
                  color: colors.primary[400],
                  backgroundColor: `rgba(59, 92, 255, 0.1)`,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: '0.5rem',
                  wordBreak: 'break-all',
                }}>{selectedAlert.type}</code>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[1],
              }}>
                <span style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Source IP:</span>
                <code style={{
                  fontFamily: 'monospace',
                  fontSize: typography.fontSize.sm,
                  color: colors.primary[400],
                  backgroundColor: `rgba(59, 92, 255, 0.1)`,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: '0.5rem',
                  wordBreak: 'break-all',
                }}>{selectedAlert.sourceIp}</code>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[1],
              }}>
                <span style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Severity:</span>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                }}>{selectedAlert.severity}</span>
              </div>
            </div>
          ) : (
            <p style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}>No alert context selected</p>
          )}
        </Card.Body>
      </Card>

      <Card elevation="md">
        <Card.Header title="Quick Actions" />
        <Card.Body>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
          }}>
            <Button fullWidth variant="secondary" size="sm" onClick={() => navigate('/monitor')}>
              Back to Monitor
            </Button>
            <Button fullWidth variant="secondary" size="sm" onClick={() => navigate('/pentest')}>
              Run Pentest
            </Button>
            <Button fullWidth variant="primary" size="sm" onClick={() => navigate('/assistant')}>
              Ask AI
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[8],
    }}>
      {/* Context Banner */}
      {selectedAlert && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing[4],
          padding: spacing[4],
          backgroundColor: `rgba(59, 92, 255, 0.1)`,
          border: `1px solid ${colors.primary[500]}`,
          borderRadius: '0.5rem',
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
          }}>
            Analyzing: <strong>{selectedAlert.type}</strong> from <code style={{
              fontFamily: 'monospace',
              color: colors.primary[400],
              backgroundColor: `rgba(59, 92, 255, 0.2)`,
              padding: '2px 6px',
              borderRadius: '0.25rem',
            }}>{selectedAlert.sourceIp}</code>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/monitor')}>
            Clear Context
          </Button>
        </div>
      )}

      {/* Charts Grid */}
      <DataStateRenderer
        state={analyticsState}
        error={analyticsError}
        isEmpty={!analyticsData}
        onRefresh={refreshAnalytics}
        emptyMessage="No analytics data available"
      >
        {analyticsData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: spacing[6],
          }}>
            {/* Row 1: Time Series & Attack Distribution */}
            <div style={{ gridColumn: '1 / -1' }}>
              <TimeSeriesChart
                title="Alert Timeline"
                data={analyticsData.timeSeriesData}
                color={`var(--color-primary-500)`}
              />
            </div>

            <div>
              <DonutChart
                title="Attack Type Distribution"
                data={analyticsData.attackDistribution}
                showLegend
                showPercentages
              />
            </div>

            <div>
              <DonutChart
                title="Severity Breakdown"
                data={analyticsData.severityBreakdown}
                showLegend
                showPercentages
              />
            </div>

            {/* Row 2: Protocol & Geo Distribution */}
            <div>
              <BarChart
                title="Protocol Distribution"
                data={analyticsData.protocolDistribution}
                showValues
              />
            </div>

            <div>
              <BarChart
                title="Top Countries"
                data={analyticsData.geoDistribution.map((d) => ({
                  label: d.country,
                  value: d.count,
                }))}
                showValues
              />
            </div>

            {/* Row 3: Top Talkers Table */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Card elevation="md">
                <Card.Header title="Top Source IPs" />
                <Card.Body>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: typography.fontSize.sm,
                    }}>
                      <thead style={{
                        backgroundColor: colors.bg.tertiary,
                        borderBottom: `2px solid ${colors.border.primary}`,
                      }}>
                        <tr>
                          <th style={{
                            padding: spacing[3],
                            textAlign: 'left',
                            fontWeight: typography.fontWeight.semibold,
                            color: colors.text.primary,
                          }}>IP Address</th>
                          <th style={{
                            padding: spacing[3],
                            textAlign: 'left',
                            fontWeight: typography.fontWeight.semibold,
                            color: colors.text.primary,
                          }}>Alert Count</th>
                          <th style={{
                            padding: spacing[3],
                            textAlign: 'left',
                            fontWeight: typography.fontWeight.semibold,
                            color: colors.text.primary,
                          }}>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.topTalkers.map((talker, i) => (
                          <tr key={i} style={{
                            borderBottom: `1px solid ${colors.border.primary}`,
                            transition: 'background-color 150ms ease-out',
                          }}>
                            <td style={{
                              padding: spacing[3],
                              color: colors.text.primary,
                            }}>
                              <code style={{
                                fontFamily: 'monospace',
                                fontSize: typography.fontSize.xs,
                                color: colors.primary[400],
                                backgroundColor: `rgba(59, 92, 255, 0.1)`,
                                padding: spacing[1],
                                borderRadius: '0.25rem',
                              }}>{talker.ip}</code>
                            </td>
                            <td style={{
                              padding: spacing[3],
                              color: colors.text.primary,
                            }}>{talker.count}</td>
                            <td style={{
                              padding: spacing[3],
                              color: colors.text.primary,
                            }}>
                              <span style={{
                                display: 'inline-block',
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: '0.25rem',
                                fontSize: typography.fontSize.xs,
                                fontWeight: typography.fontWeight.semibold,
                                textTransform: 'uppercase',
                                backgroundColor: talker.severity === 'critical' ? `rgba(255, 51, 51, 0.2)` :
                                                talker.severity === 'high' ? `rgba(255, 140, 0, 0.2)` :
                                                talker.severity === 'medium' ? `rgba(255, 193, 7, 0.2)` :
                                                `rgba(74, 144, 226, 0.2)`,
                                color: talker.severity === 'critical' ? colors.critical[500] :
                                       talker.severity === 'high' ? colors.high[500] :
                                       talker.severity === 'medium' ? colors.medium[500] :
                                       colors.low[500],
                              }}>
                                {talker.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        )}
      </DataStateRenderer>
    </div>
  );

  return (
    <AnalyzeLayout
      title="Threat Analysis"
      subtitle="Deep Investigation & Analytics"
      content={content}
      sidebar={sidebar}
      headerActions={headerActions}
      sidebarPosition="right"
      collapsibleSidebar
    />
  );
};

Analyze.displayName = 'Analyze';

// Mock data fetcher
async function fetchAnalyticsData(timeRange: string): Promise<AnalyticsData> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Generate time series data
  const now = Date.now();
  const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
    value: Math.floor(Math.random() * 50) + 10,
  }));

  // Attack distribution
  const attackDistribution = [
    { label: 'DDoS SYN', value: 45 },
    { label: 'MITM ARP', value: 28 },
    { label: 'DNS Exfiltration', value: 18 },
    { label: 'Brute Force', value: 12 },
    { label: 'Scanning', value: 8 },
  ];

  // Severity breakdown
  const severityBreakdown = [
    { label: 'Critical', value: 15 },
    { label: 'High', value: 32 },
    { label: 'Medium', value: 38 },
    { label: 'Low', value: 26 },
  ];

  // Top talkers
  const topTalkers = [
    { ip: '192.168.1.100', count: 145, severity: 'critical' },
    { ip: '10.0.0.50', count: 98, severity: 'high' },
    { ip: '172.16.0.25', count: 67, severity: 'high' },
    { ip: '192.168.2.200', count: 45, severity: 'medium' },
    { ip: '10.1.1.10', count: 32, severity: 'low' },
  ];

  // Protocol distribution
  const protocolDistribution = [
    { label: 'TCP', value: 156 },
    { label: 'UDP', value: 89 },
    { label: 'ICMP', value: 34 },
    { label: 'Other', value: 12 },
  ];

  // Geo distribution
  const geoDistribution = [
    { country: 'United States', count: 145 },
    { country: 'China', count: 98 },
    { country: 'Russia', count: 67 },
    { country: 'India', count: 45 },
    { country: 'Brazil', count: 32 },
  ];

  return {
    timeSeriesData,
    attackDistribution,
    severityBreakdown,
    topTalkers,
    protocolDistribution,
    geoDistribution,
  };
}

export default Analyze;
