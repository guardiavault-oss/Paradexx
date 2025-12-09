/**
 * Client-side Error Tracking
 * Integrates Sentry for frontend error tracking
 */

import { logDebug, logError } from '../utils/logger';

let sentryInitialized = false;

/**
 * Initialize Sentry for client-side
 * Only initializes if VITE_SENTRY_DSN is provided
 */
export function initSentryClient() {
  if (sentryInitialized) return Promise.resolve();

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (!sentryDsn) {
    // Only log in development to avoid console noise in production
    // This is acceptable - it's a debug message about configuration
    if (import.meta.env.MODE === 'development') {
      // Intentional debug log for development configuration info
      logDebug('Sentry not configured - skipping initialization');
    }
    return Promise.resolve();
  }

  return import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE || 'development',
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      profilesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

      integrations: [
        // Browser tracing
        Sentry.browserTracingIntegration(),
      ],

      // Filter out browser noise and known dependency warnings
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'ChunkLoadError',
        // Zustand deprecation warnings (from dependencies)
        /\[DEPRECATED\] Default export is deprecated/,
        // Browser extension errors (Phantom, etc.)
        /disconnected port object/,
        /The page keeping the extension port/,
        /RPC router stream error/,
        // Service worker warnings (handled by browser)
        /Event handler of.*event must be added on the initial evaluation/,
        // Phantom wallet API errors
        /api\.phantom\.app.*400/,
      ],

      // Release tracking
      release: import.meta.env.VITE_SENTRY_RELEASE,

      beforeSend(event, hint) {
        // Don't send in development unless explicitly testing
        if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
    });

    sentryInitialized = true;
    logDebug('✅ Sentry client error tracking initialized');
  }).catch((error) => {
    logError(error instanceof Error ? error : new Error(String(error)), { context: 'Failed to initialize Sentry client' });
  });
}

/**
 * Capture client-side exception
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized) {
    logError(new Error(`Client error (Sentry not initialized): ${error.message}`));
    return;
  }

  try {
    const Sentry = await import('@sentry/react');

    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), { context: 'Failed to capture exception to Sentry' });
  }
}

/**
 * Capture client-side message
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryInitialized) {
    logDebug(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureMessage(message, level);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: 'Failed to capture message to Sentry' });
  }
}

