/**
 * Yield Vault API Routes
 */

import type { Express } from "express";
import { z } from "zod";
import { ethers } from "ethers";
import { storage } from "./storage";
import { validateBody } from "./middleware/validation";
import { logInfo, logError } from "./services/logger";
import { yieldCalculationService } from "./services/yieldCalculation";
import { getYieldVaultContract } from "../client/src/lib/contracts/yieldVault";

/**
 * Register yield vault routes
 */
export function registerYieldVaultRoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/yield-vaults
   * List user's yield vaults
   */
  app.get("/api/yield-vaults", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      
      // In production, fetch from database
      // For now, return empty array as placeholder
      res.json({ vaults: [] });
    } catch (error: any) {
      logError(error as Error, { context: "yield-vaults-list" });
      res.status(500).json({ message: error.message || "Failed to fetch yield vaults" });
    }
  });

  /**
   * POST /api/yield-vaults
   * Create new yield vault
   */
  app.post(
    "/api/yield-vaults",
    requireAuth,
    validateBody(
      z.object({
        guardiaVaultId: z.number(),
        asset: z.string(),
        amount: z.string(),
        stakingProtocol: z.enum(["aave", "compound", "uniswap", "curve", "balancer", "rocketpool", "lido", "frax"]),
      })
    ),
    async (req, res) => {
      try {
        const userId = req.session!.userId;
        const { guardiaVaultId, asset, amount, stakingProtocol } = req.body;

        // 1. Verify user owns the GuardiaVault
        const vault = await storage.getVault(guardiaVaultId.toString());
        if (!vault || vault.ownerId !== userId) {
          return res.status(403).json({ message: "Vault not found or access denied" });
        }

        // 2. In production, call YieldVault contract.createYieldVault()
        // This requires wallet connection on frontend, contract call happens client-side
        // Backend stores the vault metadata after creation

        // 3. Store vault metadata in database (would need yield_vaults table)
        // For now, return success - frontend handles contract interaction

        logInfo("Yield vault creation requested", {
          userId,
          guardiaVaultId,
          asset,
          amount,
          stakingProtocol,
        });

        res.json({
          success: true,
          message: "Yield vault creation initiated",
          guardiaVaultId,
          // Frontend will create contract and return vaultId
        });
      } catch (error: any) {
        logError(error as Error, { context: "yield-vault-create" });
        res.status(500).json({ message: error.message || "Failed to create yield vault" });
      }
    }
  );

  /**
   * GET /api/yield-vaults/:id
   * Get yield vault details
   */
  app.get("/api/yield-vaults/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { id } = req.params;

      // In production:
      // 1. Fetch from database (yield_vaults table)
      // 2. Fetch current state from contract
      // 3. Calculate current yield
      // 4. Return combined data

      // For now, return placeholder
      // Frontend can query contract directly for real-time data
      res.status(404).json({ message: "Vault not found" });
    } catch (error: any) {
      logError(error as Error, { context: "yield-vault-details" });
      res.status(500).json({ message: error.message || "Failed to fetch vault details" });
    }
  });

  /**
   * POST /api/yield-vaults/update-yield/:id
   * Manually trigger yield update for a vault (admin/cron)
   */
  app.post("/api/yield-vaults/update-yield/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // In production:
      // 1. Get vault from database
      // 2. Calculate yield since last update
      // 3. Update on-chain via contract
      // 4. Update database record

      logInfo("Manual yield update triggered", { vaultId: id });

      res.json({
        success: true,
        message: "Yield update initiated",
      });
    } catch (error: any) {
      logError(error as Error, { context: "yield-vault-update" });
      res.status(500).json({ message: error.message || "Failed to update yield" });
    }
  });
}

