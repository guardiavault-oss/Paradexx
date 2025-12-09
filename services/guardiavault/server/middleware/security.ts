/**
 * Enhanced Security Middleware
 * Provides production-ready security features
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logWarn } from '../services/logger';

/**
 * Strict CORS configuration for production
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = req.headers.origin;

  // In development, allow all origins
  if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // In production, only allow configured origins
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else if (origin) {
      logWarn(`CORS blocked request from: ${origin}`);
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

/**
 * Rate limiting for API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logWarn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      message: 'Too many requests, please try again later.',
    });
  },
});

/**
 * Stricter rate limiting for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logWarn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60, // seconds
    });
  },
});

/**
 * IP whitelist middleware (for admin endpoints)
 */
export function ipWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress || '';

    if (!allowedIPs.includes(clientIP) && process.env.NODE_ENV === 'production') {
      logWarn(`IP whitelist blocked: ${clientIP}`);
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

/**
 * Request size limiting
 */
export function requestSizeLimit(maxSize: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      logWarn(`Request too large: ${contentLength} bytes (max: ${maxBytes})`);
      return res.status(413).json({
        message: 'Request entity too large',
        maxSize,
      });
    }

    next();
  };
}

function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+)([a-z]+)$/);
  if (!match) return 1024 * 1024; // Default 1MB

  const [, value, unit] = match;
  return parseInt(value, 10) * (units[unit] || 1);
}

/**
 * Security headers middleware (complements Helmet)
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS (HTTPS Strict Transport Security) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

