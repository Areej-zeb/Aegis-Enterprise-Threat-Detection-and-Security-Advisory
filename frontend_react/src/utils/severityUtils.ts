/**
 * Shared severity and status utilities for the Aegis dashboard
 */

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type StatusLevel = 'stable' | 'degraded' | 'needs_retrain' | 'online' | 'offline';

/**
 * Critical severity color - standardized across the app
 * Hex: #ff3366 (vibrant pink-red for neon theme)
 */
export const CRITICAL_SEVERITY_COLOR = '#ff3366';
export const CRITICAL_SEVERITY_BG = 'rgba(255, 51, 102, 0.15)';
export const CRITICAL_SEVERITY_BORDER = 'rgba(255, 51, 102, 0.9)';
export const CRITICAL_SEVERITY_TEXT = '#ff6b9d'; // Lighter variant for text readability

/**
 * Get color configuration for severity levels
 */
export function getSeverityColor(severity: string): {
  bg: string;
  color: string;
  border?: string;
} {
  const sev = severity.toLowerCase();
  
  switch (sev) {
    case 'critical':
      return {
        bg: 'rgba(255, 51, 102, 0.1)', // Match Low's opacity (0.1)
        color: CRITICAL_SEVERITY_TEXT,
        border: 'rgba(255, 51, 102, 0.7)', // Match Low's border opacity (0.7)
      };
    case 'high':
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        border: 'rgba(239, 68, 68, 0.6)',
      };
    case 'medium':
      return {
        bg: 'rgba(251, 191, 36, 0.15)',
        color: '#fbbf24',
        border: 'rgba(251, 191, 36, 0.7)',
      };
    case 'low':
      return {
        bg: 'rgba(34, 197, 94, 0.15)',
        color: '#4ade80',
        border: 'rgba(16, 185, 129, 0.7)',
      };
    default:
      return {
        bg: 'rgba(148, 163, 184, 0.15)',
        color: '#94a3b8',
        border: 'rgba(148, 163, 184, 0.6)',
      };
  }
}

/**
 * Get color configuration for status levels
 */
export function getStatusColor(status: string): {
  bg: string;
  color: string;
  dot?: string;
} {
  const stat = status.toLowerCase();
  
  switch (stat) {
    case 'stable':
    case 'online':
    case 'healthy':
      return {
        bg: 'rgba(34, 197, 94, 0.15)',
        color: '#4ade80',
        dot: '#4ade80',
      };
    case 'degraded':
    case 'moderate':
    case 'warning':
      return {
        bg: 'rgba(251, 191, 36, 0.15)',
        color: '#fbbf24',
        dot: '#fbbf24',
      };
    case 'needs_retrain':
    case 'offline':
    case 'error':
    case 'failed':
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        dot: '#f87171',
      };
    default:
      return {
        bg: 'rgba(148, 163, 184, 0.15)',
        color: '#94a3b8',
        dot: '#94a3b8',
      };
  }
}

/**
 * Get CSS class name for severity
 */
export function getSeverityClass(severity: string): string {
  return `sev-${severity.toLowerCase()}`;
}
