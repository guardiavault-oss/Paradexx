/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { logWarn } from "../services/logger";

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Middleware to add CSRF token to response
 * Sets token in cookie and provides it in response header
 */
export function csrfToken(req: Request, res: Response, next: NextFunction) {
  // For GET requests, just generate and set token
  if (req.method === "GET") {
    const token = generateCSRFToken();
    res.cookie("XSRF-TOKEN", token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    res.setHeader("X-CSRF-Token", token);
  }
  next();
}

/**
 * Middleware to validate CSRF token
 * Required for state-changing operations (POST, PUT, PATCH, DELETE)
 */
export function validateCSRF(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Get the path from various sources (req.path might not include mount point)
  const path = req.path || req.url?.split("?")[0] || "";
  const originalPath = req.originalUrl?.split("?")[0] || path;

  // Skip for auth endpoints (they use session-based auth)
  // Check both path and originalUrl to handle different Express configurations
  if (path.startsWith("/api/auth/") || originalPath.startsWith("/api/auth/")) {
    return next();
  }

  // Skip for WebAuthn (uses challenge-response)
  if (path.startsWith("/api/webauthn/") || originalPath.startsWith("/api/webauthn/")) {
    return next();
  }

  // Skip for dev debug routes in development mode
  if (process.env.NODE_ENV === "development" && 
      (path.startsWith("/api/dev/") || originalPath.startsWith("/api/dev/"))) {
    logWarn("CSRF validation skipped for dev route", {
      path,
      originalPath,
      method: req.method,
      nodeEnv: process.env.NODE_ENV,
    });
    return next();
  }

  // Get token from header or body
  const tokenFromHeader = req.headers["x-csrf-token"] as string;
  const tokenFromCookie = req.cookies?.["XSRF-TOKEN"];

  // Validate token matches
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    logWarn("CSRF token validation failed", {
      path: req.path,
      method: req.method,
      hasHeaderToken: !!tokenFromHeader,
      hasCookieToken: !!tokenFromCookie,
    });

    return res.status(403).json({
      message: "CSRF token validation failed",
      code: "CSRF_TOKEN_INVALID",
    });
  }

  next();
}

