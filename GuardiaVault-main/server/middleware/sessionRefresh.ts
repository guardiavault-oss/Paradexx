/**
 * Session Refresh Middleware
 * Extends session expiry for active users to prevent unexpected logouts
 */

import type { Request, Response, NextFunction } from "express";
import { logInfo } from "../services/logger";

/**
 * Middleware to refresh session for authenticated users
 * Extends session maxAge on each request to keep users logged in
 */
export function refreshSession(req: Request, res: Response, next: NextFunction) {
  // Only refresh if user is authenticated and session exists
  if (req.session && req.session.userId) {
    // Touch the session to extend its expiry
    req.session.touch();

    // Log refresh (only occasionally to avoid log spam)
    if (Math.random() < 0.01) { // 1% of requests
      logInfo("Session refreshed", {
        userId: req.session.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  next();
}

/**
 * Check if session is about to expire and warn user
 */
export function checkSessionExpiry(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.cookie) {
    const expiresAt = req.session.cookie.expires;
    if (expiresAt) {
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      const oneHour = 60 * 60 * 1000;

      // If session expires in less than 1 hour, add warning header
      if (timeUntilExpiry < oneHour && timeUntilExpiry > 0) {
        res.setHeader("X-Session-Warning", "expires-soon");
        res.setHeader("X-Session-Expires-In", Math.floor(timeUntilExpiry / 1000).toString());
      }
    }
  }

  next();
}

