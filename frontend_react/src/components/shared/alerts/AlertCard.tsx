/**
 * Alert Card Component
 * Displays a single alert with severity badge and quick actions
 */

import React from 'react';
import { Badge, Card, Button } from '@/components/base';
import { SeverityBadge } from '@/components/common';
import styles from './AlertCard.module.css';

export interface AlertCardProps {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  sourceIp: string;
  destinationIp?: string;
  timestamp: string;
  description: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onAnalyze?: (id: string) => void;
  onPentest?: (sourceIp: string) => void;
  onAskAI?: (id: string) => void;
}

/**
 * Alert Card Component
 * Displays alert information with action buttons
 */
export const AlertCard: React.FC<AlertCardProps> = ({
  id,
  severity,
  type,
  sourceIp,
  destinationIp,
  timestamp,
  description,
  isSelected = false,
  onSelect,
  onAnalyze,
  onPentest,
  onAskAI,
}) => {
  const handleSelect = () => {
    onSelect?.(id);
  };

  const cardClasses = [styles['alert-card'], isSelected && styles['alert-card--selected']]
    .filter(Boolean)
    .join(' ');

  return (
    <Card
      className={cardClasses}
      interactive
      onClick={handleSelect}
      elevation="md"
    >
      <div className={styles['alert-card__header']}>
        <div className={styles['alert-card__title-section']}>
          <SeverityBadge severity={severity} />
          <div className={styles['alert-card__title']}>
            <h3 className={styles['alert-card__type']}>{type}</h3>
            <p className={styles['alert-card__timestamp']}>
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className={styles['alert-card__content']}>
        <p className={styles['alert-card__description']}>{description}</p>

        <div className={styles['alert-card__details']}>
          <div className={styles['alert-card__detail']}>
            <span className={styles['alert-card__label']}>Source IP:</span>
            <code className={styles['alert-card__value']}>{sourceIp}</code>
          </div>
          {destinationIp && (
            <div className={styles['alert-card__detail']}>
              <span className={styles['alert-card__label']}>Destination IP:</span>
              <code className={styles['alert-card__value']}>{destinationIp}</code>
            </div>
          )}
        </div>
      </div>

      <div className={styles['alert-card__actions']}>
        {onAnalyze && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(id);
            }}
          >
            Analyze
          </Button>
        )}
        {onPentest && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onPentest(sourceIp);
            }}
          >
            Pentest
          </Button>
        )}
        {onAskAI && (
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onAskAI(id);
            }}
          >
            Ask AI
          </Button>
        )}
      </div>
    </Card>
  );
};

AlertCard.displayName = 'AlertCard';

export default AlertCard;
