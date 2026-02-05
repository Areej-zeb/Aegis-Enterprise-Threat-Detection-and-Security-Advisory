/**
 * Error Handler - Centralized error handling and logging
 * Categorizes errors and provides appropriate user messages
 */

export enum ErrorType {
  NETWORK = 'network',
  PARSING = 'parsing',
  COMPONENT = 'component',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  originalError: Error;
  context?: Record<string, any>;
}

class ErrorHandler {
  private monitoringService: ((error: ErrorInfo) => void) | null = null;

  setMonitoringService(service: (error: ErrorInfo) => void) {
    this.monitoringService = service;
  }

  categorizeError(error: Error, context?: Record<string, any>): ErrorInfo {
    let type = ErrorType.UNKNOWN;
    let userMessage = 'Something went wrong. Please try again.';
    let canRetry = true;

    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    ) {
      type = ErrorType.NETWORK;
      userMessage = 'Connection problem. Please check your internet and try again.';
      canRetry = true;
    }
    // Parsing errors
    else if (
      error.message.includes('JSON') ||
      error.message.includes('parse') ||
      error.name === 'SyntaxError'
    ) {
      type = ErrorType.PARSING;
      userMessage = 'Data format error. The page will refresh automatically.';
      canRetry = true;
    }
    // Component errors
    else if (
      error.message.includes('React') ||
      error.message.includes('render') ||
      context?.source === 'component'
    ) {
      type = ErrorType.COMPONENT;
      userMessage = 'Display error. Please refresh the page.';
      canRetry = false;
    }
    // Validation errors
    else if (
      error.message.includes('validation') ||
      error.message.includes('invalid') ||
      context?.source === 'validation'
    ) {
      type = ErrorType.VALIDATION;
      userMessage = error.message; // Use original message for validation
      canRetry = false;
    }

    const errorInfo: ErrorInfo = {
      type,
      message: error.message,
      userMessage,
      canRetry,
      originalError: error,
      context,
    };

    // Log to console for development
    console.error(`[${type.toUpperCase()}] ${error.message}`, {
      error,
      context,
      stack: error.stack,
    });

    // Send to monitoring service
    this.logToMonitoring(errorInfo);

    return errorInfo;
  }

  private logToMonitoring(errorInfo: ErrorInfo) {
    try {
      this.monitoringService?.(errorInfo);
    } catch (monitoringError) {
      console.error('Failed to log error to monitoring service:', monitoringError);
    }
  }

  handleError(error: Error, context?: Record<string, any>): ErrorInfo {
    return this.categorizeError(error, context);
  }
}

export const errorHandler = new ErrorHandler();

// Default monitoring service (can be replaced with real service)
errorHandler.setMonitoringService((errorInfo) => {
  // Replace with your actual monitoring service (Sentry, LogRocket, etc.)
  console.log('📊 Monitoring:', {
    timestamp: new Date().toISOString(),
    type: errorInfo.type,
    message: errorInfo.message,
    userMessage: errorInfo.userMessage,
    context: errorInfo.context,
  });
});