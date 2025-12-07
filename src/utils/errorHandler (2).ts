/**
 * Advanced Error Handler System
 */

import { logger } from './logger';
import { toast } from '../components/Toast';

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  WALLET = 'WALLET',
  TRANSACTION = 'TRANSACTION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: number;
  userMessage?: string;
  recoverable?: boolean;
  retryable?: boolean;
}

export class ParadoxError extends Error implements AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: number;
  userMessage?: string;
  recoverable: boolean;
  retryable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options?: {
      code?: string;
      statusCode?: number;
      details?: any;
      userMessage?: string;
      recoverable?: boolean;
      retryable?: boolean;
    }
  ) {
    super(message);
    this.name = 'ParadoxError';
    this.type = type;
    this.severity = severity;
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.timestamp = Date.now();
    this.userMessage = options?.userMessage || this.getDefaultUserMessage();
    this.recoverable = options?.recoverable ?? true;
    this.retryable = options?.retryable ?? false;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParadoxError);
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Network connection error. Please check your internet connection.';
      case ErrorType.API:
        return 'Service temporarily unavailable. Please try again later.';
      case ErrorType.VALIDATION:
        return 'Invalid input. Please check your data and try again.';
      case ErrorType.WALLET:
        return 'Wallet error. Please check your wallet connection.';
      case ErrorType.TRANSACTION:
        return 'Transaction failed. Please try again.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please sign in again.';
      case ErrorType.PERMISSION:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.TIMEOUT:
        return 'Request timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

class ErrorHandler {
  private errorListeners: Array<(error: AppError) => void> = [];
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, number> = new Map();

  /**
   * Handle an error
   */
  handle(error: Error | AppError, showToast: boolean = true): void {
    const appError = this.normalizeError(error);

    // Log the error
    this.logError(appError);

    // Track error frequency
    this.trackError(appError);

    // Show user notification
    if (showToast) {
      this.notifyUser(appError);
    }

    // Notify listeners
    this.notifyListeners(appError);

    // Report to error tracking service (e.g., Sentry)
    this.reportError(appError);
  }

  /**
   * Normalize any error to AppError
   */
  private normalizeError(error: Error | AppError): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    // Check for specific error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new ParadoxError(
        error.message,
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        { retryable: true }
      );
    }

    if (error.message.includes('timeout')) {
      return new ParadoxError(
        error.message,
        ErrorType.TIMEOUT,
        ErrorSeverity.MEDIUM,
        { retryable: true }
      );
    }

    if (error.message.includes('wallet') || error.message.includes('MetaMask')) {
      return new ParadoxError(
        error.message,
        ErrorType.WALLET,
        ErrorSeverity.HIGH
      );
    }

    // Default unknown error
    return new ParadoxError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { details: { originalError: error } }
    );
  }

  /**
   * Check if error is AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error.type === 'string' && typeof error.severity === 'string';
  }

  /**
   * Log error
   */
  private logError(error: AppError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    };

    if (error.severity === ErrorSeverity.CRITICAL) {
      logger.critical(error.message, logData, ['error', error.type]);
    } else if (error.severity === ErrorSeverity.HIGH) {
      logger.error(error.message, logData, ['error', error.type]);
    } else {
      logger.warn(error.message, logData, ['error', error.type]);
    }
  }

  /**
   * Track error frequency
   */
  private trackError(error: AppError): void {
    const key = `${error.type}_${error.code || 'unknown'}`;
    const count = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, count);
    this.lastErrors.set(key, Date.now());

    // Alert if error is happening too frequently
    if (count > 10) {
      logger.warn(`Error ${key} has occurred ${count} times`, { error });
    }
  }

  /**
   * Notify user with toast
   */
  private notifyUser(error: AppError): void {
    const message = error.userMessage || error.message;

    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      toast.error(message);
    } else if (error.severity === ErrorSeverity.MEDIUM) {
      toast.warning(message);
    } else {
      toast.info(message);
    }
  }

  /**
   * Notify error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error listener failed:', err);
      }
    });
  }

  /**
   * Report error to external service
   */
  private reportError(error: AppError): void {
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
      console.info('Error reported to tracking service:', error.type);
    }
  }

  /**
   * Add error listener
   */
  addListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: Array<{ key: string; count: number; lastSeen: number }>;
  } {
    const errorsByType: Record<string, number> = {};
    let totalErrors = 0;

    this.errorCounts.forEach((count, key) => {
      const type = key.split('_')[0];
      errorsByType[type] = (errorsByType[type] || 0) + count;
      totalErrors += count;
    });

    const recentErrors = Array.from(this.errorCounts.entries())
      .map(([key, count]) => ({
        key,
        count,
        lastSeen: this.lastErrors.get(key) || 0,
      }))
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 10);

    return {
      totalErrors,
      errorsByType,
      recentErrors,
    };
  }

  /**
   * Clear error tracking
   */
  clearStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Helper functions for common errors
export const errorHelpers = {
  /**
   * Create network error
   */
  networkError: (message: string, details?: any): ParadoxError => {
    return new ParadoxError(message, ErrorType.NETWORK, ErrorSeverity.MEDIUM, {
      details,
      retryable: true,
    });
  },

  /**
   * Create API error
   */
  apiError: (
    message: string,
    statusCode?: number,
    details?: any
  ): ParadoxError => {
    return new ParadoxError(message, ErrorType.API, ErrorSeverity.MEDIUM, {
      statusCode,
      details,
      retryable: statusCode ? statusCode >= 500 : false,
    });
  },

  /**
   * Create validation error
   */
  validationError: (message: string, details?: any): ParadoxError => {
    return new ParadoxError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, {
      details,
      recoverable: true,
    });
  },

  /**
   * Create wallet error
   */
  walletError: (message: string, details?: any): ParadoxError => {
    return new ParadoxError(message, ErrorType.WALLET, ErrorSeverity.HIGH, {
      details,
      recoverable: true,
    });
  },

  /**
   * Create transaction error
   */
  transactionError: (message: string, txHash?: string, details?: any): ParadoxError => {
    return new ParadoxError(message, ErrorType.TRANSACTION, ErrorSeverity.HIGH, {
      details: { txHash, ...details },
      recoverable: true,
      retryable: true,
    });
  },

  /**
   * Create authentication error
   */
  authError: (message: string): ParadoxError => {
    return new ParadoxError(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, {
      recoverable: true,
    });
  },

  /**
   * Create permission error
   */
  permissionError: (message: string): ParadoxError => {
    return new ParadoxError(message, ErrorType.PERMISSION, ErrorSeverity.MEDIUM, {
      recoverable: false,
    });
  },

  /**
   * Create not found error
   */
  notFoundError: (resource: string): ParadoxError => {
    return new ParadoxError(
      `${resource} not found`,
      ErrorType.NOT_FOUND,
      ErrorSeverity.LOW,
      {
        userMessage: `The ${resource.toLowerCase()} you're looking for doesn't exist.`,
      }
    );
  },

  /**
   * Create timeout error
   */
  timeoutError: (operation: string): ParadoxError => {
    return new ParadoxError(
      `${operation} timed out`,
      ErrorType.TIMEOUT,
      ErrorSeverity.MEDIUM,
      {
        retryable: true,
        userMessage: `${operation} is taking longer than expected. Please try again.`,
      }
    );
  },
};

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    errorHandler.handle(new ParadoxError(
      event.reason?.message || 'Unhandled promise rejection',
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      { details: event.reason }
    ));
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    errorHandler.handle(new ParadoxError(
      event.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      { details: { filename: event.filename, lineno: event.lineno, colno: event.colno } }
    ));
  });
}
