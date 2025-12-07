/**
 * Frontend Logger Service
 * Simple logging service for React components
 * Uses console methods with optional log levels
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

const isDevelopment = import.meta.env.DEV;
const logLevel = (import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'info')).toLowerCase();

const shouldLog = (level: string): boolean => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(logLevel);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex >= currentLevelIndex;
};

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, error?: Error | unknown, ...args: any[]) => void;
}

const createLogger = (): Logger => ({
  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      if (isDevelopment) {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, error?: Error | unknown, ...args: any[]) => {
    if (shouldLog('error')) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error, ...args);
      } else {
        console.error(`[ERROR] ${message}`, error, ...args);
      }
    }
  },
});

export const logger = createLogger();

// Convenience methods
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
    logger.error(message, error, meta);
  },
};

export default logger;

