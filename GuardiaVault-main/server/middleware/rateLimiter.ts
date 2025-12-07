/**
 * Enhanced Rate Limiting Middleware
 * Production-ready rate limiting with different limits for different endpoints
 */

import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { logInfo } from "../services/logger";

/**
 * Create rate limiter with custom options
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: options.keyGenerator || ((req: Request) => {
      // Use IP address or user ID
      return (req.session as any)?.userId || req.ip || "unknown";
    }),
    handler: (req: Request, res: Response) => {
      logInfo("Rate limit exceeded", {
        path: req.path,
        ip: req.ip,
        userId: (req.session as any)?.userId,
      });

      res.status(429).json({
        success: false,
        message: options.message || "Too many requests, please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
}

/**
 * General API rate limiter (100 requests per 15 minutes)
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many API requests. Please try again later.",
});

/**
 * Strict rate limiter for auth endpoints (10 requests per 15 minutes)
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again later.",
  skipSuccessfulRequests: true,
});

/**
 * OG Image rate limiter (50 requests per hour)
 */
export const ogImageLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: "Too many image generation requests. Please try again later.",
});

/**
 * Admin endpoint rate limiter (higher limit for admin users)
 */
export const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Admin rate limit exceeded.",
});

