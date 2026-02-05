/**
 * StatusIndicator - Consistent status display component
 * Shows status with proper colors, icons, and styling
 */

import React from 'react';
import { getStatusConfig, StatusValue } from '../../utils/statusUtils';

interface StatusIndicatorProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium',
  showIcon = true,
  showText = true,
  className = '',
}) => {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${className}`}
      style={{
        color: config.color,
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      }}
    >
      {showIcon && <span>{config.icon}</span>}
      {showText && <span>{config.text}</span>}
    </span>
  );
};