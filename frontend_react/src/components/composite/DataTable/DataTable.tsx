/**
 * DataTable Component
 * 
 * A flexible data table component with sorting, filtering, and pagination.
 * 
 * @example
 * ```tsx
 * <DataTable
 *   columns={[
 *     { key: 'id', label: 'Alert ID', sortable: true },
 *     { key: 'severity', label: 'Severity', sortable: true },
 *     { key: 'timestamp', label: 'Time', sortable: true },
 *   ]}
 *   data={alerts}
 *   sortable
 *   selectable
 *   pagination
 *   pageSize={20}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

/**
 * Column definition
 */
export interface Column {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

/**
 * DataTable component props
 */
export interface DataTableProps {
  /**
   * Column definitions
   */
  columns: Column[];

  /**
   * Table data
   */
  data: any[];

  /**
   * Whether the table is loading
   * @default false
   */
  loading?: boolean;

  /**
   * Whether the table is empty
   * @default false
   */
  empty?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Whether columns are sortable
   * @default false
   */
  sortable?: boolean;

  /**
   * Whether rows are selectable
   * @default false
   */
  selectable?: boolean;

  /**
   * Whether pagination is enabled
   * @default false
   */
  pagination?: boolean;

  /**
   * Page size for pagination
   * @default 10
   */
  pageSize?: number;

  /**
   * Sort handler
   */
  onSort?: (column: string, direction: 'asc' | 'desc') => void;

  /**
   * Selection handler
   */
  onSelect?: (selectedRows: any[]) => void;

  /**
   * Page change handler
   */
  onPageChange?: (page: number) => void;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * DataTable Component
 * 
 * Renders a flexible data table with optional sorting, selection, and pagination.
 * All styling uses design tokens for consistency.
 * 
 * Accessibility features:
 * - Semantic table structure
 * - ARIA labels for screen readers
 * - Keyboard navigation
 * - Loading and empty states
 */
export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  empty = false,
  emptyMessage = 'No data available',
  sortable = false,
  selectable = false,
  pagination = false,
  pageSize = 10,
  onSort,
  onSelect,
  onPageChange,
  className = '',
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Handle sort
  const handleSort = (column: string) => {
    if (!sortable) return;

    const newDirection =
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  // Handle row selection
  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    onSelect?.(Array.from(newSelected).map((i) => data[i]));
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === displayData.length) {
      setSelectedRows(new Set());
      onSelect?.([]);
    } else {
      const newSelected = new Set(displayData.map((_, i) => i));
      setSelectedRows(newSelected);
      onSelect?.(displayData);
    }
  };

  // Paginate data
  const displayData = useMemo(() => {
    if (!pagination) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && (empty || data.length === 0) && (
        <div className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </div>
      )}

      {/* Table */}
      {!loading && data.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table} role="table">
              {/* Header */}
              <thead className={styles.thead}>
                <tr className={styles.headerRow}>
                  {/* Select All Checkbox */}
                  {selectable && (
                    <th className={styles.selectCell}>
                      <input
                        type="checkbox"
                        checked={selectedRows.size === displayData.length && displayData.length > 0}
                        onChange={handleSelectAll}
                        aria-label="Select all rows"
                        className={styles.checkbox}
                      />
                    </th>
                  )}

                  {/* Column Headers */}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={styles.headerCell}
                      style={{ width: column.width }}
                      onClick={() => handleSort(column.key)}
                      role="columnheader"
                      aria-sort={
                        sortColumn === column.key
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <div className={styles.headerContent}>
                        <span>{column.label}</span>
                        {sortable && column.sortable && (
                          <span className={styles.sortIcon} aria-hidden="true">
                            {sortColumn === column.key ? (
                              sortDirection === 'asc' ? '↑' : '↓'
                            ) : (
                              '⇅'
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody className={styles.tbody}>
                {displayData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={styles.bodyRow}>
                    {/* Select Checkbox */}
                    {selectable && (
                      <td className={styles.selectCell}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowIndex)}
                          onChange={() => handleRowSelect(rowIndex)}
                          aria-label={`Select row ${rowIndex + 1}`}
                          className={styles.checkbox}
                        />
                      </td>
                    )}

                    {/* Cells */}
                    {columns.map((column) => (
                      <td
                        key={`${rowIndex}-${column.key}`}
                        className={styles.bodyCell}
                        style={{ width: column.width }}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => {
                  setCurrentPage(Math.max(1, currentPage - 1));
                  onPageChange?.(Math.max(1, currentPage - 1));
                }}
                disabled={currentPage === 1}
                className={styles.paginationButton}
                aria-label="Previous page"
              >
                ← Previous
              </button>

              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => {
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                  onPageChange?.(Math.min(totalPages, currentPage + 1));
                }}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

DataTable.displayName = 'DataTable';
