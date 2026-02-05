# UI Consistency Usage Guide

## Fixing Specific Inconsistencies

### 1. ML Model Status - Consistent Colors/Icons

**Before:** Inconsistent status displays
**After:** Use `StatusIndicator` component

```tsx
import { StatusIndicator } from './common';

// Replace inconsistent status displays with:
<StatusIndicator status="active" />
<StatusIndicator status="error" />
<StatusIndicator status="warning" />
```

### 2. Risk Score - Consistent Color Coding

**Before:** Manual color coding
**After:** Use `RiskScore` component

```tsx
import { RiskScore } from './common';

// Replace manual risk displays with:
<RiskScore score={62} showLabel={true} />
<RiskScore score={85} size="large" />
```

### 3. Empty States - Standardized Messages

**Before:** Different empty state messages
**After:** Use `EmptyState` component

```tsx
import { EmptyState } from './common';

// Replace "0 detections shown" with:
<EmptyState
  title="No detections found"
  description="No security threats detected in the current time period"
  action={{
    label: "Refresh Data",
    onClick: handleRefresh
  }}
/>

// Replace "No recent alerts available" with:
<EmptyState
  title="No recent alerts"
  description="All systems are running normally"
  icon="🛡️"
/>
```

### 4. Button States - Proper Disable Logic

**Before:** Button doesn't disable when streaming
**After:** Use `ActionButton` with streaming state

```tsx
import { ActionButton } from './common';
import { useStreamingState } from '../hooks/useStreamingState';

function StreamingControls() {
  const { isStreaming, isConnecting, startStream, stopStream } = useStreamingState();

  return (
    <ActionButton
      onClick={isStreaming ? stopStream : startStream}
      disabled={isConnecting}
      loading={isConnecting}
      loadingText="Connecting..."
      variant={isStreaming ? "error" : "primary"}
    >
      {isStreaming ? "Stop Live Stream" : "Start Live Stream"}
    </ActionButton>
  );
}
```

## Component Replacement Checklist

### Status Displays
- [ ] Replace all manual status styling with `StatusIndicator`
- [ ] Ensure consistent colors: green=active, red=error, yellow=warning
- [ ] Add proper icons for each status type

### Risk Scores
- [ ] Replace manual risk score displays with `RiskScore`
- [ ] Use consistent color coding: green=low, yellow=moderate, orange=high, red=critical
- [ ] Show risk level labels where appropriate

### Empty States
- [ ] Replace all "no data" messages with `EmptyState`
- [ ] Use consistent icons and messaging
- [ ] Add refresh actions where appropriate

### Button States
- [ ] Replace manual button styling with `ActionButton`
- [ ] Implement proper disabled states for streaming/loading
- [ ] Use consistent loading indicators

## Import Patterns

```tsx
// Single import for all common components
import { 
  StatusIndicator, 
  RiskScore, 
  EmptyState, 
  ActionButton 
} from '../components/common';

// For hooks
import { useStreamingState } from '../hooks/useStreamingState';
import { useDataLoader } from '../hooks/useDataLoader';

// For utilities
import { getStatusConfig, getRiskConfig } from '../utils/statusUtils';
```