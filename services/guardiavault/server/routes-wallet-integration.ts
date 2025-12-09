/**
 * Enhanced Wallet Integration Routes
 * Support for multiple wallet types
 */

import type { Express, Request, Response } from "express";
import { walletIntegrationService } from "./services/walletIntegrationService";
import { logInfo, logError } from "./services/logger";

export function registerWalletIntegrationRoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/wallets/available
   * Get list of available wallets
   */
  app.get("/api/wallets/available", async (_req: Request, res: Response) => {
    try {
      const wallets = await walletIntegrationService.detectAvailableWallets();

      res.json({
        success: true,
        data: wallets,
      });
    } catch (error: any) {
      logError(error as Error, { context: "getAvailableWallets" });
      res.status(500).json({
        success: false,
        message: "Failed to detect wallets",
        error: error.message,
      });
    }
  });

  /**
   * POST /api/wallets/connect/coinbase
   * Connect Coinbase Wallet
   */
  app.post(
    "/api/wallets/connect/coinbase",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const walletInfo = await walletIntegrationService.connectCoinbaseWallet();

        if (!walletInfo) {
          return res.status(400).json({
            success: false,
            message: "Failed to connect Coinbase Wallet",
          });
        }

        // Update user's wallet address in database
        const userId = req.session?.userId;
        if (userId) {
          // TODO: Update user's wallet address
          // await storage.updateUser(userId, { walletAddress: walletInfo.address });
        }

        res.json({
          success: true,
          data: walletInfo,
        });
      } catch (error: any) {
        logError(error as Error, { context: "connectCoinbaseWallet" });
        res.status(500).json({
          success: false,
          message: "Failed to connect wallet",
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/wallets/connect/hardware
   * Connect hardware wallet
   */
  app.post(
    "/api/wallets/connect/hardware",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { deviceType } = req.body;

        const walletInfo = await walletIntegrationService.connectHardwareWallet(
          deviceType || "ledger"
        );

        if (!walletInfo) {
          return res.status(400).json({
            success: false,
            message: "Failed to connect hardware wallet",
          });
        }

        res.json({
          success: true,
          data: walletInfo,
        });
      } catch (error: any) {
        logError(error as Error, { context: "connectHardwareWallet" });
        res.status(500).json({
          success: false,
          message: "Failed to connect hardware wallet",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/wallets/status
   * Get wallet connection status
   */
  app.get(
    "/api/wallets/status",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { address } = req.query;

        if (!address || typeof address !== "string") {
          return res.status(400).json({
            success: false,
            message: "Wallet address required",
          });
        }

        const status = await walletIntegrationService.getWalletStatus(address);

        res.json({
          success: true,
          data: status,
        });
      } catch (error: any) {
        logError(error as Error, { context: "getWalletStatus" });
        res.status(500).json({
          success: false,
          message: "Failed to get wallet status",
          error: error.message,
        });
      }
    }
  );
}

