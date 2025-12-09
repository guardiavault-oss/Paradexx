/**
 * Custom Biometric OAuth Authentication Routes
 * Handles biometric-based authentication instead of third-party OAuth
 */

import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { logInfo, logError } from "./services/logger";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { webauthnService } from "./services/webauthn";

/**
 * Register custom biometric OAuth authentication routes
 */
export function registerOAuthRoutes(app: Express) {
  /**
   * Initiate biometric OAuth authentication
   * POST /api/auth/oauth/biometric/init
   *
   * This replaces Google OAuth with our own biometric authentication flow
   */
  app.post("/api/auth/oauth/biometric/init", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }

      // Check if user has WebAuthn credentials
      const credentials = await webauthnService.getCredentialsForUser(user.id);
      if (credentials.length === 0) {
        return res.status(400).json({
          message: "Biometric authentication not set up. Please configure biometrics in your settings first."
        });
      }

      // Generate challenge for biometric authentication
      const challenge = randomUUID();

      // Store challenge in session
      req.session!.biometricChallenge = challenge;
      req.session!.biometricUserId = user.id;

      // Get authentication options
      const options = await webauthnService.startAuthentication(user.id);

      logInfo("Biometric OAuth initiated", {
        context: "biometric_oauth",
        userId: user.id,
        email: normalizedEmail,
        challenge: challenge.substring(0, 8) + "..."
      });

      res.json({
        success: true,
        options: options,
        challenge: challenge
      });
    } catch (error: any) {
      logError("Biometric OAuth initiation error", error);
      res.status(500).json({ message: error.message || "Failed to initiate biometric authentication" });
    }
  });

  /**
   * Complete biometric OAuth authentication
   * POST /api/auth/oauth/biometric/complete
   */
  app.post("/api/auth/oauth/biometric/complete", async (req: Request, res: Response) => {
    try {
      const { assertionResponse } = req.body;

      if (!assertionResponse) {
        return res.status(400).json({ message: "Assertion response is required" });
      }

      // Get challenge and user from session
      const challenge = req.session!.biometricChallenge;
      const userId = req.session!.biometricUserId;

      if (!challenge || !userId) {
        return res.status(400).json({ message: "No authentication session found" });
      }

      // Verify the biometric assertion
      const result = await webauthnService.verifyAuthentication(
        userId,
        assertionResponse,
        challenge
      );

      if (!result.success) {
        return res.status(400).json({ message: result.error || "Biometric authentication failed" });
      }

      // Clear session data
      delete req.session!.biometricChallenge;
      delete req.session!.biometricUserId;

      // Set user session
      req.session!.userId = userId;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      logInfo("Biometric OAuth completed successfully", {
        context: "biometric_oauth",
        userId: userId,
        email: user.email
      });

      res.json({
        success: true,
        message: "Biometric authentication successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error: any) {
      logError("Biometric OAuth completion error", error);
      res.status(500).json({ message: error.message || "Biometric authentication failed" });
    }
  });

  /**
   * Check biometric availability for a user
   * GET /api/auth/oauth/biometric/status
   */
  app.get("/api/auth/oauth/biometric/status", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await storage.getUserByEmail(normalizedEmail);

      if (!user) {
        return res.json({
          available: false,
          message: "User not found"
        });
      }

      const credentials = await webauthnService.getCredentialsForUser(user.id);

      res.json({
        available: credentials.length > 0,
        credentialCount: credentials.length,
        userExists: true
      });
    } catch (error: any) {
      logError("Biometric status check error", error);
      res.status(500).json({ message: "Failed to check biometric status" });
    }
  });
}

