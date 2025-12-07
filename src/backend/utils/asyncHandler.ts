/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch errors
 * Eliminates need for try-catch blocks in every route
 * 
 * Usage:
 *   router.get('/endpoint', asyncHandler(async (req, res) => {
 *     // No try-catch needed
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   }));
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';

/**
 * Wraps an async route handler to automatically catch errors
 * 
 * @param fn - Async route handler function
 * @returns Wrapped handler that catches errors and passes to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log error with context
      logger.error('Route handler error', error, {
        method: req.method,
        path: req.path,
        query: req.query,
        params: req.params,
        userId: (req as any).userId, // If auth middleware sets this
      });

      // Pass to Express error handler
      next(error);
    });
  };
}

/**
 * Wraps multiple async route handlers
 * Useful for middleware chains
 */
export function asyncHandlers(
  ...handlers: Array<(req: Request, res: Response, next: NextFunction) => Promise<any> | any>
) {
  return handlers.map((handler) => {
    if (handler.constructor.name === 'AsyncFunction' || handler.toString().includes('async')) {
      return asyncHandler(handler as any);
    }
    return handler;
  });
}

/**
 * Creates an async handler with custom error handling
 */
export function asyncHandlerWithError(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  errorHandler?: (error: any, req: Request, res: Response, next: NextFunction) => void
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (errorHandler) {
        return errorHandler(error, req, res, next);
      }
      
      logger.error('Route handler error', error, {
        method: req.method,
        path: req.path,
      });
      
      next(error);
    });
  };
}

