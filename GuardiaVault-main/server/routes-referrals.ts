/**
 * Referral Program API Routes
 * Production-ready with Stripe integration
 */

import type { Express, Request, Response } from "express";
import { referralService } from "./services/referralService.ts";
import { achievementService } from "./services/achievementService.ts";
import { logInfo, logError } from "./services/logger.ts";

export function registerReferralRoutes(app: Express, requireAuth: any) {
  /**
   * POST /api/referrals/generate
   * Generate referral code for user
   */
  app.post(
    "/api/referrals/generate",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const code = await referralService.generateReferralCode(userId);

        res.json({
          success: true,
          data: {
            code: code.code,
            totalReferrals: code.totalReferrals,
            totalEarnings: code.totalEarnings,
            stripeCouponId: code.stripeCouponId,
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "generateReferralCode" });
        res.status(500).json({
          success: false,
          message: "Failed to generate referral code",
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/referrals/use
   * Use referral code during signup
   */
  app.post("/api/referrals/use", async (req: Request, res: Response) => {
    try {
      const { code, userId } = req.body;

      if (!code || !userId) {
        return res.status(400).json({
          message: "Missing required fields: code, userId",
        });
      }

      const referral = await referralService.processReferral(code, userId);

      res.json({
        success: true,
        data: {
          referralId: referral.id,
          status: referral.status,
          stripeCouponId: referral.referralCodeId
            ? (await referralService.getUserReferralStats(referral.referrerId))
                .code?.stripeCouponId
            : null,
        },
      });
    } catch (error: any) {
      logError(error as Error, { context: "useReferralCode" });
      res.status(400).json({
        success: false,
        message: error.message || "Failed to process referral",
      });
    }
  });

  /**
   * GET /api/referrals/stats
   * Get user's referral statistics
   */
  app.get(
    "/api/referrals/stats",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const stats = await referralService.getUserReferralStats(userId);

        res.json({
          success: true,
          data: stats,
        });
      } catch (error: any) {
        logError(error as Error, { context: "getReferralStats" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch referral stats",
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/referrals/complete
   * Complete referral when referred user makes first deposit
   * Called internally by deposit endpoint
   */
  app.post(
    "/api/referrals/complete",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { referralId, depositAmount } = req.body;

        if (!referralId || !depositAmount) {
          return res.status(400).json({
            message: "Missing required fields: referralId, depositAmount",
          });
        }

      await referralService.completeReferral(referralId, depositAmount);

      // Check referral achievements
      const referral = await referralService.getUserReferralStats(userId);
      await achievementService.checkReferralAchievements(
        userId,
        referral.totalReferrals
      );

      res.json({
        success: true,
        message: "Referral completed",
      });
      } catch (error: any) {
        logError(error as Error, { context: "completeReferral" });
        res.status(500).json({
          success: false,
          message: "Failed to complete referral",
          error: error.message,
        });
      }
    }
  );
}

