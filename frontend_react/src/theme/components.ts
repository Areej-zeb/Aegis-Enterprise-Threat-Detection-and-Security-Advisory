/**
 * Component Styles - Reusable component definitions
 * Ensures consistency across all dashboard cards and layouts
 */

import { tokens } from './tokens';

export const componentStyles = {
  // Card base styles
  card: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.medium,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
  },

  // Card with elevated shadow
  cardElevated: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.medium,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
  },

  // Metrics number styling
  metricNumber: {
    fontSize: tokens.typography.h1.fontSize,
    fontWeight: tokens.typography.h1.fontWeight,
    lineHeight: tokens.typography.h1.lineHeight,
    color: tokens.colors.primary,
  },

  // Metrics label styling
  metricLabel: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.typography.caption.fontWeight,
    lineHeight: tokens.typography.caption.lineHeight,
    color: tokens.colors.secondary,
    marginTop: tokens.spacing.sm,
  },

  // Status indicators
  statusIndicator: {
    good: {
      color: tokens.colors.success,
      backgroundColor: '#dcfce7',
      borderColor: '#86efac',
    },
    error: {
      color: tokens.colors.error,
      backgroundColor: '#fee2e2',
      borderColor: '#fca5a5',
    },
    warning: {
      color: tokens.colors.warning,
      backgroundColor: '#fed7aa',
      borderColor: '#fdba74',
    },
    info: {
      color: tokens.colors.info,
      backgroundColor: '#cffafe',
      borderColor: '#a5f3fc',
    },
  },

  // Section spacing
  sectionSpacing: {
    small: tokens.spacing.md,
    medium: tokens.spacing.lg,
    large: tokens.spacing.xl,
  },

  // Grid gaps
  gridGap: {
    compact: tokens.spacing.md,
    normal: tokens.spacing.lg,
    spacious: tokens.spacing.xl,
  },
} as const;

export type StatusType = keyof typeof componentStyles.statusIndicator;
