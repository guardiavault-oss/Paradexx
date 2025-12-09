/**
 * Comprehensive Validation Middleware
 * Input validation, sanitization, and type checking
 */

import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { createValidationError } from "./errorHandler";
import { logError } from "../services/logger";

/**
 * Validate request body against Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        const validationError = createValidationError(
          "Validation failed",
          details
        );
        return next(validationError);
      }
      next(error);
    }
  };
}

/**
 * Validate request query parameters
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        const validationError = createValidationError(
          "Invalid query parameters",
          details
        );
        return next(validationError);
      }
      next(error);
    }
  };
}

/**
 * Validate request params
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        const validationError = createValidationError(
          "Invalid route parameters",
          details
        );
        return next(validationError);
      }
      next(error);
    }
  };
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove HTML brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Sanitize request body
 */
export function sanitizeRequestBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate numeric string (for wei amounts)
 */
export function isValidNumericString(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  ethereumAddress: z.string().refine(isValidEthereumAddress, {
    message: "Invalid Ethereum address format",
  }),
  email: z.string().email("Invalid email format"),
  numericString: z.string().refine(isValidNumericString, {
    message: "Must be a valid numeric string",
  }),
  positiveNumber: z.number().positive("Must be a positive number"),
  nonEmptyString: z.string().min(1, "Cannot be empty"),
  uuid: z.string().uuid("Invalid UUID format"),
};
