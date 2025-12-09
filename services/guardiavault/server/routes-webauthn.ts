/**
 * WebAuthn and TOTP Authentication Routes
 */

import type { Express, Request, Response } from "express";
import { webauthnService } from "./services/webauthn";
import { totpService } from "./services/totp";
import { storage } from "./storage";
import { logInfo, logError } from "./services/logger";
import type { WebAuthnCredential } from "@shared/schema";

/**
 * Register WebAuthn and TOTP routes
 */
export function registerWebAuthnRoutes(app: Express, requireAuth: any) {
  // ============ WebAuthn Registration ============
  
  /**
   * Start WebAuthn registration
   * POST /api/webauthn/register/start
   */
  app.post("/api/webauthn/register/start", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { deviceName } = req.body;

      const result = await webauthnService.startRegistration(
        userId,
        user.email,
        user.email // Using email as display name
      );

      // Store challenge in session
      req.session!.webauthnChallenge = result.challenge;
      req.session!.webauthnDeviceName = deviceName;

      res.json({ options: result.options });
    } catch (error: any) {
      logError("WebAuthn registration start error", error);
      res.status(500).json({ message: error.message || "Failed to start registration" });
    }
  });

  /**
   * Complete WebAuthn registration
   * POST /api/webauthn/register/complete
   */
  app.post("/api/webauthn/register/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const challenge = req.session!.webauthnChallenge;
      const deviceName = req.session!.webauthnDeviceName;

      if (!challenge) {
        return res.status(400).json({ message: "No registration in progress" });
      }

      const { attestationResponse } = req.body;

      const result = await webauthnService.completeRegistration(
        userId,
        attestationResponse,
        challenge,
        deviceName
      );

      // Clear challenge from session
      delete req.session!.webauthnChallenge;
      delete req.session!.webauthnDeviceName;

      if (!result.success) {
        return res.status(400).json({ message: result.error || "Registration failed" });
      }

      res.json({ success: true, credentialId: result.credentialId });
    } catch (error: any) {
      logError("WebAuthn registration complete error", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  // ============ WebAuthn Authentication ============

  /**
   * Start WebAuthn authentication
   * POST /api/webauthn/authenticate/start
   */
  app.post("/api/webauthn/authenticate/start", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await webauthnService.startAuthentication(userId);

      // Store challenge in session
      req.session!.webauthnAuthChallenge = result.challenge;

      res.json({ options: result.options });
    } catch (error: any) {
      logError("WebAuthn authentication start error", error);
      res.status(500).json({ message: error.message || "Failed to start authentication" });
    }
  });

  /**
   * Complete WebAuthn authentication
   * POST /api/webauthn/authenticate/complete
   */
  app.post("/api/webauthn/authenticate/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const challenge = req.session!.webauthnAuthChallenge;
      if (!challenge) {
        return res.status(400).json({ message: "No authentication in progress" });
      }

      const { assertionResponse } = req.body;

      const result = await webauthnService.completeAuthentication(
        userId,
        assertionResponse,
        challenge
      );

      // Clear challenge from session
      delete req.session!.webauthnAuthChallenge;

      if (!result.success) {
        return res.status(401).json({ message: result.error || "Authentication failed" });
      }

      res.json({ success: true, authenticated: true });
    } catch (error: any) {
      logError("WebAuthn authentication complete error", error);
      res.status(500).json({ message: error.message || "Authentication failed" });
    }
  });

  /**
   * Check if user has WebAuthn credentials
   * GET /api/webauthn/status
   */
  app.get("/api/webauthn/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hasCredentials = await webauthnService.hasCredentials(userId);
      const credentials = hasCredentials ? await webauthnService.getCredentials(userId) : [];

      res.json({
        hasCredentials,
        credentials: credentials.map((c: WebAuthnCredential) => ({
          id: c.id,
          deviceName: c.deviceName,
          deviceType: c.deviceType,
          lastUsedAt: c.lastUsedAt,
          createdAt: c.createdAt,
        })),
      });
    } catch (error: any) {
      logError("WebAuthn status error", error);
      res.status(500).json({ message: error.message || "Failed to get status" });
    }
  });

  /**
   * Delete WebAuthn credential
   * DELETE /api/webauthn/credentials/:credentialId
   */
  app.delete("/api/webauthn/credentials/:credentialId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { credentialId } = req.params;
      const deleted = await webauthnService.deleteCredential(credentialId, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Credential not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      logError("WebAuthn delete credential error", error);
      res.status(500).json({ message: error.message || "Failed to delete credential" });
    }
  });

  // ============ TOTP Routes ============

  /**
   * Setup TOTP for user
   * POST /api/totp/setup
   */
  app.post("/api/totp/setup", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const result = await totpService.setupTotp(userId, user.email);

      res.json(result);
    } catch (error: any) {
      logError("TOTP setup error", error);
      res.status(500).json({ message: error.message || "Failed to setup TOTP" });
    }
  });

  /**
   * Verify and enable TOTP
   * POST /api/totp/enable
   */
  app.post("/api/totp/enable", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const enabled = await totpService.enableTotp(userId, token);

      if (!enabled) {
        return res.status(400).json({ message: "Invalid token" });
      }

      res.json({ success: true, enabled: true });
    } catch (error: any) {
      logError("TOTP enable error", error);
      res.status(500).json({ message: error.message || "Failed to enable TOTP" });
    }
  });

  /**
   * Verify TOTP token
   * POST /api/totp/verify
   */
  app.post("/api/totp/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const result = await totpService.verifyTotp(userId, token);

      if (!result.valid) {
        return res.status(401).json({ message: result.error || "Invalid token" });
      }

      res.json({ success: true, valid: true });
    } catch (error: any) {
      logError("TOTP verify error", error);
      res.status(500).json({ message: error.message || "Verification failed" });
    }
  });

  /**
   * Get TOTP status
   * GET /api/totp/status
   */
  app.get("/api/totp/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const enabled = await totpService.isEnabled(userId);

      res.json({ enabled });
    } catch (error: any) {
      logError("TOTP status error", error);
      res.status(500).json({ message: error.message || "Failed to get status" });
    }
  });

  /**
   * Disable TOTP
   * POST /api/totp/disable
   */
  app.post("/api/totp/disable", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const disabled = await totpService.disableTotp(userId);

      if (!disabled) {
        return res.status(404).json({ message: "TOTP not found" });
      }

      res.json({ success: true, disabled: true });
    } catch (error: any) {
      logError("TOTP disable error", error);
      res.status(500).json({ message: error.message || "Failed to disable TOTP" });
    }
  });

  // ============ Biometric Authentication Alias Routes ============
  // These routes provide a simplified API for biometric authentication using WebAuthn

  /**
   * Get biometric authentication status
   * GET /api/auth/biometric/status
   */
  app.get("/api/auth/biometric/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hasCredentials = await webauthnService.hasCredentials(userId);
      
      res.json({ 
        enabled: hasCredentials,
        hasCredentials 
      });
    } catch (error: any) {
      logError("Biometric status error", error);
      res.status(500).json({ message: error.message || "Failed to get biometric status" });
    }
  });

  /**
   * Start biometric registration - generate challenge
   * POST /api/auth/biometric/register-challenge
   */
  app.post("/api/auth/biometric/register-challenge", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const result = await webauthnService.startRegistration(
        userId,
        user.email,
        user.email
      );

      // Store challenge in session
      req.session!.webauthnChallenge = result.challenge;
      req.session!.webauthnDeviceName = req.body.deviceName || "Biometric Device";

      // Return challenge in the format expected by frontend
      res.json({
        challenge: result.challenge,
        userId: userId,
        options: result.options
      });
    } catch (error: any) {
      logError("Biometric registration challenge error", error);
      res.status(500).json({ message: error.message || "Failed to generate challenge" });
    }
  });

  /**
   * Complete biometric registration
   * POST /api/auth/biometric/register
   */
  app.post("/api/auth/biometric/register", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const challenge = req.session!.webauthnChallenge;
      const deviceName = req.session!.webauthnDeviceName || "Biometric Device";

      if (!challenge) {
        return res.status(400).json({ message: "No registration in progress" });
      }

      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ message: "Credential required" });
      }

      const result = await webauthnService.completeRegistration(
        userId,
        credential,
        challenge,
        deviceName
      );

      // Clear challenge from session
      delete req.session!.webauthnChallenge;
      delete req.session!.webauthnDeviceName;

      if (!result.success) {
        return res.status(400).json({ message: result.error || "Registration failed" });
      }

      logInfo("Biometric authentication enabled", { userId });

      res.json({ 
        success: true, 
        credentialId: result.credentialId,
        enabled: true
      });
    } catch (error: any) {
      logError("Biometric registration error", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  /**
   * Disable biometric authentication
   * POST /api/auth/biometric/disable
   */
  app.post("/api/auth/biometric/disable", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get all credentials for this user and delete them
      const credentials = await webauthnService.getCredentials(userId);
      
      if (credentials.length === 0) {
        return res.status(404).json({ message: "No biometric credentials found" });
      }

      // Delete all credentials
      let deletedCount = 0;
      for (const credential of credentials) {
        const deleted = await webauthnService.deleteCredential(credential.credentialId, userId);
        if (deleted) deletedCount++;
      }

      logInfo("Biometric authentication disabled", { userId, deletedCount });

      res.json({ 
        success: true, 
        disabled: true,
        deletedCount 
      });
    } catch (error: any) {
      logError("Biometric disable error", error);
      res.status(500).json({ message: error.message || "Failed to disable biometric authentication" });
    }
  });

  /**
   * Start biometric authentication for check-ins
   * POST /api/auth/biometric/authenticate-challenge
   */
  app.post("/api/auth/biometric/authenticate-challenge", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await webauthnService.startAuthentication(userId);

      // Store challenge in session
      req.session!.webauthnAuthChallenge = result.challenge;

      res.json({ 
        challenge: result.challenge,
        options: result.options 
      });
    } catch (error: any) {
      logError("Biometric authentication challenge error", error);
      res.status(500).json({ message: error.message || "Failed to generate authentication challenge" });
    }
  });

  /**
   * Complete biometric authentication for check-ins
   * POST /api/auth/biometric/authenticate
   */
  app.post("/api/auth/biometric/authenticate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const challenge = req.session!.webauthnAuthChallenge;
      if (!challenge) {
        return res.status(400).json({ message: "No authentication in progress" });
      }

      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ message: "Credential required" });
      }

      const result = await webauthnService.completeAuthentication(
        userId,
        credential,
        challenge
      );

      // Clear challenge from session
      delete req.session!.webauthnAuthChallenge;

      if (!result.success) {
        return res.status(401).json({ message: result.error || "Authentication failed" });
      }

      logInfo("Biometric authentication successful", { userId });

      res.json({ 
        success: true, 
        authenticated: true,
        verified: true
      });
    } catch (error: any) {
      logError("Biometric authentication error", error);
      res.status(500).json({ message: error.message || "Authentication failed" });
    }
  });
}

