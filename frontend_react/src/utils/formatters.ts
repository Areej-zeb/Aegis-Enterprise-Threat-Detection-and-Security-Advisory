/**
 * Shared formatting utilities for the Aegis dashboard
 */

/**
 * Format a timestamp to a localized string
 */
export function formatTimestamp(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format a timestamp to time only
 */
export function formatTime(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * Format a timestamp to date only
 */
export function formatDate(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Replace underscores with spaces and capitalize
 */
export function formatLabel(str: string): string {
  if (!str) return '';
  return str.replace(/_/g, ' ').split(' ').map(capitalize).join(' ');
}
