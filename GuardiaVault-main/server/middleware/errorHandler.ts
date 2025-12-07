/**
 * Comprehensive Error Handling Middleware
 * Production-ready error handling with proper logging and user-friendly messages
 */

import type { Request, Response, NextFunction } from "express";
import { logError, logInfo } from "../services/logger";
import { captureException } from "../services/errorTracking";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  details?: any;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create user-friendly error messages
 */
function getUserFriendlyMessage(error: AppError): string {
  // Database errors
  if (error.code === "23505") {
    return "This record already exists. Please try a different value.";
  }
  if (error.code === "23503") {
    return "Referenced record not found. Please check your input.";
  }
  if (error.code === "23502") {
    return "Required field is missing. Please complete all required fields.";
  }

  // Network errors
  if (error.message.includes("ECONNREFUSED")) {
    return "Service temporarily unavailable. Please try again later.";
  }
  if (error.message.includes("ETIMEDOUT")) {
    return "Request timed out. Please try again.";
  }

  // Validation errors
  if (error.code === "VALIDATION_ERROR") {
    return error.message || "Invalid input. Please check your data.";
  }

  // Authentication errors
  if (error.statusCode === 401) {
    return "Authentication required. Please log in.";
  }
  if (error.statusCode === 403) {
    return "Access denied. You don't have permission for this action.";
  }

  // Rate limiting
  if (error.code === "RATE_LIMIT_EXCEEDED") {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Default user-friendly message
  if (error.isOperational) {
    return error.message;
  }

  // For non-operational errors, return generic message
  return "An unexpected error occurred. Our team has been notified.";
}

/**
 * Main error handler middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logError(error, {
    context: "errorHandler",
    path: req.path,
    method: req.method,
    userId: (req.session as any)?.userId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Send to error tracking (Sentry)
  if (error.statusCode && error.statusCode >= 500) {
    captureException(error, {
      tags: {
        path: req.path,
        method: req.method,
        errorCode: error.code,
      },
      extra: {
        userId: (req.session as any)?.userId,
        details: error.details,
      },
    });
  }

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Determine if we should show error details in production
  const showDetails = process.env.NODE_ENV !== "production" || error.isOperational;

  // Build response
  const response: any = {
    success: false,
    message: getUserFriendlyMessage(error),
    ...(showDetails && error.code && { code: error.code }),
    ...(showDetails && process.env.NODE_ENV !== "production" && {
      error: error.message,
      stack: error.stack,
      details: error.details,
    }),
  };

  // Add request ID if available
  if ((req as any).requestId) {
    response.requestId = (req as any).requestId;
  }

  res.status(statusCode).json(response);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error creator
 */
export function createValidationError(message: string, details?: any): CustomError {
  return new CustomError(message, 400, "VALIDATION_ERROR", true, details);
}

/**
 * Not found error creator
 */
export function createNotFoundError(resource: string): CustomError {
  return new CustomError(`${resource} not found`, 404, "NOT_FOUND", true);
}

/**
 * Unauthorized error creator
 */
export function createUnauthorizedError(message: string = "Unauthorized"): CustomError {
  return new CustomError(message, 401, "UNAUTHORIZED", true);
}

/**
 * Forbidden error creator
 */
export function createForbiddenError(message: string = "Forbidden"): CustomError {
  return new CustomError(message, 403, "FORBIDDEN", true);
}

