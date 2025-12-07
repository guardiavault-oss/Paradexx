/**
 * Check-in API Routes
 * Extends main routes with check-in endpoints including biometric verification
 */

import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { validateBody } from "./middleware/validation";
import { biometricCheckInService } from "./services/biometricCheckIn";
import { type InteractionSignature } from "./services/behavioralBiometrics";
import { logInfo, logError } from "./services/logger";

/**
 * Register check-in routes
 */
export function registerCheckInRoutes(app: Express, requireAuth: any) {
  /**
   * POST /api/vaults/:vaultId/checkin
   * Perform vault check-in with optional biometric verification
   */
  app.post(
    "/api/vaults/:vaultId/checkin",
    requireAuth,
    validateBody(
      z.object({
        message: z.string().optional(), // Optional check-in message
        signature: z.string(), // Blockchain signature
        biometricData: z
          .object({
            typingPattern: z
              .object({
                keystrokeDynamics: z.array(
                  z.object({
                    key: z.string(),
                    keyDown: z.number(),
                    keyUp: z.number(),
                    dwellTime: z.number(),
                    flightTime: z.number(),
                  })
                ),
              })
              .optional(),
            mouseMovement: z
              .object({
                movements: z.array(
                  z.object({
                    x: z.number(),
                    y: z.number(),
                    timestamp: z.number(),
                    velocity: z.number(),
                    acceleration: z.number(),
                  })
                ),
              })
              .optional(),
          })
          .optional(), // Biometric data is optional
        requireBiometric: z.boolean().optional().default(false),
      })
    ),
    async (req, res) => {
      try {
        const userId = req.session!.userId;
        const { vaultId } = req.params;
        const {
          message,
          signature,
          biometricData,
          requireBiometric = false,
        } = req.body;

        // Verify vault belongs to user
        const vault = await storage.getVault(vaultId);
        if (!vault || vault.ownerId !== userId) {
          return res.status(404).json({ message: "Vault not found" });
        }

        // Perform biometric verification if data provided
        let biometricResult = null;
        if (biometricData) {
          biometricResult = await biometricCheckInService.verifyCheckIn({
            userId,
            vaultId,
            biometricData: biometricData as InteractionSignature,
            requireBiometric,
          });

          // If biometric required and verification failed, block check-in
          if (requireBiometric && !biometricResult.canProceed) {
            return res.status(403).json({
              message: "Biometric verification failed",
              requiresManualVerification: biometricResult.requiresManualVerification,
              confidence: biometricResult.confidence,
              details: biometricResult.details,
            });
          }
        }

        // Create check-in record
        const checkIn = await storage.createCheckIn({
          vaultId,
          signature,
          ipAddress: req.ip || req.headers["x-forwarded-for"] as string || undefined,
        });

        // In production, also call smart contract checkIn function
        // const { smartContractService } = await import("./services/smartContract");
        // await smartContractService.performCheckIn(vaultId, signature);

        logInfo("Check-in performed", {
          userId,
          vaultId,
          checkInId: checkIn.id,
          biometricVerified: biometricResult?.verified || false,
          biometricConfidence: biometricResult?.confidence || null,
        });

        res.json({
          success: true,
          checkIn: {
            id: checkIn.id,
            timestamp: checkIn.checkedInAt,
            method: "Blockchain",
            status: "success",
          },
          biometric: biometricResult
            ? {
                verified: biometricResult.verified,
                confidence: biometricResult.confidence,
                details: biometricResult.details,
              }
            : null,
        });
      } catch (error: any) {
        logError(error as Error, {
          context: "check-in",
          vaultId: req.params.vaultId,
        });
        res.status(500).json({
          message: error.message || "Failed to perform check-in",
        });
      }
    }
  );

  /**
   * GET /api/vaults/:vaultId/checkins
   * Get check-in history for a vault
   */
  app.get("/api/vaults/:vaultId/checkins", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { vaultId } = req.params;

      // Verify vault belongs to user
      const vault = await storage.getVault(vaultId);
      if (!vault || vault.ownerId !== userId) {
        return res.status(404).json({ message: "Vault not found" });
      }

      const checkIns = await storage.getCheckInsByVault(vaultId);

      res.json({
        checkIns: checkIns.map((ci) => ({
          id: ci.id,
          timestamp: ci.checkedInAt,
          method: "Blockchain",
          status: "success",
          signature: ci.signature,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/vaults/:vaultId/biometric-status
   * Check if user has biometric baseline configured
   */
  app.get(
    "/api/vaults/:vaultId/biometric-status",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session!.userId;
        const { vaultId } = req.params;

        // Verify vault belongs to user
        const vault = await storage.getVault(vaultId);
        if (!vault || vault.ownerId !== userId) {
          return res.status(404).json({ message: "Vault not found" });
        }

        const hasBaseline = await biometricCheckInService.hasBiometricBaseline(
          userId
        );

        res.json({
          hasBiometricBaseline: hasBaseline,
          biometricEnabled: hasBaseline, // Can be configured per vault
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );
}

