/**
 * Alert Filters Component
 * Provides filtering controls for alert list
 */

import React from 'react';
import { Input } from '@/components/base';
import { Select, Checkbox, Radio } from '@/components/composite';
import styles from './AlertFilters.module.css';

export interface AlertFiltersState {
  severity: string[];
  type: string;
  timeRange: string;
  searchQuery: string;
}

export interface AlertFiltersProps {
  filters: AlertFiltersState;
  onFiltersChange: (filters: AlertFiltersState) => void;
  onClear: () => void;
}

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ALERT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'DDoS_SYN', label: 'DDoS SYN' },
  { value: 'MITM_ARP', label: 'MITM ARP' },
  { value: 'DNS_Exfiltration', label: 'DNS Exfiltration' },
  { value: 'Brute_Force', label: 'Brute Force' },
  { value: 'Scanning', label: 'Scanning' },
];

const TIME_RANGES = [
  { value: '15m', label: 'Last 15 minutes' },
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
];

/**
 * Alert Filters Component
 * Provides severity, type, time range, and search filtering
 */
export const AlertFilters: React.FC<AlertFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
}) => {
  const handleSeverityChange = (severity: string, checked: boolean) => {
    const newSeverities = checked
      ? [...filters.severity, severity]
      : filters.severity.filter((s) => s !== severity);
    onFiltersChange({ ...filters, severity: newSeverities });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, type: value });
  };

  const handleTimeRangeChange = (timeRange: string) => {
    onFiltersChange({ ...filters, timeRange });
  };

  const handleSearchChange = (query: string) => {
    onFiltersChange({ ...filters, searchQuery: query });
  };

  const hasActiveFilters =
    filters.severity.length > 0 ||
    filters.type !== '' ||
    filters.timeRange !== '24h' ||
    filters.searchQuery !== '';

  return (
    <div className={styles['alert-filters']}>
      {/* Search */}
      <div className={styles['alert-filters__section']}>
        <Input
          placeholder="Search by IP, type..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="sm"
        />
      </div>

      {/* Severity Filter */}
      <div className={styles['alert-filters__section']}>
        <h4 className={styles['alert-filters__title']}>Severity</h4>
        <div className={styles['alert-filters__group']}>
          {SEVERITY_OPTIONS.map((option) => (
            <Checkbox
              key={option.value}
              label={option.label}
              checked={filters.severity.includes(option.value)}
              onChange={(checked: boolean) => handleSeverityChange(option.value, checked)}
            />
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div className={styles['alert-filters__section']}>
        <h4 className={styles['alert-filters__title']}>Alert Type</h4>
        <Select
          options={ALERT_TYPES}
          value={filters.type}
          onChange={(value: string) => handleTypeChange(value)}
          size="sm"
        />
      </div>

      {/* Time Range Filter */}
      <div className={styles['alert-filters__section']}>
        <h4 className={styles['alert-filters__title']}>Time Range</h4>
        <div className={styles['alert-filters__group']}>
          {TIME_RANGES.map((option) => (
            <Radio
              key={option.value}
              name="timeRange"
              value={option.value}
              label={option.label}
              checked={filters.timeRange === option.value}
              onChange={() => handleTimeRangeChange(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button className={styles['alert-filters__clear']} onClick={onClear}>
          Clear Filters
        </button>
      )}
    </div>
  );
};

AlertFilters.displayName = 'AlertFilters';

export default AlertFilters;
