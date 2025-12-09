/**
 * Authentication Routes
 * Handles login, logout, and password reset
 */

import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { logInfo, logError, logDebug } from "./services/logger";
import { sendEmail } from "./services/email";
import { validateBody } from "./middleware/validation";

// Extend global interface for reset tokens
declare global {
  var resetTokens: Map<string, {
    userId: string;
    email: string;
    expires: Date;
  }> | undefined;
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    // Log session state for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      logDebug("Auth check failed", {
        context: "requireAuth",
        hasSession: !!req.session,
        sessionId: req.sessionID,
        hasCookies: !!req.headers.cookie,
        cookies: req.headers.cookie?.substring(0, 100),
      });
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/**
 * Register all authentication routes
 */
export function registerAuthRoutes(app: Express): void {
  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", validateBody(z.object({ email: z.string().email() })), async (req, res) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ message: "If an account with this email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const resetToken = randomUUID();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

      // Store reset token (in production, you'd store this in database)
      // For now, we'll store it in a simple in-memory map (not production ready)
      if (!global.resetTokens) {
        global.resetTokens = new Map();
      }
      global.resetTokens.set(resetToken, {
        userId: user.id,
        email: normalizedEmail,
        expires: resetExpires
      });

      // Send reset email
      const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password/${resetToken}`;

      try {
        await sendEmail(
          normalizedEmail,
          "Password Reset - GuardiaVault",
          `Hello,

You requested a password reset for your GuardiaVault account.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
GuardiaVault Security Team`,
          `Hello,

You requested a password reset for your GuardiaVault account.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
GuardiaVault Security Team`
        );
      } catch (emailError) {
        logError("Failed to send reset email", emailError);
        // Don't expose email sending failures for security
      }

      logInfo("Password reset requested", {
        context: "forgot_password",
        email: normalizedEmail,
        userId: user.id.toString()
      });

      res.json({ message: "If an account with this email exists, a password reset link has been sent." });
    } catch (error: unknown) {
      const err = error as Error;
      logError(err, {
        context: "forgot_password",
        email: req.body.email
      });
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", validateBody(z.object({
    token: z.string(),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
  })), async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Check if token exists and is valid
      if (!global.resetTokens || !global.resetTokens.has(token)) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const tokenData = global.resetTokens.get(token);
      if (!tokenData) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token expired
      if (new Date() > tokenData.expires) {
        global.resetTokens.delete(token);
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

      // Update user password
      await storage.updateUser(tokenData.userId, { password: hashedPassword });

      // Clean up token
      global.resetTokens.delete(token);

      logInfo("Password reset completed", {
        context: "reset_password",
        userId: tokenData.userId,
        email: tokenData.email
      });

      res.json({ message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error: unknown) {
      const err = error as Error;
      logError(err, {
        context: "reset_password",
        token: req.body.token
      });
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // GET /api/auth/verify-reset-token
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, message: "Token is required" });
      }

      if (!global.resetTokens || !global.resetTokens.has(token)) {
        return res.json({ valid: false, message: "Invalid reset token" });
      }

      const tokenData = global.resetTokens.get(token);
      if (!tokenData) {
        return res.json({ valid: false, message: "Invalid reset token" });
      }

      // Check if token expired
      if (new Date() > tokenData.expires) {
        global.resetTokens.delete(token);
        return res.json({ valid: false, message: "Reset token has expired" });
      }

      res.json({ valid: true, email: tokenData.email });
    } catch (error: unknown) {
      const err = error as Error;
      logError(err, {
        context: "verify_reset_token",
        token: req.query.token
      });
      res.status(500).json({ valid: false, message: "Failed to verify token" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Find user
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password.trim(), user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session!.userId = user.id;

      logInfo("Login successful", {
        context: "login",
        userId: user.id,
        email: normalizedEmail,
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: unknown) {
      const err = error as Error;
      logError(err, {
        context: "login",
        email: req.body?.email,
      });
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // GET /api/auth/me
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - no user ID in session" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: unknown) {
      const err = error as Error;
      logError(err, {
        context: "auth/me",
        sessionId: req.sessionID,
        userId: req.session?.userId,
      });
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
