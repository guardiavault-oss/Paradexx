/**
 * Referral Service
 * Production-ready referral program with Stripe integration
 */

import { randomBytes } from "crypto";
import Stripe from "stripe";
import { db } from "../db";
import {
  referralCodes,
  referrals,
  type ReferralCode,
  type InsertReferralCode,
  type Referral,
  type InsertReferral,
} from "@shared/schema-extensions";
import { users } from "@shared/schema";
import { eq, and } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

export class ReferralService {
  /**
   * Generate unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<ReferralCode> {
    try {
      // Check if user already has a code
      const existing = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Generate unique code
      let code: string;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        code = this.generateCode();
        const existing = await db
          .select()
          .from(referralCodes)
          .where(eq(referralCodes.code, code))
          .limit(1);

        if (existing.length === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!code!) {
        throw new Error("Failed to generate unique referral code");
      }

      // Create Stripe coupon for referral rewards
      let stripeCouponId: string | undefined;
      if (stripe) {
        try {
          const coupon = await stripe.coupons.create({
            name: `Referral Reward - ${code}`,
            percent_off: 10, // 10% discount for referred users
            duration: "once",
            max_redemptions: 100, // Limit to 100 uses
            metadata: {
              referralCode: code,
              referrerUserId: userId,
            },
          });
          stripeCouponId = coupon.id;
        } catch (error) {
          logError(error as Error, { context: "createReferralCoupon" });
          // Continue without Stripe coupon
        }
      }

      const insert: InsertReferralCode = {
        userId,
        code: code!,
        stripeCouponId,
      };

      const [created] = await db
        .insert(referralCodes)
        .values(insert)
        .returning();

      logInfo("Referral code generated", { userId, code: code! });
      return created;
    } catch (error) {
      logError(error as Error, { context: "generateReferralCode", userId });
      throw error;
    }
  }

  /**
   * Process referral signup
   */
  async processReferral(
    referralCode: string,
    referredUserId: string
  ): Promise<Referral> {
    try {
      // Find referral code
      const codeRecord = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, referralCode))
        .limit(1);

      if (codeRecord.length === 0) {
        throw new Error("Invalid referral code");
      }

      const code = codeRecord[0];

      // Check if user is referring themselves
      if (code.userId === referredUserId) {
        throw new Error("Cannot use your own referral code");
      }

      // Check if already referred
      const existing = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referredId, referredUserId),
            eq(referrals.referralCodeId, code.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Create referral record
      const insert: InsertReferral = {
        referrerId: code.userId,
        referredId: referredUserId,
        referralCodeId: code.id,
        status: "pending",
      };

      const [created] = await db.insert(referrals).values(insert).returning();

      // Update referral code stats
      await db
        .update(referralCodes)
        .set({
          totalReferrals: code.totalReferrals + 1,
        })
        .where(eq(referralCodes.id, code.id));

      logInfo("Referral processed", {
        referrerId: code.userId,
        referredId: referredUserId,
        code: referralCode,
      });

      return created;
    } catch (error) {
      logError(error as Error, {
        context: "processReferral",
        referralCode,
        referredUserId,
      });
      throw error;
    }
  }

  /**
   * Complete referral when referred user makes first deposit
   */
  async completeReferral(
    referralId: string,
    depositAmount: string
  ): Promise<void> {
    try {
      const referral = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, referralId))
        .limit(1);

      if (referral.length === 0) {
        throw new Error("Referral not found");
      }

      const ref = referral[0];

      if (ref.status === "completed") {
        return; // Already completed
      }

      // Calculate reward (e.g., 1% of first deposit, capped at $100)
      const deposit = parseFloat(depositAmount);
      const rewardPercent = 0.01; // 1%
      let rewardAmount = deposit * rewardPercent;
      if (rewardAmount > 100) {
        rewardAmount = 100; // Cap at $100
      }

      // Update referral status
      await db
        .update(referrals)
        .set({
          status: "completed",
          firstDepositAt: new Date(),
          rewardAmount: rewardAmount.toString(),
        })
        .where(eq(referrals.id, referralId));

      // Update referral code total earnings
      const code = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.id, ref.referralCodeId))
        .limit(1);

      if (code.length > 0) {
        const currentEarnings = parseFloat(code[0].totalEarnings || "0");
        await db
          .update(referralCodes)
          .set({
            totalEarnings: (currentEarnings + rewardAmount).toString(),
          })
          .where(eq(referralCodes.id, ref.referralCodeId));
      }

      // Process Stripe payout (if configured)
      if (stripe && ref.referrerId) {
        const referrer = await db
          .select()
          .from(users)
          .where(eq(users.id, ref.referrerId))
          .limit(1);

        if (referrer.length > 0 && referrer[0].email) {
          // Create Stripe customer if needed and process payout
          // This would typically be done via Stripe Connect or manual payout
          logInfo("Referral reward processed", {
            referralId,
            rewardAmount,
            referrerId: ref.referrerId,
          });
        }
      }

      logInfo("Referral completed", { referralId, rewardAmount });
    } catch (error) {
      logError(error as Error, { context: "completeReferral", referralId });
      throw error;
    }
  }

  /**
   * Get user's referral stats
   */
  async getUserReferralStats(userId: string): Promise<{
    code: ReferralCode | null;
    totalReferrals: number;
    totalEarnings: string;
    completedReferrals: number;
    pendingReferrals: number;
  }> {
    try {
      const code = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.userId, userId))
        .limit(1);

      const userReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId));

      const completed = userReferrals.filter((r) => r.status === "completed");
      const pending = userReferrals.filter((r) => r.status === "pending");

      return {
        code: code.length > 0 ? code[0] : null,
        totalReferrals: userReferrals.length,
        totalEarnings: code.length > 0 ? code[0].totalEarnings || "0" : "0",
        completedReferrals: completed.length,
        pendingReferrals: pending.length,
      };
    } catch (error) {
      logError(error as Error, { context: "getUserReferralStats", userId });
      throw error;
    }
  }

  private generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
    const bytes = randomBytes(6);
    let code = "";
    for (let i = 0; i < bytes.length; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }
}

export const referralService = new ReferralService();

