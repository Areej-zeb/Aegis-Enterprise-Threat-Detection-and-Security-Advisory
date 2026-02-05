/**
 * Shared common components for the Aegis dashboard
 */

export { SeverityBadge } from './SeverityBadge';
export { StatusPill } from './StatusPill';
export { PageHeader } from './PageHeader';
export { StatCard } from './StatCard';
export { ErrorAlert } from './ErrorAlert';

// New consistent components
export { StatusIndicator } from './StatusIndicator';
export { RiskScore } from './RiskScore';
export { EmptyState } from './EmptyState';
export { ActionButton } from './ActionButton';
export { DataStateRenderer } from './DataStateRenderer';

// Mock-aware components
export { RecentAlertsList } from '../alerts/RecentAlertsList';
export { MockAwareMetrics, useMockAwareMetrics } from '../dashboard/MockAwareMetrics';
