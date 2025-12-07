/**
 * Logger System with different log levels and formatting
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: any;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageSize: number;
  prefix?: string;
  development?: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageSize: 1000,
      development: process.env.NODE_ENV === 'development',
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.loadLogsFromStorage();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    
    let formatted = `${prefix}[${timestamp}] [${levelName}] ${message}`;
    
    if (context) {
      formatted += `\n${JSON.stringify(context, null, 2)}`;
    }
    
    return formatted;
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        return 'log';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#9CA3AF'; // Gray
      case LogLevel.INFO:
        return '#0080FF'; // Blue
      case LogLevel.WARN:
        return '#F59E0B'; // Orange
      case LogLevel.ERROR:
        return '#DC143C'; // Red
      case LogLevel.CRITICAL:
        return '#8B0000'; // Dark Red
      default:
        return '#FFFFFF';
    }
  }

  private logToConsole(level: LogLevel, message: string, context?: any): void {
    if (!this.config.enableConsole) return;

    const method = this.getConsoleMethod(level);
    const color = this.getLogColor(level);
    const levelName = LogLevel[level];

    if (this.config.development) {
      console[method](
        `%c[${levelName}]%c ${message}`,
        `color: ${color}; font-weight: bold;`,
        'color: inherit;',
        context || ''
      );
    } else {
      console[method](this.formatMessage(level, message, context));
    }
  }

  private addToStorage(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    this.logs.push(entry);

    // Limit storage size
    if (this.logs.length > this.config.maxStorageSize) {
      this.logs = this.logs.slice(-this.config.maxStorageSize);
    }

    // Persist to localStorage
    try {
      localStorage.setItem(
        'paradox_logs',
        JSON.stringify(this.logs.slice(-100)) // Keep last 100 in localStorage
      );
    } catch (error) {
      // Storage full, clear old logs
      this.logs = this.logs.slice(-50);
    }
  }

  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem('paradox_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load logs from storage', error);
    }
  }

  private log(level: LogLevel, message: string, context?: any, tags?: string[]): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      sessionId: this.sessionId,
      tags,
    };

    this.logToConsole(level, message, context);
    this.addToStorage(entry);
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: any, tags?: string[]): void {
    this.log(LogLevel.DEBUG, message, context, tags);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: any, tags?: string[]): void {
    this.log(LogLevel.INFO, message, context, tags);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: any, tags?: string[]): void {
    this.log(LogLevel.WARN, message, context, tags);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | any, tags?: string[]): void {
    const context = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    this.log(LogLevel.ERROR, message, context, tags);
  }

  /**
   * Critical level logging
   */
  critical(message: string, error?: Error | any, tags?: string[]): void {
    const context = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    this.log(LogLevel.CRITICAL, message, context, tags);
  }

  /**
   * Get all logs
   */
  getLogs(filter?: {
    level?: LogLevel;
    tags?: string[];
    startTime?: number;
    endTime?: number;
  }): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level !== undefined) {
        filtered = filtered.filter((log) => log.level >= filter.level!);
      }

      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter((log) =>
          log.tags?.some((tag) => filter.tags!.includes(tag))
        );
      }

      if (filter.startTime) {
        filtered = filtered.filter((log) => log.timestamp >= filter.startTime!);
      }

      if (filter.endTime) {
        filtered = filtered.filter((log) => log.timestamp <= filter.endTime!);
      }
    }

    return filtered;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('paradox_logs');
    } catch (error) {
      console.error('Failed to clear logs from storage', error);
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Group related logs
   */
  group(label: string, fn: () => void): void {
    if (this.config.enableConsole) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  /**
   * Time a function execution
   */
  time<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.debug(`${label} took ${duration.toFixed(2)}ms`);
    
    return result;
  }

  /**
   * Time an async function execution
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.debug(`${label} took ${duration.toFixed(2)}ms`);
    
    return result;
  }
}

// Create logger instances
export const logger = new Logger({
  prefix: 'Paradox',
  development: process.env.NODE_ENV === 'development',
});

// Specialized loggers
export const walletLogger = new Logger({
  prefix: 'Wallet',
  level: LogLevel.DEBUG,
});

export const transactionLogger = new Logger({
  prefix: 'Transaction',
  level: LogLevel.INFO,
});

export const securityLogger = new Logger({
  prefix: 'Security',
  level: LogLevel.WARN,
});

export const performanceLogger = new Logger({
  prefix: 'Performance',
  level: LogLevel.DEBUG,
  enableStorage: false, // Don't store performance logs
});

// Helper functions
export const logHelpers = {
  /**
   * Log transaction events
   */
  logTransaction: (
    action: 'initiated' | 'signed' | 'sent' | 'confirmed' | 'failed',
    txHash: string,
    details?: any
  ) => {
    const message = `Transaction ${action}: ${txHash}`;
    
    if (action === 'failed') {
      transactionLogger.error(message, details, ['transaction', action]);
    } else {
      transactionLogger.info(message, details, ['transaction', action]);
    }
  },

  /**
   * Log wallet events
   */
  logWallet: (
    action: 'connected' | 'disconnected' | 'switched' | 'error',
    details?: any
  ) => {
    const message = `Wallet ${action}`;
    
    if (action === 'error') {
      walletLogger.error(message, details, ['wallet', action]);
    } else {
      walletLogger.info(message, details, ['wallet', action]);
    }
  },

  /**
   * Log security events
   */
  logSecurity: (
    event: 'login' | 'logout' | 'suspicious' | 'blocked' | 'verified',
    details?: any
  ) => {
    const message = `Security event: ${event}`;
    
    if (event === 'suspicious' || event === 'blocked') {
      securityLogger.warn(message, details, ['security', event]);
    } else {
      securityLogger.info(message, details, ['security', event]);
    }
  },

  /**
   * Log performance metrics
   */
  logPerformance: (
    metric: string,
    duration: number,
    details?: any
  ) => {
    performanceLogger.debug(
      `Performance: ${metric} - ${duration.toFixed(2)}ms`,
      details,
      ['performance']
    );
  },

  /**
   * Log API calls
   */
  logAPI: (
    method: string,
    endpoint: string,
    status: 'success' | 'error',
    duration?: number,
    details?: any
  ) => {
    const message = `API ${method} ${endpoint} - ${status}`;
    
    if (status === 'error') {
      logger.error(message, details, ['api']);
    } else {
      logger.info(message, { ...details, duration }, ['api']);
    }
  },
};

// Export LogLevel for external use
export { LogLevel };
