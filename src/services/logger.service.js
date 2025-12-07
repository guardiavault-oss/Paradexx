"use strict";
/**
 * Frontend Logger Service
 * Simple logging service for React components
 * Uses console methods with optional log levels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const isDevelopment = import.meta.env.DEV;
const logLevel = (import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'info')).toLowerCase();
const shouldLog = (level) => {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
};
const createLogger = () => ({
    debug: (message, ...args) => {
        if (shouldLog('debug')) {
            if (isDevelopment) {
                console.debug(`[DEBUG] ${message}`, ...args);
            }
        }
    },
    info: (message, ...args) => {
        if (shouldLog('info')) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    warn: (message, ...args) => {
        if (shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },
    error: (message, error, ...args) => {
        if (shouldLog('error')) {
            if (error instanceof Error) {
                console.error(`[ERROR] ${message}`, error, ...args);
            }
            else {
                console.error(`[ERROR] ${message}`, error, ...args);
            }
        }
    },
});
exports.logger = createLogger();
// Convenience methods
exports.log = {
    debug: (message, meta) => {
        exports.logger.debug(message, meta);
    },
    info: (message, meta) => {
        exports.logger.info(message, meta);
    },
    warn: (message, meta) => {
        exports.logger.warn(message, meta);
    },
    error: (message, error, meta) => {
        exports.logger.error(message, error, meta);
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.service.js.map