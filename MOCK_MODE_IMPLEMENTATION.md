# Mock Mode Implementation Guide

## Overview
Mock mode and ML models are **ALWAYS OPPOSITE**:
- **Mock mode ON** → ML models OFF (use fake/simulated data)
- **Mock mode OFF** → ML models ON (use real ML predictions)

Never have both ON or both OFF at the same time.

## Implementation Details

### 1. Core Logic
The system uses a single boolean variable that controls both states:

```typescript
isMockMode: boolean;           // User-facing: is mock mode enabled?
mlModelsEnabled: boolean;      // Always: !isMockMode
```

### 2. Where It's Implemented

#### `useSystemStatus` Hook (`frontend_react/src/hooks/useSystemStatus.ts`)
- Manages global system status
- Loads mock mode state from localStorage
- **Key logic**: `mlModelsEnabled = !isMockMode`
- Provides both `isMockMode` and `mlModelsEnabled` to all components

```typescript
const isMockMode = loadMockModeState();
const mlModelsEnabled = !isMockMode;  // Always opposite
```

#### `useMockAwareMetrics` Hook (`frontend_react/src/components/dashboard/MockAwareMetrics.tsx`)
- Decides whether to use mock data or real ML predictions
- **Decision logic**:
  - If `isMockMode === true` → Use fake data
  - If `isMockMode === false` → Use real ML model data

```typescript
const displayMetrics = useMemo(() => {
  if (isMockMode) {
    // Mock mode ON → Use fake data
    return mockMetrics;
  } else {
    // Mock mode OFF → Use real ML model data
    return realMetrics;
  }
}, [realMetrics, isMockMode, mockMetrics]);
```

### 3. How to Use in Components

#### Check if mock mode is enabled:
```typescript
const { systemStatus } = useSystemStatus();
const isMockMode = systemStatus.isMockMode;
const mlModelsEnabled = systemStatus.mlModelsEnabled;

if (isMockMode) {
  // Use fake data
} else {
  // Use real ML predictions
}
```

#### Use the metrics hook:
```typescript
const { metrics, isMockMode, mlModelsEnabled } = useMockAwareMetrics(realMetrics);

// metrics will automatically be:
// - Fake data if isMockMode is true
// - Real data if isMockMode is false
```

### 4. Toggling Mock Mode

To toggle mock mode, dispatch a custom event:

```typescript
// Turn mock mode ON
localStorage.setItem("aegis_mock_mode_enabled", "true");
window.dispatchEvent(new CustomEvent('mockModeToggle', { 
  detail: { enabled: true } 
}));

// Turn mock mode OFF
localStorage.setItem("aegis_mock_mode_enabled", "false");
window.dispatchEvent(new CustomEvent('mockModeToggle', { 
  detail: { enabled: false } 
}));
```

### 5. Default State

- **Mock mode**: OFF (false)
- **ML models**: ON (true)
- This means the system uses real ML predictions by default

### 6. Storage

Mock mode state is persisted in localStorage:
- Key: `aegis_mock_mode_enabled`
- Value: `"true"` or `"false"`

## Verification Checklist

- [ ] `isMockMode` and `mlModelsEnabled` are always opposite
- [ ] When toggling mock mode, both values update together
- [ ] Components check `isMockMode` to decide data source
- [ ] No component uses both mock data AND real ML predictions simultaneously
- [ ] Default state is mock mode OFF (ML models ON)

## Example: Dashboard Page

```typescript
const { metrics: displayMetrics, isMockMode } = useMockAwareMetrics(metrics);

// displayMetrics will be:
// - Fake data if isMockMode is true
// - Real ML predictions if isMockMode is false

// Show indicator in UI
<span>{isMockMode ? '(mock)' : ''}</span>
```

This ensures the UI always reflects the correct data source.
