/**
 * Monitor Page
 * Real-time alert monitoring with split-view layout
 * Left panel: Alert list with filtering
 * Right panel: Alert details with workflow actions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorLayout } from '@/components/layouts';
import { Button, Card } from '@/components/base';
import { Checkbox } from '@/components/composite';
import { AlertFilters, AlertFiltersState } from '@/components/shared/alerts/AlertFilters';
import { AlertTable, AlertTableRow } from '@/components/shared/alerts/AlertTable';
import { AlertCard } from '@/components/shared/alerts/AlertCard';
import { useWorkflow } from '@/context/WorkflowContext';
import { useDataLoader } from '@/hooks/useDataLoader';
import { DataStateRenderer } from '@/components/common';

interface AlertDetail extends AlertTableRow {
  description: string;
  networkDetails?: {
    protocol: string;
    flags?: string;
    packets?: number;
    bytes?: number;
  };
  mitreTechniques?: string[];
  confidence?: number;
}

/**
 * Monitor Page Component
 * Real-time alert monitoring with split-view layout
 */
export const Monitor: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAlert, navigateToAnalyze, navigateToPentest, navigateToAssistant } = useWorkflow();

  const [selectedAlertId, setSelectedAlertId] = useState<string | undefined>(selectedAlert?.id);
  const [filters, setFilters] = useState<AlertFiltersState>({
    severity: [],
    type: '',
    timeRange: '24h',
    searchQuery: '',
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load alerts
  const {
    data: allAlerts,
    state: alertsState,
    error: alertsError,
    refresh: refreshAlerts,
  } = useDataLoader<AlertTableRow[]>({
    onFetch: () => fetchAlerts(),
  });

  // Auto-refresh alerts
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAlerts();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshAlerts]);

  // Filter alerts
  const filteredAlerts = React.useMemo(() => {
    if (!allAlerts) return [];

    return allAlerts.filter((alert) => {
      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(alert.severity)) {
        return false;
      }

      // Type filter
      if (filters.type && alert.type !== filters.type) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          alert.sourceIp.toLowerCase().includes(query) ||
          alert.destinationIp?.toLowerCase().includes(query) ||
          alert.type.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allAlerts, filters]);

  // Get selected alert details
  const selectedAlertDetails = filteredAlerts.find((a) => a.id === selectedAlertId);

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
  };

  const handleAnalyze = () => {
    if (selectedAlertDetails) {
      navigateToAnalyze(selectedAlertDetails as any);
      navigate('/analyze');
    }
  };

  const handlePentest = () => {
    if (selectedAlertDetails) {
      navigateToPentest(selectedAlertDetails.sourceIp);
      navigate('/pentest');
    }
  };

  const handleAskAI = () => {
    if (selectedAlertDetails) {
      navigateToAssistant({ alert: selectedAlertDetails });
      navigate('/assistant');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      severity: [],
      type: '',
      timeRange: '24h',
      searchQuery: '',
    });
  };

  // Left panel: Alert list
  const leftPanel = (
    <div className={styles['monitor__left-panel']}>
      <div className={styles['monitor__left-header']}>
        <h2 className={styles['monitor__left-title']}>Live Alerts</h2>
        <span className={styles['monitor__alert-count']}>
          {filteredAlerts.length} / {allAlerts?.length || 0}
        </span>
      </div>

      {/* Controls */}
      <div className={styles['monitor__controls']}>
        <div className={styles['monitor__control-item']}>
          <Checkbox
            label="Auto-refresh"
            checked={autoRefresh}
            onChange={setAutoRefresh}
          />
        </div>
        <div className={styles['monitor__control-item']}>
          <Checkbox
            label="Sound alerts"
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={refreshAlerts}
        >
          Refresh Now
        </Button>
      </div>

      {/* Filters */}
      <AlertFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* Alert Table */}
      <div className={styles['monitor__table-container']}>
        <DataStateRenderer
          state={alertsState}
          error={alertsError}
          isEmpty={filteredAlerts.length === 0}
          onRefresh={refreshAlerts}
          emptyMessage="No alerts found"
        >
          <AlertTable
            alerts={filteredAlerts}
            selectedAlertId={selectedAlertId}
            onSelectAlert={handleSelectAlert}
            loading={alertsState === 'loading'}
          />
        </DataStateRenderer>
      </div>
    </div>
  );

  // Right panel: Alert details
  const rightPanel = (
    <div className={styles['monitor__right-panel']}>
      {selectedAlertDetails ? (
        <>
          <div className={styles['monitor__details-header']}>
            <h2 className={styles['monitor__details-title']}>Alert Details</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedAlertId(undefined)}
            >
              Clear
            </Button>
          </div>

          <AlertCard
            {...selectedAlertDetails}
            isSelected
            onAnalyze={handleAnalyze}
            onPentest={handlePentest}
            onAskAI={handleAskAI}
          />

          {/* Network Details */}
          {(selectedAlertDetails as AlertDetail).networkDetails && (
            <Card elevation="md" className={styles['monitor__details-card']}>
              <Card.Header title="Network Details" />
              <Card.Body>
                <div className={styles['monitor__details-table']}>
                  <div className={styles['monitor__details-row']}>
                    <span className={styles['monitor__details-label']}>Protocol:</span>
                    <code className={styles['monitor__details-value']}>
                      {(selectedAlertDetails as AlertDetail).networkDetails?.protocol}
                    </code>
                  </div>
                  {(selectedAlertDetails as AlertDetail).networkDetails?.flags && (
                    <div className={styles['monitor__details-row']}>
                      <span className={styles['monitor__details-label']}>Flags:</span>
                      <code className={styles['monitor__details-value']}>
                        {(selectedAlertDetails as AlertDetail).networkDetails?.flags}
                      </code>
                    </div>
                  )}
                  {(selectedAlertDetails as AlertDetail).networkDetails?.packets && (
                    <div className={styles['monitor__details-row']}>
                      <span className={styles['monitor__details-label']}>Packets:</span>
                      <span className={styles['monitor__details-value']}>
                        {(selectedAlertDetails as AlertDetail).networkDetails?.packets}
                      </span>
                    </div>
                  )}
                  {(selectedAlertDetails as AlertDetail).networkDetails?.bytes && (
                    <div className={styles['monitor__details-row']}>
                      <span className={styles['monitor__details-label']}>Bytes:</span>
                      <span className={styles['monitor__details-value']}>
                        {(selectedAlertDetails as AlertDetail).networkDetails?.bytes}
                      </span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* MITRE Techniques */}
          {(selectedAlertDetails as AlertDetail).mitreTechniques &&
            (selectedAlertDetails as AlertDetail).mitreTechniques!.length > 0 && (
              <Card elevation="md" className={styles['monitor__details-card']}>
                <Card.Header title="MITRE ATT&CK Techniques" />
                <Card.Body>
                  <div className={styles['monitor__techniques-list']}>
                    {(selectedAlertDetails as AlertDetail).mitreTechniques!.map((technique) => (
                      <div key={technique} className={styles['monitor__technique-item']}>
                        <code>{technique}</code>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

          {/* Confidence Score */}
          {(selectedAlertDetails as AlertDetail).confidence !== undefined && (
            <Card elevation="md" className={styles['monitor__details-card']}>
              <Card.Header title="Detection Confidence" />
              <Card.Body>
                <div className={styles['monitor__confidence']}>
                  <div className={styles['monitor__confidence-bar']}>
                    <div
                      className={styles['monitor__confidence-fill']}
                      style={{
                        width: `${(selectedAlertDetails as AlertDetail).confidence! * 100}%`,
                      }}
                    />
                  </div>
                  <span className={styles['monitor__confidence-text']}>
                    {((selectedAlertDetails as AlertDetail).confidence! * 100).toFixed(1)}%
                  </span>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      ) : (
        <div className={styles['monitor__empty-state']}>
          <p>Select an alert to view details</p>
        </div>
      )}
    </div>
  );

  return (
    <MonitorLayout
      header={<h1>Real-time Alert Monitor</h1>}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      resizable
      leftPanelWidth={30}
    />
  );
};

Monitor.displayName = 'Monitor';

// Mock data fetcher
async function fetchAlerts(): Promise<AlertTableRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const alertTypes = ['DDoS_SYN', 'MITM_ARP', 'DNS_Exfiltration', 'Brute_Force', 'Scanning'];
  const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `alert-${i}`,
    severity: severities[Math.floor(Math.random() * severities.length)],
    type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
    sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    destinationIp: Math.random() > 0.3 ? `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : undefined,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    description: 'Suspicious network activity detected by ML model',
  }));
}

export default Monitor;
