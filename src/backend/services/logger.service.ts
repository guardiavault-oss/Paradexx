/**
 * Structured Logging Service
 * Replaces console.log with structured, production-ready logging
 * 
 * Features:
 * - Log levels (debug, info, warn, error)
 * - Structured JSON output in production
 * - Colorized output in development
 * - Request ID tracking
 * - Error stack traces
 * - Performance timing
 */

import winston from 'winston';
import path from 'path';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log format for development (colorized, readable)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Log format for production (JSON, structured)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine log level from environment
const logLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase();

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: {
    service: 'guardianx-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console output (always enabled)
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    // Error log file (production only)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          // Combined log file
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
          }),
        ]
      : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'rejections.log'),
          }),
        ]
      : []),
  ],
});

// Convenience methods with type safety
export const log = {
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },
  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    if (error instanceof Error) {
      logger.error(message, { ...meta, error: error.message, stack: error.stack });
    } else {
      logger.error(message, { ...meta, error });
    }
  },
};

// Performance timing helper
export class PerformanceLogger {
  private startTimes: Map<string, number> = new Map();

  start(label: string): void {
    this.startTimes.set(label, Date.now());
  }

  end(label: string, meta?: Record<string, any>): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      logger.warn(`No start time found for label: ${label}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(label);
    
    logger.debug(`Performance: ${label}`, {
      ...meta,
      duration: `${duration}ms`,
      durationMs: duration,
    });

    return duration;
  }

  clear(): void {
    this.startTimes.clear();
  }
}

export const performanceLogger = new PerformanceLogger();

// Request logging middleware helper
export interface RequestLogMeta {
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export function logRequest(meta: RequestLogMeta): void {
  const level = meta.statusCode && meta.statusCode >= 500 ? 'error' : 
                 meta.statusCode && meta.statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, `${meta.method} ${meta.path}`, {
    ...meta,
    type: 'http_request',
  });
}

// Export default logger for backward compatibility
export default logger;

