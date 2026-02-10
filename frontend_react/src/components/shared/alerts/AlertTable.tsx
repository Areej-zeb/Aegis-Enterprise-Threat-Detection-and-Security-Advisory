/**
 * Alert Table Component
 * Displays alerts in a sortable, selectable table
 */

import React, { useState } from 'react';
import { Checkbox } from '@/components/composite';
import { SeverityBadge } from '@/components/common';
import styles from './AlertTable.module.css';

export interface AlertTableRow {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  sourceIp: string;
  destinationIp?: string;
  timestamp: string;
  description: string;
}

export interface AlertTableProps {
  alerts: AlertTableRow[];
  selectedAlertId?: string;
  onSelectAlert: (alertId: string) => void;
  onSelectMultiple?: (alertIds: string[]) => void;
  loading?: boolean;
  sortBy?: 'severity' | 'timestamp' | 'type';
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

type SortColumn = 'severity' | 'timestamp' | 'type' | 'sourceIp';

/**
 * Alert Table Component
 * Displays alerts with sorting and selection
 */
export const AlertTable: React.FC<AlertTableProps> = ({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onSelectMultiple,
  loading = false,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  onSort,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAlert = (alertId: string) => {
    onSelectAlert(alertId);
  };

  const handleSelectCheckbox = (alertId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(alertId);
    } else {
      newSelected.delete(alertId);
    }
    setSelectedIds(newSelected);
    onSelectMultiple?.(Array.from(newSelected));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(alerts.map((a) => a.id)));
      onSelectMultiple?.(alerts.map((a) => a.id));
    } else {
      setSelectedIds(new Set());
      onSelectMultiple?.([]);
    }
  };

  const handleSort = (column: SortColumn) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort?.(column, newOrder);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return <div className={styles['alert-table__loading']}>Loading alerts...</div>;
  }

  if (alerts.length === 0) {
    return <div className={styles['alert-table__empty']}>No alerts found</div>;
  }

  return (
    <div className={styles['alert-table']}>
      <table className={styles['alert-table__table']}>
        <thead className={styles['alert-table__head']}>
          <tr>
            <th className={styles['alert-table__cell--checkbox']}>
              <Checkbox
                checked={selectedIds.size === alerts.length && alerts.length > 0}
                onChange={(checked: boolean) => handleSelectAll(checked)}
                indeterminate={selectedIds.size > 0 && selectedIds.size < alerts.length}
              />
            </th>
            <th
              className={styles['alert-table__cell--sortable']}
              onClick={() => handleSort('severity')}
            >
              Severity {getSortIcon('severity')}
            </th>
            <th
              className={styles['alert-table__cell--sortable']}
              onClick={() => handleSort('type')}
            >
              Type {getSortIcon('type')}
            </th>
            <th
              className={styles['alert-table__cell--sortable']}
              onClick={() => handleSort('sourceIp')}
            >
              Source IP {getSortIcon('sourceIp')}
            </th>
            <th>Destination IP</th>
            <th
              className={styles['alert-table__cell--sortable']}
              onClick={() => handleSort('timestamp')}
            >
              Timestamp {getSortIcon('timestamp')}
            </th>
          </tr>
        </thead>
        <tbody className={styles['alert-table__body']}>
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              className={`${styles['alert-table__row']} ${
                selectedAlertId === alert.id ? styles['alert-table__row--selected'] : ''
              }`}
              onClick={() => handleSelectAlert(alert.id)}
            >
              <td className={styles['alert-table__cell--checkbox']}>
                <Checkbox
                  checked={selectedIds.has(alert.id)}
                  onChange={(checked: boolean) => handleSelectCheckbox(alert.id, checked)}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
              </td>
              <td className={styles['alert-table__cell']}>
                <SeverityBadge severity={alert.severity} />
              </td>
              <td className={styles['alert-table__cell']}>
                <code className={styles['alert-table__code']}>{alert.type}</code>
              </td>
              <td className={styles['alert-table__cell']}>
                <code className={styles['alert-table__code']}>{alert.sourceIp}</code>
              </td>
              <td className={styles['alert-table__cell']}>
                {alert.destinationIp ? (
                  <code className={styles['alert-table__code']}>{alert.destinationIp}</code>
                ) : (
                  <span className={styles['alert-table__empty-cell']}>—</span>
                )}
              </td>
              <td className={styles['alert-table__cell']}>
                <span className={styles['alert-table__timestamp']}>
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

AlertTable.displayName = 'AlertTable';

export default AlertTable;
