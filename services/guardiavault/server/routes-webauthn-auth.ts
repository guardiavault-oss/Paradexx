/**
 * Public WebAuthn Authentication Routes for Login
 * These endpoints don't require authentication (for login flow)
 */

import type { Express, Request, Response } from "express";
import { webauthnService } from "./services/webauthn";
import { storage } from "./storage";
import { logInfo, logError } from "./services/logger";

/**
 * Register public WebAuthn authentication routes (for login)
 */
export function registerWebAuthnAuthRoutes(app: Express) {
  /**
   * Start WebAuthn authentication for login (public endpoint)
   * POST /api/auth/webauthn/login/start
   */
  app.post("/api/auth/webauthn/login/start", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      // Normalize email to lowercase and trim whitespace (case-insensitive lookup)
      const normalizedEmail = email.toLowerCase().trim();

      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        // Don't reveal if user exists - security best practice
        return res.status(200).json({ 
          options: null,
          hasCredentials: false 
        });
      }

      // Check if user has WebAuthn credentials
      const credentials = await storage.getWebAuthnCredentialsByUserId(user.id);
      if (credentials.length === 0) {
        return res.status(200).json({ 
          options: null,
          hasCredentials: false 
        });
      }

      const result = await webauthnService.startAuthentication(user.id);

      // Store challenge in session with user ID for verification
      req.session!.webauthnLoginChallenge = result.challenge;
      req.session!.webauthnLoginUserId = user.id;

      res.json({ 
        options: result.options,
        hasCredentials: true 
      });
    } catch (error: any) {
      logError("WebAuthn login start error", error);
      res.status(500).json({ message: error.message || "Failed to start authentication" });
    }
  });

  /**
   * Complete WebAuthn authentication for login (public endpoint)
   * POST /api/auth/webauthn/login/complete
   */
  app.post("/api/auth/webauthn/login/complete", async (req: Request, res: Response) => {
    try {
      const challenge = req.session!.webauthnLoginChallenge;
      const userId = req.session!.webauthnLoginUserId;

      if (!challenge || !userId) {
        return res.status(400).json({ message: "No authentication in progress" });
      }

      const { assertionResponse } = req.body;

      if (!assertionResponse) {
        return res.status(400).json({ message: "Assertion response required" });
      }

      const result = await webauthnService.completeAuthentication(
        userId,
        assertionResponse,
        challenge
      );

      // Clear challenge from session
      delete req.session!.webauthnLoginChallenge;
      delete req.session!.webauthnLoginUserId;

      if (!result.success) {
        return res.status(401).json({ message: result.error || "Authentication failed" });
      }

      // Get user and set session
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Set session
      req.session!.userId = user.id;
      req.session!.email = user.email;

      // Update last login
      await storage.updateUser(userId, {
        lastLoginAt: new Date(),
      });

      logInfo("WebAuthn login successful", { userId, email: user.email });

      res.json({ 
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress,
        }
      });
    } catch (error: any) {
      logError("WebAuthn login complete error", error);
      res.status(500).json({ message: error.message || "Authentication failed" });
    }
  });

  /**
   * Check if user has WebAuthn credentials (public endpoint)
   * POST /api/auth/webauthn/login/check
   */
  app.post("/api/auth/webauthn/login/check", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      // Normalize email to lowercase and trim whitespace (case-insensitive lookup)
      const normalizedEmail = email.toLowerCase().trim();

      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        // Don't reveal if user exists
        return res.json({ hasCredentials: false });
      }

      const credentials = await storage.getWebAuthnCredentialsByUserId(user.id);
      return res.json({ 
        hasCredentials: credentials.length > 0,
        credentialCount: credentials.length 
      });
    } catch (error: any) {
      logError("WebAuthn check error", error);
      res.status(500).json({ message: error.message || "Check failed" });
    }
  });
}

