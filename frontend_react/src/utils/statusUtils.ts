/**
 * Status Utils - Consistent status handling across the app
 * Standardizes colors, icons, and text for all status indicators
 */

import { tokens } from '../theme/tokens';

export type StatusValue = 'active' | 'error' | 'warning' | 'inactive' | 'loading';

export interface StatusConfig {
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
  text: string;
}

export const statusConfigs: Record<StatusValue, StatusConfig> = {
  active: {
    color: tokens.colors.success,
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    icon: '✓',
    text: 'Active',
  },
  error: {
    color: tokens.colors.error,
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    icon: '✕',
    text: 'Error',
  },
  warning: {
    color: tokens.colors.warning,
    backgroundColor: '#fed7aa',
    borderColor: '#fdba74',
    icon: '⚠',
    text: 'Warning',
  },
  inactive: {
    color: tokens.colors.secondary,
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    icon: '○',
    text: 'Inactive',
  },
  loading: {
    color: tokens.colors.info,
    backgroundColor: '#cffafe',
    borderColor: '#a5f3fc',
    icon: '⟳',
    text: 'Loading',
  },
};

export function getStatusConfig(status: string): StatusConfig {
  const normalizedStatus = status.toLowerCase() as StatusValue;
  return statusConfigs[normalizedStatus] || statusConfigs.inactive;
}

// Risk score color coding
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskConfig {
  color: string;
  backgroundColor: string;
  label: string;
  range: string;
}

export const riskConfigs: Record<RiskLevel, RiskConfig> = {
  low: {
    color: tokens.colors.success,
    backgroundColor: '#dcfce7',
    label: 'Low Risk',
    range: '0-30',
  },
  moderate: {
    color: tokens.colors.warning,
    backgroundColor: '#fed7aa',
    label: 'Moderate Risk',
    range: '31-70',
  },
  high: {
    color: '#dc2626', // Orange-red
    backgroundColor: '#fef3c7',
    label: 'High Risk',
    range: '71-90',
  },
  critical: {
    color: tokens.colors.error,
    backgroundColor: '#fee2e2',
    label: 'Critical Risk',
    range: '91-100',
  },
};

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'low';
  if (score <= 70) return 'moderate';
  if (score <= 90) return 'high';
  return 'critical';
}

export function getRiskConfig(score: number): RiskConfig {
  const level = getRiskLevel(score);
  return riskConfigs[level];
}