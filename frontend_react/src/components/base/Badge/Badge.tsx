/**
 * Badge Component
 * 
 * A small label component for status, tags, or counts.
 * 
 * @example
 * ```tsx
 * <Badge variant="danger">Critical</Badge>
 * <Badge variant="success" icon={<CheckIcon />}>Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * ```
 */

import React, { ReactNode } from 'react';
import styles from './Badge.module.css';

/**
 * Badge component props
 */
export interface BadgeProps {
  /**
   * Visual variant of the badge
   * @default 'primary'
   */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';

  /**
   * Size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Icon to display in the badge
   */
  icon?: ReactNode;

  /**
   * Badge content
   */
  children: ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Badge Component
 * 
 * Renders a small label badge with support for multiple variants and sizes.
 * All styling uses design tokens for consistency.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  return (
    <span
      className={`
        ${styles.badge}
        ${styles[`variant-${variant}`]}
        ${styles[`size-${size}`]}
        ${icon ? styles.withIcon : ''}
        ${className}
      `.trim()}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
    </span>
  );
};

Badge.displayName = 'Badge';
