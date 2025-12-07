/**
 * Error Tracking Service
 * Integrates Sentry for production error tracking and monitoring
 */

import { logInfo, logError } from "./logger";

let sentryInitialized = false;

/**
 * Initialize Sentry error tracking
 * Only initializes if SENTRY_DSN is provided
 * Must be called synchronously before other middleware
 */
export async function initSentry() {
  if (sentryInitialized) return;
  
  const sentryDsn = process.env.SENTRY_DSN;
  if (!sentryDsn) {
    logInfo('⚠️  Sentry not configured - skipping error tracking initialization');
    return;
  }

  try {
    const Sentry = await import('@sentry/node');

    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Filter out noise
      ignoreErrors: [
        // Browser errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Network errors
        'NetworkError',
        'TimeoutError',
      ],

      // Configure release tracking
      release: process.env.SENTRY_RELEASE,

      // Additional context
      initialScope: {
        tags: {
          component: 'backend',
        },
      },
    });

    sentryInitialized = true;
    logInfo('✅ Sentry error tracking initialized');
  } catch (error) {
    logError(new Error(`❌ Failed to initialize Sentry: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Capture an exception
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized) {
    logError(new Error(`Error (Sentry not initialized): ${error.message}`));
    return;
  }

  try {
    const Sentry = await import('@sentry/node');

    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  } catch (err) {
    logError(new Error(`Failed to capture exception to Sentry: ${err instanceof Error ? err.message : String(err)}`));
    logError(new Error(`Original error: ${error.message}`));
  }
}

/**
 * Capture a message (non-error)
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryInitialized) {
    logInfo(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  try {
    const Sentry = await import('@sentry/node');
    Sentry.captureMessage(message, level);
  } catch (error) {
    logError(new Error(`Failed to capture message to Sentry: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Add user context to Sentry
 */
export async function setUserContext(userId: string, email?: string, walletAddress?: string) {
  if (!sentryInitialized) return;

  try {
    const Sentry = await import('@sentry/node');
    Sentry.setUser({
      id: userId,
      email: email,
      username: walletAddress,
    });
  } catch (error) {
    logError(new Error(`Failed to set user context in Sentry: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Clear user context
 */
export async function clearUserContext() {
  if (!sentryInitialized) return;

  try {
    const Sentry = await import('@sentry/node');
    Sentry.setUser(null);
  } catch (error) {
    logError(new Error(`Failed to clear user context in Sentry: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Get Sentry request handler middleware
 * Must be added before routes
 */
export async function getSentryRequestHandler() {
  if (!sentryInitialized) return null;

  try {
    const Sentry = await import('@sentry/node');
    const handlers = Sentry.default?.Handlers || (Sentry as any).Handlers;
    if (!handlers) return null;
    return handlers.requestHandler();
  } catch (error) {
    logError(new Error(`Failed to get Sentry request handler: ${error instanceof Error ? error.message : String(error)}`));
    return null;
  }
}

/**
 * Get Sentry error handler middleware
 * Must be added after routes but before custom error handler
 */
export async function getSentryErrorHandler() {
  if (!sentryInitialized) return null;

  try {
    const Sentry = await import('@sentry/node');
    const handlers = Sentry.default?.Handlers || (Sentry as any).Handlers;
    if (!handlers) return null;
    return handlers.errorHandler();
  } catch (error) {
    logError(new Error(`Failed to get Sentry error handler: ${error instanceof Error ? error.message : String(error)}`));
    return null;
  }
}

