/**
 * Chainlink Oracle Routes
 * 
 * Endpoints for Chainlink External Adapter to query death certificates
 */

import type { Express, Request, Response } from "express";
import { chainlinkDeathOracle } from "./services/chainlinkDeathOracle";
import { logInfo, logError } from "./services/logger";

/**
 * Register oracle routes
 */
export function registerOracleRoutes(app: Express) {
  /**
   * Chainlink External Adapter endpoint
   * POST /api/oracle/death-verification
   * 
   * This endpoint receives requests from Chainlink nodes
   * and returns death verification results
   */
  app.post("/api/oracle/death-verification", async (req: Request, res: Response) => {
    try {
      logInfo("Oracle request received", { body: req.body });
      
      await chainlinkDeathOracle.handleHttpRequest(req, res);
    } catch (error: any) {
      logError(error, { type: "oracle_route_handler" });
      res.status(500).json({
        status: "errored",
        error: error.message || "Internal server error",
      });
    }
  });

  /**
   * Manual death verification trigger (for testing/admin)
   * POST /api/oracle/verify-death
   * 
   * Requires authentication in production
   */
  app.post("/api/oracle/verify-death", async (req: Request, res: Response) => {
    try {
      const { userAddress, userId } = req.body;

      if (!userAddress) {
        return res.status(400).json({ error: "userAddress is required" });
      }

      logInfo("Manual death verification request", { userAddress, userId });

      const request = {
        jobId: `manual-${Date.now()}`,
        data: {
          userAddress,
          userId,
        },
      };

      const response = await chainlinkDeathOracle.processRequest(request);

      if (response.status === "success" && response.data.verified) {
        // Submit on-chain
        try {
          const txHash = await chainlinkDeathOracle.submitOnChainVerification(userAddress);
          res.json({
            ...response,
            onChainTxHash: txHash,
          });
        } catch (error: any) {
          logError(error, { userAddress, type: "onchain_submission" });
          res.json({
            ...response,
            onChainError: error.message,
          });
        }
      } else {
        res.json(response);
      }
    } catch (error: any) {
      logError(error, { type: "manual_verification" });
      res.status(500).json({
        status: "errored",
        error: error.message || "Internal server error",
      });
    }
  });

  /**
   * Flag vault for verification (internal endpoint)
   * POST /api/oracle/flag-vault
   * 
   * Called when a vault enters Warning or Triggered state
   */
  app.post("/api/oracle/flag-vault", async (req: Request, res: Response) => {
    try {
      const { vaultId, userAddress } = req.body;

      if (!vaultId || !userAddress) {
        return res.status(400).json({ 
          error: "vaultId and userAddress are required" 
        });
      }

      logInfo("Flagging vault for death verification", { vaultId, userAddress });

      await chainlinkDeathOracle.flagVaultForVerification(vaultId, userAddress);

      res.json({ 
        success: true,
        message: "Vault flagged for verification",
        vaultId,
        userAddress,
      });
    } catch (error: any) {
      logError(error, { type: "flag_vault" });
      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });
}






