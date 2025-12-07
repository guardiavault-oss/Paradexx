/**
 * Onboarding API Routes
 * Handles user onboarding data
 */

import type { Express, Request, Response } from "express";
import { logError } from "./services/logger";

export function registerOnboardingRoutes(app: Express) {
  /**
   * POST /api/onboarding
   * Save user onboarding data
   */
  app.post("/api/onboarding", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { primaryGoal, cryptoExperience, suggestedStrategy } = req.body;

      // Validate input
      if (!primaryGoal || !cryptoExperience) {
        return res.status(400).json({
          message: "Missing required fields: primaryGoal, cryptoExperience",
        });
      }

      // TODO: Save to database
      // await storage.saveOnboardingData(userId, {
      //   primaryGoal,
      //   cryptoExperience,
      //   suggestedStrategy,
      //   completedAt: new Date(),
      // });

      // For now, just return success
      res.json({
        success: true,
        message: "Onboarding data saved",
        data: {
          primaryGoal,
          cryptoExperience,
          suggestedStrategy,
        },
      });
    } catch (error: any) {
      logError(error);
      res.status(500).json({
        message: "Failed to save onboarding data",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/onboarding
   * Get user onboarding data
   */
  app.get("/api/onboarding", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // TODO: Fetch from database
      // const data = await storage.getOnboardingData(userId);

      res.json({
        success: true,
        data: null, // or fetched data
      });
    } catch (error: any) {
      logError(error);
      res.status(500).json({
        message: "Failed to fetch onboarding data",
        error: error.message,
      });
    }
  });
}

