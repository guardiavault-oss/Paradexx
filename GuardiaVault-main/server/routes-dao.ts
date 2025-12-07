/**
 * DAO Verification API Routes
 */

import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { validateBody } from "./middleware/validation";
import { logInfo, logError, auditLog } from "./services/logger";
import { daoVerificationService } from "./services/daoService";

/**
 * Register DAO verification routes
 */
export function registerDAORoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/dao/claims
   * List active claims
   */
  app.get("/api/dao/claims", async (req, res) => {
    try {
      // In production, fetch from DAOVerification contract
      res.json({ claims: [], myClaims: [] });
    } catch (error: any) {
      logError(error as Error, { context: "dao-claims-list" });
      res.status(500).json({ message: error.message || "Failed to fetch claims" });
    }
  });

  /**
   * POST /api/dao/claims
   * Create a claim
   */
  app.post(
    "/api/dao/claims",
    requireAuth,
    validateBody(
      z.object({
        vaultId: z.number(),
        reason: z.string().min(10),
      })
    ),
    async (req, res) => {
      try {
        const userId = req.session!.userId;
        const { vaultId, reason } = req.body;

        // 1. Verify user is beneficiary of vault
        const vault = await storage.getVault(vaultId.toString());
        if (!vault) {
          return res.status(404).json({ message: "Vault not found" });
        }

        // 1. Get user and check if they're a beneficiary
        const user = await storage.getUser(userId as string);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const parties = await storage.getPartiesByVault(vaultId.toString());
        const isBeneficiary = parties.some(
          (p) => p.email === user.email && p.role === "beneficiary"
        );

        if (!isBeneficiary) {
          return res.status(403).json({ message: "Only beneficiaries can create claims" });
        }

        // 2. Get user's wallet address
        if (!user.walletAddress) {
          return res.status(400).json({ message: "Wallet address required" });
        }

        // 3. In production, contract interaction happens on frontend
        // Backend stores claim metadata after creation

        logInfo("DAO claim created", { userId, vaultId, reason, claimant: user.walletAddress });

        res.json({
          success: true,
          message: "Claim creation initiated",
          vaultId,
          // Frontend will create contract claim and return claimId
        });
      } catch (error: any) {
        logError(error as Error, { context: "dao-claim-create" });
        res.status(500).json({ message: error.message || "Failed to create claim" });
      }
    }
  );

  /**
   * POST /api/dao/claims/:id/vote
   * Vote on a claim
   */
  app.post(
    "/api/dao/claims/:id/vote",
    requireAuth,
    validateBody(
      z.object({
        approved: z.boolean(),
      })
    ),
    async (req, res) => {
      try {
        const userId = req.session!.userId;
        const { id } = req.params;
        const { approved } = req.body;

        // In production:
        // 1. Verify user is registered verifier
        // 2. Call DAOVerification.vote()
        // 3. Update reputation if claim resolves

        logInfo("DAO vote cast", { userId, claimId: id, approved });

        res.json({ success: true });
      } catch (error: any) {
        logError(error as Error, { context: "dao-vote" });
        res.status(500).json({ message: error.message || "Failed to vote" });
      }
    }
  );

  /**
   * GET /api/dao/verifier/:address
   * Get verifier stats and metadata
   */
  app.get("/api/dao/verifier/:address", async (req, res) => {
    try {
      const { address } = req.params;

      // Fetch contract stats
      const stats = await daoVerificationService.getVerifierStats(address);
      
      // Fetch database metadata
      const verifierMetadata = await storage.getDaoVerifierByAddress(address);

      res.json({
        isActive: stats.isActive,
        stake: stats.stake,
        reputation: stats.reputation,
        totalVotes: stats.totalVotes,
        correctVotes: stats.correctVotes,
        accuracy: stats.totalVotes > 0 ? (stats.correctVotes / stats.totalVotes) * 100 : 0,
        // Include metadata if available
        ...(verifierMetadata && {
          address: verifierMetadata.verifierAddress,
          registeredAt: verifierMetadata.registeredAt,
          status: verifierMetadata.status,
          stakeAmount: verifierMetadata.stakeAmount,
        }),
      });
    } catch (error: any) {
      logError(error as Error, { context: "dao-verifier-stats" });
      res.status(500).json({ message: error.message || "Failed to fetch verifier stats" });
    }
  });

  /**
   * POST /api/dao/verifier/register
   * Register as verifier
   */
  app.post(
    "/api/dao/verifier/register",
    requireAuth,
    validateBody(
      z.object({
        stakeAmount: z.string(),
      })
    ),
    async (req, res) => {
      try {
        const userId = req.session!.userId;
        const { stakeAmount } = req.body;

        // Get user's wallet address
        const user = await storage.getUser(userId as string);
        if (!user?.walletAddress) {
          return res.status(400).json({ message: "Wallet address required. Please connect your wallet first." });
        }

        const verifierAddress = user.walletAddress as string;

        // Check if already registered
        const existing = await storage.getDaoVerifierByAddress(verifierAddress);
        if (existing && existing.status === "active") {
          return res.status(400).json({ message: "Already registered as verifier" });
        }

        // In production: Call DAOVerification.registerVerifier() on frontend
        // For now, we store the metadata after the frontend completes the transaction

        // Store verifier metadata in database
        const verifier = await storage.createDaoVerifier({
          userId: userId as string,
          verifierAddress: verifierAddress as string,
          stakeAmount: stakeAmount as string,
          status: "active",
        });

        // Add audit log
        auditLog("dao_verifier_registered", userId, {
          verifierAddress,
          stakeAmount,
          verifierId: verifier.id,
        });

        logInfo("Verifier registered", { userId, verifierAddress, stakeAmount, verifierId: verifier.id });

        res.json({
          success: true,
          verifier: {
            id: verifier.id,
            address: verifier.verifierAddress,
            registeredAt: verifier.registeredAt,
            status: verifier.status,
            stakeAmount: verifier.stakeAmount,
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "dao-verifier-register" });
        res.status(500).json({ message: error.message || "Failed to register as verifier" });
      }
    }
  );

  /**
   * POST /api/dao/verifier/deregister
   * Deregister as verifier
   */
  app.post(
    "/api/dao/verifier/deregister",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session!.userId;

        // Get user's wallet address
        const user = await storage.getUser(userId as string);
        if (!user?.walletAddress) {
          return res.status(400).json({ message: "Wallet address required" });
        }

        // Find verifier record
        const verifier = await storage.getDaoVerifierByAddress(user.walletAddress);
        if (!verifier || verifier.status !== "active") {
          return res.status(404).json({ message: "Verifier not found or already deregistered" });
        }

        // In production: Call DAOVerification.unstake() on frontend
        // For now, we just update the status

        // Update verifier status
        const updated = await storage.updateDaoVerifier(verifier.id, {
          status: "inactive",
          deregisteredAt: new Date(),
        });

        // Add audit log
        auditLog("dao_verifier_deregistered", userId, {
          verifierAddress: verifier.verifierAddress,
          verifierId: verifier.id,
        });

        logInfo("Verifier deregistered", { userId, verifierAddress: verifier.verifierAddress });

        res.json({
          success: true,
          message: "Verifier deregistered successfully",
        });
      } catch (error: any) {
        logError(error as Error, { context: "dao-verifier-deregister" });
        res.status(500).json({ message: error.message || "Failed to deregister as verifier" });
      }
    }
  );
}

