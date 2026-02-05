/**
 * RiskScore - Consistent risk score display with color coding
 */

import React from 'react';
import { getRiskConfig } from '../../utils/statusUtils';

interface RiskScoreProps {
  score: number;
  maxScore?: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const RiskScore: React.FC<RiskScoreProps> = ({
  score,
  maxScore = 100,
  size = 'medium',
  showLabel = false,
  className = '',
}) => {
  const config = getRiskConfig(score);
  
  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-1.5',
    large: 'text-lg px-4 py-2',
  };

  const numberSizeClasses = {
    small: 'text-lg font-semibold',
    medium: 'text-xl font-bold',
    large: 'text-2xl font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`rounded-lg border ${sizeClasses[size]}`}
        style={{
          backgroundColor: config.backgroundColor,
          borderColor: config.color,
        }}
      >
        <span
          className={numberSizeClasses[size]}
          style={{ color: config.color }}
        >
          {score}/{maxScore}
        </span>
      </div>
      {showLabel && (
        <span
          className="text-sm font-medium"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
};