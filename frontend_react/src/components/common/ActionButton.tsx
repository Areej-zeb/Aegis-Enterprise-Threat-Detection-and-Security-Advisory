/**
 * ActionButton - Consistent button component with proper state management
 * Handles loading, disabled, and different variants consistently
 */

import React from 'react';
import { tokens } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  loadingText,
  className = '',
  type = 'button',
}) => {
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      bg: tokens.colors.primary,
      hover: '#1d4ed8',
      text: '#ffffff',
    },
    secondary: {
      bg: tokens.colors.secondary,
      hover: '#475569',
      text: '#ffffff',
    },
    success: {
      bg: tokens.colors.success,
      hover: '#15803d',
      text: '#ffffff',
    },
    warning: {
      bg: tokens.colors.warning,
      hover: '#c2410c',
      text: '#ffffff',
    },
    error: {
      bg: tokens.colors.error,
      hover: '#b91c1c',
      text: '#ffffff',
    },
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  const style = variantStyles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        ${sizeClasses[size]}
        rounded-md font-medium transition-all duration-200
        ${isDisabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'hover:shadow-md active:scale-95'
        }
        ${className}
      `}
      style={
        isDisabled 
          ? undefined 
          : {
              backgroundColor: style.bg,
              color: style.text,
            }
      }
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = style.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = style.bg;
        }
      }}
    >
      {loading && (
        <span className="animate-spin">⟳</span>
      )}
      <span>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
};