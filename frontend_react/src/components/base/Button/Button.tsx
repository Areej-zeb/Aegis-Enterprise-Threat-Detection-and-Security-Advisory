/**
 * Button Component
 * 
 * A flexible, accessible button component with multiple variants and states.
 * All styling uses design tokens to ensure consistency.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Create Alert
 * </Button>
 * 
 * <Button variant="danger" size="sm" icon={<TrashIcon />}>
 *   Delete
 * </Button>
 * 
 * <Button variant="secondary" loading>
 *   Processing...
 * </Button>
 * ```
 */

import React, { ReactNode } from 'react';
import styles from './Button.module.css';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';

  /**
   * Size of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the button is in loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display in the button
   */
  icon?: ReactNode;

  /**
   * Position of the icon relative to the text
   * @default 'leading'
   */
  iconPosition?: 'leading' | 'trailing';

  /**
   * Whether the button should take full width of its container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * ARIA label for accessibility (required for icon-only buttons)
   */
  ariaLabel?: string;

  /**
   * Button content
   */
  children?: ReactNode;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Button Component
 * 
 * Renders an accessible button with support for multiple variants, sizes, and states.
 * All colors, spacing, and shadows use design tokens.
 * 
 * Accessibility features:
 * - Keyboard accessible (Tab, Enter, Space)
 * - Visible focus indicator (3px primary color ring)
 * - ARIA labels for icon-only buttons
 * - Disabled state properly communicated
 * - Loading state with aria-busy
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      icon,
      iconPosition = 'leading',
      fullWidth = false,
      ariaLabel,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isIconOnly = icon && !children;
    const isDisabledOrLoading = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabledOrLoading}
        aria-label={ariaLabel || (isIconOnly ? 'Button' : undefined)}
        aria-busy={loading}
        className={`
          ${styles.button}
          ${styles[`variant-${variant}`]}
          ${styles[`size-${size}`]}
          ${isDisabledOrLoading ? styles.disabled : ''}
          ${loading ? styles.loading : ''}
          ${fullWidth ? styles.fullWidth : ''}
          ${isIconOnly ? styles.iconOnly : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Icon - Leading */}
        {icon && iconPosition === 'leading' && (
          <span className={styles.icon}>{icon}</span>
        )}

        {/* Loading Spinner */}
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg
              className={styles.spinnerSvg}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.25"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}

        {/* Text Content */}
        {children && <span className={styles.text}>{children}</span>}

        {/* Icon - Trailing */}
        {icon && iconPosition === 'trailing' && (
          <span className={styles.icon}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
