/**
 * Achievements API Routes
 */

import type { Express, Request, Response } from "express";
import { achievementService } from "./services/achievementService.ts";
import { logInfo, logError } from "./services/logger.ts";

export function registerAchievementRoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/achievements
   * Get user's achievements
   */
  app.get(
    "/api/achievements",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userAchievements = await achievementService.getUserAchievements(userId);
        const allDefinitions = achievementService.getAchievementDefinitions();

        // Mark which achievements are unlocked
        const unlockedTypes = new Set(userAchievements.map((a) => a.type));
        const achievements = allDefinitions.map((def) => ({
          ...def,
          unlocked: unlockedTypes.has(def.type),
          unlockedAt: userAchievements.find((a) => a.type === def.type)?.unlockedAt,
          rewardEarned: userAchievements.find((a) => a.type === def.type)?.rewardAmount,
        }));

        res.json({
          success: true,
          data: {
            achievements,
            unlockedCount: userAchievements.length,
            totalCount: allDefinitions.length,
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "getUserAchievements" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch achievements",
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/achievements/check
   * Manually trigger achievement check (internal use)
   */
  app.post(
    "/api/achievements/check",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { achievementType } = req.body;

        if (achievementType) {
          // Check specific achievement type
          await achievementService.checkAndUnlockAchievement(userId, achievementType);
        } else {
          // Check all achievement types
          await achievementService.checkLongTermHolderAchievements(userId);
          
          // Check education completion (if all articles completed)
          const { userArticleProgress, educationArticles } = await import("@shared/schema-extensions");
          const { db } = await import("../db");
          const { eq, count } = await import("drizzle-orm");
          
          const totalArticles = await db
            .select({ count: count() })
            .from(educationArticles);
          
          const completedArticles = await db
            .select({ count: count() })
            .from(userArticleProgress)
            .where(eq(userArticleProgress.userId, userId));
          
          if (totalArticles.length > 0 && completedArticles.length > 0) {
            if (completedArticles[0].count === totalArticles[0].count) {
              await achievementService.checkAndUnlockAchievement(userId, "education_complete");
            }
          }
        }

        res.json({
          success: true,
          message: "Achievement check completed",
        });
      } catch (error: any) {
        logError(error as Error, { context: "checkAchievements" });
        res.status(500).json({
          success: false,
          message: "Failed to check achievements",
          error: error.message,
        });
      }
    }
  );
}

