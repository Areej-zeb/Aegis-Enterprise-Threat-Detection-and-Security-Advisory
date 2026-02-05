/**
 * DataStateRenderer Component
 * Handles loading, error, and empty states consistently
 */

import React from 'react';
import { LoadingState } from '../../hooks/useDataLoader';
import './DataStateRenderer.css';

interface DataStateRendererProps {
  state: LoadingState;
  error: Error | null;
  isEmpty: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
}

export const DataStateRenderer: React.FC<DataStateRendererProps> = ({
  state,
  error,
  isEmpty,
  onRefresh,
  children,
  loadingMessage = 'Loading data...',
  emptyMessage = 'No data available',
  errorMessage = 'Failed to load data',
}) => {
  if (state === 'loading') {
    return (
      <div className="data-state-container data-state-loading">
        <div className="spinner"></div>
        <p>{loadingMessage}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="data-state-container data-state-error">
        <div className="error-icon">⚠️</div>
        <p className="error-title">{errorMessage}</p>
        {error && <p className="error-detail">{error.message}</p>}
        <button className="refresh-button" onClick={onRefresh}>
          Try Again
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="data-state-container data-state-empty">
        <div className="empty-icon">📭</div>
        <p>{emptyMessage}</p>
        <button className="refresh-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
