/**
 * Design Tokens - Single Source of Truth
 * All design values (colors, spacing, typography, borders) are defined here
 */

export const tokens = {
  // Color Palette
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    error: '#dc2626',
    success: '#16a34a',
    warning: '#ea580c',
    info: '#0891b2',
  },

  // Spacing Scale (in pixels)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  // Typography Scale
  typography: {
    h1: {
      fontSize: '32px',
      fontWeight: 700,
      lineHeight: '40px',
    },
    h2: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: '32px',
    },
    body: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
    caption: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
    },
  },

  // Border Radius
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
  },
} as const;

// Export individual token groups for convenience
export const colors = tokens.colors;
export const spacing = tokens.spacing;
export const typography = tokens.typography;
export const borderRadius = tokens.borderRadius;
