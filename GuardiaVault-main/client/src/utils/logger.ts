/**
 * Client-side Structured Logging
 * Provides structured logging with Sentry integration
 */

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

/**
 * Check if we're in development mode
 */
const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Get Sentry client if available
 */
function getSentry() {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    return (window as any).Sentry;
  }
  return null;
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext) {
  if (isDevelopment) {
    console.debug(`[DEBUG] ${message}`, context || {});
  }
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext) {
  if (isDevelopment) {
    console.info(`[INFO] ${message}`, context || {});
  }
}

/**
 * Log warning
 */
export function logWarn(message: string, context?: LogContext) {
  const sentry = getSentry();
  if (sentry) {
    sentry.captureMessage(message, {
      level: 'warning',
      contexts: context ? { custom: context } : undefined,
    });
  }
  console.warn(`[WARN] ${message}`, context || {});
}

/**
 * Log error
 */
export function logError(error: Error | unknown, context?: LogContext) {
  const sentry = getSentry();
  
  if (error instanceof Error) {
    if (sentry) {
      sentry.captureException(error, {
        contexts: context ? { custom: context } : undefined,
      });
    }
    console.error(`[ERROR] ${error.message}`, {
      error,
      ...context,
    });
  } else {
    const errorMessage = String(error);
    if (sentry) {
      sentry.captureMessage(errorMessage, {
        level: 'error',
        contexts: context ? { custom: context } : undefined,
      });
    }
    console.error(`[ERROR] ${errorMessage}`, context || {});
  }
}

/**
 * Remove console.log from production builds
 * This is handled by build tools, but we provide a no-op for clarity
 */
export function logMessage(message: string, context?: LogContext) {
  if (isDevelopment) {
    console.log(`[LOG] ${message}`, context || {});
  }
}

