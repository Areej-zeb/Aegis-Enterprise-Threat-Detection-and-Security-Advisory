/**
 * Checkbox Component
 * 
 * An accessible checkbox component with support for indeterminate state.
 * 
 * @example
 * ```tsx
 * <Checkbox
 *   label="Enable notifications"
 *   checked={notifications}
 *   onChange={setNotifications}
 * />
 * ```
 */

import React from 'react';
import styles from './Checkbox.module.css';

/**
 * Checkbox component props
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /**
   * Label text
   */
  label?: string;

  /**
   * Whether the checkbox is checked
   */
  checked?: boolean;

  /**
   * Change handler
   */
  onChange?: (checked: boolean) => void;

  /**
   * Whether the checkbox is in indeterminate state
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Whether the checkbox has an error
   * @default false
   */
  error?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Container class names
   */
  containerClassName?: string;
}

/**
 * Checkbox Component
 * 
 * Renders an accessible checkbox with optional label.
 * All styling uses design tokens for consistency.
 * 
 * Accessibility features:
 * - Associated label element
 * - Keyboard accessible (Space to toggle)
 * - Clear focus indicator
 * - Indeterminate state support
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      checked = false,
      onChange,
      indeterminate = false,
      error = false,
      className = '',
      containerClassName = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    // Handle indeterminate state
    React.useEffect(() => {
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.indeterminate = indeterminate;
      }
    }, [indeterminate, ref]);

    return (
      <div
        className={`
          ${styles.container}
          ${containerClassName}
        `.trim()}
      >
        {/* Checkbox Input */}
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          aria-invalid={error}
          className={`
            ${styles.input}
            ${error ? styles.error : ''}
            ${className}
          `.trim()}
          {...props}
        />

        {/* Custom Checkbox */}
        <span className={styles.checkmark} aria-hidden="true">
          {indeterminate ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </span>

        {/* Label */}
        {label && (
          <label htmlFor={checkboxId} className={styles.label}>
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
