/**
 * Frontend Logger Service
 * Simple logging service for React components
 * Uses console methods with optional log levels
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
interface Logger {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, error?: Error | unknown, ...args: any[]) => void;
}
export declare const logger: Logger;
export declare const log: {
    debug: (message: string, meta?: Record<string, any>) => void;
    info: (message: string, meta?: Record<string, any>) => void;
    warn: (message: string, meta?: Record<string, any>) => void;
    error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => void;
};
export default logger;
//# sourceMappingURL=logger.service.d.ts.map