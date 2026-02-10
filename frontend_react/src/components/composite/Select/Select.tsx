/**
 * Select Component
 * 
 * A flexible dropdown select component with keyboard accessibility.
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Severity"
 *   options={[
 *     { value: 'critical', label: 'Critical' },
 *     { value: 'high', label: 'High' },
 *     { value: 'medium', label: 'Medium' },
 *   ]}
 *   value={severity}
 *   onChange={setSeverity}
 * />
 * ```
 */

import React, { ReactNode } from 'react';
import styles from './Select.module.css';

/**
 * Select option
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select component props
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /**
   * Label text
   */
  label?: string;

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Available options
   */
  options: SelectOption[];

  /**
   * Current selected value
   */
  value?: string;

  /**
   * Change handler
   */
  onChange?: (value: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Size of the select
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the select has an error
   * @default false
   */
  error?: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Helper text to display below the select
   */
  helperText?: string;

  /**
   * Whether the select should take full width
   * @default false
   */
  fullWidth?: boolean;

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
 * Select Component
 * 
 * Renders an accessible dropdown select with optional label, error message, and helper text.
 * All styling uses design tokens for consistency.
 * 
 * Accessibility features:
 * - Associated label element
 * - Error messages linked via aria-describedby
 * - Keyboard accessible
 * - Clear focus indicator
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      required = false,
      options,
      value,
      onChange,
      placeholder,
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      fullWidth = false,
      className = '',
      containerClassName = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div
        className={`
          ${styles.container}
          ${fullWidth ? styles.fullWidth : ''}
          ${containerClassName}
        `.trim()}
      >
        {/* Label */}
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        {/* Select Wrapper */}
        <div className={styles.selectWrapper}>
          {/* Select */}
          <select
            ref={ref}
            id={selectId}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`
              ${styles.select}
              ${styles[`size-${size}`]}
              ${error ? styles.error : ''}
              ${className}
            `.trim()}
            {...props}
          >
            {/* Placeholder Option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron Icon */}
          <span className={styles.chevron} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>

        {/* Error Message */}
        {error && errorMessage && (
          <p id={errorId} className={styles.errorMessage}>
            {errorMessage}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p id={helperId} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
