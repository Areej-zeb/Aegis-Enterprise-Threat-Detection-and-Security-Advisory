/**
 * Radio Component
 * 
 * An accessible radio button component for grouped selections.
 * 
 * @example
 * ```tsx
 * <Radio
 *   name="severity"
 *   value="critical"
 *   label="Critical"
 *   checked={severity === 'critical'}
 *   onChange={() => setSeverity('critical')}
 * />
 * ```
 */

import React from 'react';
import styles from './Radio.module.css';

/**
 * Radio component props
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /**
   * Label text
   */
  label?: string;

  /**
   * Radio button name (for grouping)
   */
  name: string;

  /**
   * Radio button value
   */
  value: string;

  /**
   * Whether the radio is checked
   */
  checked?: boolean;

  /**
   * Change handler
   */
  onChange?: (value: string) => void;

  /**
   * Whether the radio has an error
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
 * Radio Component
 * 
 * Renders an accessible radio button with optional label.
 * All styling uses design tokens for consistency.
 * 
 * Accessibility features:
 * - Associated label element
 * - Keyboard accessible (Arrow keys to navigate, Space to select)
 * - Clear focus indicator
 * - Proper grouping with name attribute
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      name,
      value,
      checked = false,
      onChange,
      error = false,
      className = '',
      containerClassName = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const radioId = id || `radio-${name}-${value}`;

    return (
      <div
        className={`
          ${styles.container}
          ${containerClassName}
        `.trim()}
      >
        {/* Radio Input */}
        <input
          ref={ref}
          id={radioId}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          aria-invalid={error}
          className={`
            ${styles.input}
            ${error ? styles.error : ''}
            ${className}
          `.trim()}
          {...props}
        />

        {/* Custom Radio */}
        <span className={styles.radio} aria-hidden="true">
          <span className={styles.dot}></span>
        </span>

        {/* Label */}
        {label && (
          <label htmlFor={radioId} className={styles.label}>
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
