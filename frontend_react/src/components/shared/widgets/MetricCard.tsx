/**
 * Metric Card Component
 * Displays a single metric with value, trend, and optional chart
 */

import React from 'react';
import { Card, Badge } from '@/components/base';
import styles from './MetricCard.module.css';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  status?: 'healthy' | 'warning' | 'critical';
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Metric Card Component
 * Displays a key metric with optional trend and status
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  status = 'healthy',
  icon,
  onClick,
  className = '',
}) => {
  const trendColor = trend?.direction === 'up' ? 'danger' : trend?.direction === 'down' ? 'success' : 'info';
  const statusVariant = status === 'critical' ? 'danger' : status === 'warning' ? 'warning' : 'success';

  return (
    <Card
      className={`${styles['metric-card']} ${className}`}
      interactive={!!onClick}
      onClick={onClick}
      elevation="md"
    >
      <div className={styles['metric-card__header']}>
        <h3 className={styles['metric-card__title']}>{title}</h3>
        {status && (
          <Badge variant={statusVariant} size="sm">
            {status}
          </Badge>
        )}
      </div>

      <div className={styles['metric-card__content']}>
        {icon && <div className={styles['metric-card__icon']}>{icon}</div>}

        <div className={styles['metric-card__value-section']}>
          <div className={styles['metric-card__value']}>
            {value}
            {unit && <span className={styles['metric-card__unit']}>{unit}</span>}
          </div>

          {trend && (
            <div className={`${styles['metric-card__trend']} ${styles[`metric-card__trend--${trend.direction}`]}`}>
              <span className={styles['metric-card__trend-icon']}>
                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
              </span>
              <span className={styles['metric-card__trend-value']}>
                {Math.abs(trend.percentage)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

MetricCard.displayName = 'MetricCard';

export default MetricCard;
