/**
 * AI Optimizer API Routes
 * OpenAI-powered intelligent yield strategy recommendations
 */

import type { Express, Request, Response } from "express";
import { aiOptimizerService } from "./services/aiOptimizerService";
import { logInfo, logError } from "./services/logger";

export function registerAIOptimizerRoutes(app: Express, requireAuth: any) {
  /**
   * POST /api/ai/optimize
   * Get AI-powered yield strategy recommendation
   */
  app.post(
    "/api/ai/optimize",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const {
          currentProtocol,
          currentAsset,
          currentBalance,
          riskTolerance,
          investmentHorizon,
          goals,
        } = req.body;

        if (!currentProtocol || !currentAsset || !currentBalance) {
          return res.status(400).json({
            message: "Missing required fields: currentProtocol, currentAsset, currentBalance",
          });
        }

        const recommendation = await aiOptimizerService.getAIRecommendation(
          userId,
          currentProtocol,
          currentAsset,
          currentBalance,
          {
            riskTolerance,
            investmentHorizon,
            goals: goals || [],
          }
        );

        res.json({
          success: true,
          data: recommendation,
          aiPowered: !!process.env.OPENAI_API_KEY,
        });
      } catch (error: any) {
        logError(error as Error, { context: "aiOptimize" });
        res.status(500).json({
          success: false,
          message: "Failed to generate AI recommendation",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/ai/status
   * Check if AI optimizer is available
   */
  app.get("/api/ai/status", requireAuth, async (_req: Request, res: Response) => {
    try {
      const isAvailable = !!process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      res.json({
        success: true,
        data: {
          available: isAvailable,
          model: isAvailable ? model : null,
          fallbackMode: !isAvailable,
        },
      });
    } catch (error: any) {
      logError(error as Error, { context: "aiStatus" });
      res.status(500).json({
        success: false,
        message: "Failed to check AI status",
        error: error.message,
      });
    }
  });
}

