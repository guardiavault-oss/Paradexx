/**
 * Structured Logging Service
 * Uses Pino for fast, structured JSON logging
 */

import pino from 'pino';
import crypto from 'crypto';
import type { Request, Response } from 'express';

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create Pino logger instance
const logger = pino({
  level: logLevel,
  // Pretty print in development, JSON in production
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
  // Base configuration
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.secret',
      'req.body.recoveryPhrase',
      'req.body.mnemonic',
      'password',
      'token',
      'secret',
      'recoveryPhrase',
      'mnemonic',
    ],
    remove: true,
  },
});

/**
 * Create a child logger with context
 */
export function createLogger(additionalFields?: Record<string, any>) {
  return logger.child(additionalFields || {});
}

/**
 * Log an error
 */
export function logError(error: Error | unknown, context?: Record<string, any>) {
  if (error instanceof Error) {
    logger.error({ err: error, ...context }, error.message);
  } else {
    logger.error({ ...context }, String(error));
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(context || {}, message);
}

/**
 * Log a warning
 */
export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn(context || {}, message);
}

/**
 * Log a debug message
 */
export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug(context || {}, message);
}

/**
 * Express request logger middleware
 * Logs HTTP requests with context
 */
export function requestLogger() {
  return (req: Request, res: Response, next: () => void) => {
    const start = Date.now();
    const requestId = crypto.randomUUID?.() || `req-${Date.now()}-${Math.random()}`;
    const requestLogger = logger.child({ requestId });

    // Add request ID to request object for later use
    (req as any).requestId = requestId;

    // Log request start
    requestLogger.info(
      {
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: (req.session as any)?.userId,
      },
      `${req.method} ${req.path}`
    );

    // Capture response
    const originalResJson = res.json.bind(res);
    let responseBody: any = undefined;

    res.json = function (body: any) {
      responseBody = body;
      return originalResJson(body);
    };

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: res.get('content-length'),
        userId: (req.session as any)?.userId,
      };

      // Add response body for errors (sanitized by Pino)
      if (res.statusCode >= 400 && responseBody) {
        (logData as any).response = responseBody;
      }

      const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      requestLogger[logLevel](logData, `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    });

    next();
  };
}

/**
 * Audit log for sensitive operations
 * Use this for operations that need to be tracked for compliance
 */
export function auditLog(
  action: string,
  userId: string | undefined,
  details?: Record<string, any>
) {
  logger.info(
    {
      type: 'audit',
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    },
    `[AUDIT] ${action}`
  );
}

/**
 * Flush all pending logs
 * Useful for graceful shutdown to ensure all logs are written
 */
export async function flush(): Promise<void> {
  return new Promise((resolve) => {
    // Pino logger doesn't have a flush method by default
    // But we can use a small delay to ensure logs are written
    // For production with log transports, this should be adjusted
    setTimeout(() => {
      resolve();
    }, 100);
  });
}

// Export default logger instance
export default logger;

