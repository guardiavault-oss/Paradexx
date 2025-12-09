/**
 * Enhanced Yield API Routes
 * Production-ready endpoints with real-time APY data
 */

import type { Express, Request, Response } from "express";
import { enhancedYieldService } from "./services/enhancedYieldService.ts";
import { protocolAPIService } from "./services/protocolAPIs.ts";
import { protocolHealthService } from "./services/protocolHealthService.ts";
import { achievementService } from "./services/achievementService.ts";
import { logInfo, logError } from "./services/logger.ts";

export function registerEnhancedYieldRoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/yield/strategies/realtime
   * Get real-time APY for all strategies
   */
  app.get(
    "/api/yield/strategies/realtime",
    async (_req: Request, res: Response) => {
      try {
        const strategies = await protocolAPIService.getAllStrategiesAPY();
        res.json({
          success: true,
          data: strategies,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logError(error as Error, { context: "getRealtimeStrategies" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch real-time APY data",
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/yield/optimize
   * Optimize user's yield strategy
   */
  app.post(
    "/api/yield/optimize",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { currentProtocol, currentAsset, currentBalance } = req.body;

        if (!currentProtocol || !currentAsset || !currentBalance) {
          return res.status(400).json({
            message: "Missing required fields: currentProtocol, currentAsset, currentBalance",
          });
        }

        const recommendation = await enhancedYieldService.optimizeStrategy(
          userId,
          currentProtocol,
          currentAsset,
          currentBalance
        );

        // Check optimizer achievement
        await achievementService.checkAndUnlockAchievement(userId, "optimizer_user");

        res.json({
          success: true,
          data: recommendation,
        });
      } catch (error: any) {
        logError(error as Error, { context: "optimizeStrategy" });
        res.status(500).json({
          success: false,
          message: "Failed to optimize strategy",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/yield/analytics
   * Get historical yield analytics
   */
  app.get(
    "/api/yield/analytics",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const days = parseInt(req.query.days as string) || 30;

        const data = await enhancedYieldService.getHistoricalYieldData(
          userId,
          days
        );

        res.json({
          success: true,
          data,
        });
      } catch (error: any) {
        logError(error as Error, { context: "getYieldAnalytics" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch analytics",
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/yield/analytics/snapshot
   * Record yield snapshot (called by cron job)
   */
  app.post(
    "/api/yield/analytics/snapshot",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const {
          yieldVaultId,
          protocol,
          asset,
          principal,
          currentValue,
          yieldEarned,
          apy,
          apySource,
        } = req.body;

        await enhancedYieldService.recordYieldSnapshot(
          userId,
          yieldVaultId,
          protocol,
          asset,
          principal,
          currentValue,
          yieldEarned,
          apy,
          apySource
        );

        res.json({
          success: true,
          message: "Snapshot recorded",
        });
      } catch (error: any) {
        logError(error as Error, { context: "recordYieldSnapshot" });
        res.status(500).json({
          success: false,
          message: "Failed to record snapshot",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/protocols/health
   * Get protocol health status
   */
  app.get("/api/protocols/health", async (req: Request, res: Response) => {
    try {
      const protocol = req.query.protocol as string | undefined;
      const health = await protocolHealthService.getLatestProtocolHealth(
        protocol
      );

      res.json({
        success: true,
        data: health,
      });
    } catch (error: any) {
      logError(error as Error, { context: "getProtocolHealth" });
      res.status(500).json({
        success: false,
        message: "Failed to fetch protocol health",
        error: error.message,
      });
    }
  });
}

