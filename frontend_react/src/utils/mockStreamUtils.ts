/**
 * Mock Stream Utilities
 * Centralized utilities for managing mock stream state consistently across the app
 */

// Get current mock stream state from localStorage
export function getMockStreamState(): boolean {
  try {
    return localStorage.getItem("aegis_mock_stream_enabled") === "true";
  } catch {
    return false;
  }
}

// Set mock stream state and notify all components
export function setMockStreamState(enabled: boolean): void {
  try {
    localStorage.setItem("aegis_mock_stream_enabled", enabled.toString());
    
    // Dispatch event for other components to listen to
    window.dispatchEvent(new CustomEvent('mockStreamToggle', {
      detail: { enabled }
    }));
    
    console.log(`Mock stream ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Failed to set mock stream state:', error);
  }
}

// Toggle mock stream state
export function toggleMockStream(): boolean {
  const currentState = getMockStreamState();
  const newState = !currentState;
  setMockStreamState(newState);
  return newState;
}

// Check if we should use mock data based on system status
export function shouldUseMockData(systemStatus: { mockStream: 'ON' | 'OFF' }): boolean {
  return systemStatus.mockStream === 'ON';
}

// Utility to handle API calls with mock fallback
export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockDataGenerator: () => T,
  systemStatus: { mockStream: 'ON' | 'OFF' },
  logPrefix = '[API]'
): Promise<T> {
  // If mock is ON, use mock data directly
  if (shouldUseMockData(systemStatus)) {
    console.log(`${logPrefix} Using mock data (Mock: ON)`);
    return mockDataGenerator();
  }

  try {
    // Try real API call
    return await apiCall();
  } catch (error) {
    // If API fails and mock is available, fall back to mock
    if (systemStatus.mockStream === 'ON') {
      console.log(`${logPrefix} API failed, using mock fallback`);
      return mockDataGenerator();
    }
    // Otherwise, re-throw the error
    throw error;
  }
}

// Type definitions for consistency
export interface MockStreamStatus {
  enabled: boolean;
  source: 'localStorage' | 'systemStatus';
}

export interface MockAwareApiOptions {
  logPrefix?: string;
  enableFallback?: boolean;
}