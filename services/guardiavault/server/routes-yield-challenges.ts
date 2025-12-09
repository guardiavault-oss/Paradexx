/**
 * Yield Challenges API Routes
 */

import type { Express, Request, Response } from "express";
import { yieldChallengeService } from "./services/yieldChallengeService";
import { logInfo, logError } from "./services/logger";

export function registerYieldChallengeRoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/challenges
   * Get active challenges
   */
  app.get("/api/challenges", async (_req: Request, res: Response) => {
    try {
      const challenges = await yieldChallengeService.getActiveChallenges();

      res.json({
        success: true,
        data: challenges,
      });
    } catch (error: any) {
      logError(error as Error, { context: "getChallenges" });
      res.status(500).json({
        success: false,
        message: "Failed to fetch challenges",
        error: error.message,
      });
    }
  });

  /**
   * POST /api/challenges/:challengeId/join
   * Join a challenge
   */
  app.post(
    "/api/challenges/:challengeId/join",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { challengeId } = req.params;

        await yieldChallengeService.joinChallenge(userId, challengeId);

        res.json({
          success: true,
          message: "Joined challenge successfully",
        });
      } catch (error: any) {
        logError(error as Error, { context: "joinChallenge" });
        res.status(400).json({
          success: false,
          message: error.message || "Failed to join challenge",
        });
      }
    }
  );

  /**
   * GET /api/challenges/:challengeId/leaderboard
   * Get challenge leaderboard
   */
  app.get(
    "/api/challenges/:challengeId/leaderboard",
    async (req: Request, res: Response) => {
      try {
        const { challengeId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const leaderboard = await yieldChallengeService.getChallengeLeaderboard(
          challengeId,
          limit
        );

        res.json({
          success: true,
          data: leaderboard,
        });
      } catch (error: any) {
        logError(error as Error, { context: "getChallengeLeaderboard" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch leaderboard",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/challenges/my
   * Get user's challenge participation
   */
  app.get(
    "/api/challenges/my",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const challenges = await yieldChallengeService.getUserChallenges(userId);

        res.json({
          success: true,
          data: challenges,
        });
      } catch (error: any) {
        logError(error as Error, { context: "getUserChallenges" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch user challenges",
          error: error.message,
        });
      }
    }
  );
}

