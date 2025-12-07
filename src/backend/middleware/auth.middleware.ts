// Authentication Middleware - JWT verification

import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

// Dev mode flag
const DEV_MODE = process.env.NODE_ENV === 'development';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

// Authenticate JWT token
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Dev mode: skip database session check
    if (DEV_MODE) {
      req.userId = decoded.userId;
      return next();
    }

    // Production: Check if session exists in database
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Session expired' });
    }

    // Attach userId to request
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // Token is invalid, but we don't fail the request
    next();
  }
}

// Rate limiting per user
export function rateLimitPerUser(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return next(); // Skip if not authenticated
    }

    const now = Date.now();
    const userLimit = requests.get(req.userId);

    // Check if window has expired
    if (userLimit && userLimit.resetAt < now) {
      requests.delete(req.userId);
    }

    // Initialize or increment counter
    if (!requests.has(req.userId)) {
      requests.set(req.userId, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    const limit = requests.get(req.userId)!;

    if (limit.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetAt - now) / 1000),
      });
    }

    limit.count++;
    next();
  };
}

// Require biometric verification (check header)
export async function requireBiometric(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has biometric enabled
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { biometricEnabled: true },
    });

    if (!user?.biometricEnabled) {
      return next(); // Skip if biometric not enabled
    }

    // Check for biometric verification header
    const biometricVerified = req.headers['x-biometric-verified'];

    if (biometricVerified !== 'true') {
      return res.status(403).json({
        error: 'Biometric verification required',
        requiresBiometric: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Biometric check error:', error);
    return res.status(500).json({ error: 'Biometric check failed' });
  }
}

// Admin only
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    // In production, add isAdmin field to User model
    // if (!user?.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    return res.status(500).json({ error: 'Admin check failed' });
  }
}
