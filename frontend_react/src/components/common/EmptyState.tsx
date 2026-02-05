/**
 * EmptyState - Consistent empty state component
 * Standardizes all "no data" displays across the app
 */

import React from 'react';
import { tokens } from '../../theme/tokens';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action,
  size = 'medium',
  className = '',
}) => {
  const sizeClasses = {
    small: {
      container: 'py-8',
      icon: 'text-2xl',
      title: 'text-sm font-medium',
      description: 'text-xs',
      button: 'px-3 py-1.5 text-sm',
    },
    medium: {
      container: 'py-12',
      icon: 'text-4xl',
      title: 'text-base font-semibold',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    large: {
      container: 'py-16',
      icon: 'text-6xl',
      title: 'text-lg font-semibold',
      description: 'text-base',
      button: 'px-6 py-3 text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`text-center ${classes.container} ${className}`}>
      <div className={`mb-4 ${classes.icon}`}>{icon}</div>
      
      <h3 
        className={`mb-2 ${classes.title}`}
        style={{ color: tokens.colors.secondary }}
      >
        {title}
      </h3>
      
      {description && (
        <p 
          className={`mb-6 ${classes.description}`}
          style={{ color: tokens.colors.secondary }}
        >
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={`
            ${classes.button} 
            rounded-md font-medium transition-colors
            ${action.disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};