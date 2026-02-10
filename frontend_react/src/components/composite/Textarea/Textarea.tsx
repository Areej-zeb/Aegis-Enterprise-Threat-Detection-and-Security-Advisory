/**
 * Textarea Component
 * 
 * A flexible textarea component with character counting and resizable behavior.
 * 
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   placeholder="Enter description..."
 *   maxLength={500}
 *   rows={4}
 * />
 * ```
 */

import React from 'react';
import styles from './Textarea.module.css';

/**
 * Textarea component props
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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
   * Size of the textarea
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the textarea has an error
   * @default false
   */
  error?: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Helper text to display below the textarea
   */
  helperText?: string;

  /**
   * Whether to show character count
   * @default false
   */
  showCharCount?: boolean;

  /**
   * Whether the textarea should take full width
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
 * Textarea Component
 * 
 * Renders an accessible textarea with optional label, error message, helper text, and character count.
 * All styling uses design tokens for consistency.
 * 
 * Accessibility features:
 * - Associated label element
 * - Error messages linked via aria-describedby
 * - Keyboard accessible
 * - Clear focus indicator
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      required = false,
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      showCharCount = false,
      fullWidth = false,
      className = '',
      containerClassName = '',
      id,
      placeholder,
      disabled,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const charCountId = `${textareaId}-charcount`;

    const charCount = typeof value === 'string' ? value.length : 0;
    const charCountPercent = maxLength ? (charCount / maxLength) * 100 : 0;

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
          <label htmlFor={textareaId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        {/* Textarea Wrapper */}
        <div className={styles.textareaWrapper}>
          {/* Textarea */}
          <textarea
            ref={ref}
            id={textareaId}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            aria-invalid={error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`
              ${styles.textarea}
              ${styles[`size-${size}`]}
              ${error ? styles.error : ''}
              ${className}
            `.trim()}
            {...props}
          />
        </div>

        {/* Character Count */}
        {showCharCount && maxLength && (
          <div className={styles.charCountContainer}>
            <div className={styles.charCountBar}>
              <div
                className={styles.charCountProgress}
                style={{
                  width: `${charCountPercent}%`,
                  backgroundColor:
                    charCountPercent > 90
                      ? 'var(--color-status-danger)'
                      : charCountPercent > 75
                      ? 'var(--color-status-warning)'
                      : 'var(--color-interactive-primary)',
                }}
              />
            </div>
            <p id={charCountId} className={styles.charCount}>
              {charCount} / {maxLength}
            </p>
          </div>
        )}

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

Textarea.displayName = 'Textarea';
