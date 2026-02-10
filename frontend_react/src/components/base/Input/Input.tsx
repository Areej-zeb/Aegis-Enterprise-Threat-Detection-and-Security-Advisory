/**
 * Input Component
 * 
 * A flexible text input component with support for multiple types, sizes, and states.
 * Includes label, error messages, and helper text.
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Search Alerts"
 *   placeholder="Enter alert ID..."
 *   icon={<SearchIcon />}
 *   helperText="Search by ID or name"
 * />
 * 
 * <Input
 *   label="Email"
 *   type="email"
 *   error={true}
 *   errorMessage="Invalid email address"
 * />
 * ```
 */

import React, { ReactNode } from 'react';
import styles from './Input.module.css';

/**
 * Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input type
   * @default 'text'
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

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
   * Icon to display in the input
   */
  icon?: ReactNode;

  /**
   * Position of the icon
   * @default 'leading'
   */
  iconPosition?: 'leading' | 'trailing';

  /**
   * Size of the input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the input has an error
   * @default false
   */
  error?: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Helper text to display below the input
   */
  helperText?: string;

  /**
   * Whether the input should take full width
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
 * Input Component
 * 
 * Renders an accessible text input with optional label, icon, error message, and helper text.
 * All styling uses design tokens for consistency.
 * 
 * Accessibility features:
 * - Associated label element
 * - Error messages linked via aria-describedby
 * - Keyboard accessible
 * - Clear focus indicator
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      required = false,
      icon,
      iconPosition = 'leading',
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      fullWidth = false,
      className = '',
      containerClassName = '',
      id,
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

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
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        {/* Input Wrapper */}
        <div className={styles.inputWrapper}>
          {/* Icon - Leading */}
          {icon && iconPosition === 'leading' && (
            <span className={styles.iconLeading}>{icon}</span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`
              ${styles.input}
              ${styles[`size-${size}`]}
              ${error ? styles.error : ''}
              ${icon && iconPosition === 'leading' ? styles.withIconLeading : ''}
              ${icon && iconPosition === 'trailing' ? styles.withIconTrailing : ''}
              ${className}
            `.trim()}
            {...props}
          />

          {/* Icon - Trailing */}
          {icon && iconPosition === 'trailing' && (
            <span className={styles.iconTrailing}>{icon}</span>
          )}
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

Input.displayName = 'Input';
