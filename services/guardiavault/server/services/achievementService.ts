/**
 * Achievement Service
 * Tracks user milestones and unlocks achievements
 */

import { db } from "../db";
import { achievements, type InsertAchievement, type Achievement as DbAchievement } from "@shared/schema-extensions";
import { users, yieldVaults } from "@shared/schema";
import { eq, and, count } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";
import { ethers } from "ethers";

export type AchievementType =
  | "first_deposit"
  | "yield_milestone_100"
  | "yield_milestone_1000"
  | "yield_milestone_10000"
  | "referral_1"
  | "referral_5"
  | "referral_10"
  | "vault_creator"
  | "long_term_holder_30"
  | "long_term_holder_90"
  | "long_term_holder_365"
  | "optimizer_user"
  | "education_complete";

export interface Achievement {
  type: AchievementType;
  title: string;
  description: string;
  rewardAmount?: string;
  icon: string;
}

const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, Achievement> = {
  first_deposit: {
    type: "first_deposit",
    title: "First Steps",
    description: "Made your first deposit",
    rewardAmount: "5.00", // $5 reward
    icon: "🌟",
  },
  yield_milestone_100: {
    type: "yield_milestone_100",
    title: "Century Club",
    description: "Earned $100 in yield",
    rewardAmount: "10.00",
    icon: "💯",
  },
  yield_milestone_1000: {
    type: "yield_milestone_1000",
    title: "Thousandaire",
    description: "Earned $1,000 in yield",
    rewardAmount: "50.00",
    icon: "💰",
  },
  yield_milestone_10000: {
    type: "yield_milestone_10000",
    title: "Yield Master",
    description: "Earned $10,000 in yield",
    rewardAmount: "200.00",
    icon: "👑",
  },
  referral_1: {
    type: "referral_1",
    title: "Referral Starter",
    description: "Referred 1 friend",
    rewardAmount: "25.00",
    icon: "👥",
  },
  referral_5: {
    type: "referral_5",
    title: "Referral Champion",
    description: "Referred 5 friends",
    rewardAmount: "100.00",
    icon: "🏆",
  },
  referral_10: {
    type: "referral_10",
    title: "Referral Legend",
    description: "Referred 10 friends",
    rewardAmount: "250.00",
    icon: "⭐",
  },
  vault_creator: {
    type: "vault_creator",
    title: "Vault Master",
    description: "Created your first vault",
    icon: "🏛️",
  },
  long_term_holder_30: {
    type: "long_term_holder_30",
    title: "30 Day Holder",
    description: "Held assets for 30 days",
    icon: "📅",
  },
  long_term_holder_90: {
    type: "long_term_holder_90",
    title: "90 Day Veteran",
    description: "Held assets for 90 days",
    icon: "🗓️",
  },
  long_term_holder_365: {
    type: "long_term_holder_365",
    title: "Year Holder",
    description: "Held assets for 1 year",
    rewardAmount: "100.00",
    icon: "🎉",
  },
  optimizer_user: {
    type: "optimizer_user",
    title: "Optimizer",
    description: "Used strategy optimizer",
    icon: "⚡",
  },
  education_complete: {
    type: "education_complete",
    title: "Knowledge Seeker",
    description: "Completed all education articles",
    icon: "📚",
  },
};

export class AchievementService {
  /**
   * Check and unlock achievement for user
   */
  async checkAndUnlockAchievement(
    userId: string,
    achievementType: AchievementType
  ): Promise<boolean> {
    try {
      // Check if already unlocked
      const existing = await db
        .select()
        .from(achievements)
        .where(
          and(
            eq(achievements.userId, userId),
            eq(achievements.achievementType, achievementType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return false; // Already unlocked
      }

      // Get achievement definition
      const definition = ACHIEVEMENT_DEFINITIONS[achievementType];
      if (!definition) {
        logError(new Error("Invalid achievement type"), {
          context: "checkAndUnlockAchievement",
          achievementType,
        });
        return false;
      }

      // Create achievement record
      const insert: InsertAchievement = {
        userId,
        achievementType,
        achievementData: {
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
        },
        rewardAmount: definition.rewardAmount || null,
      };

      await db.insert(achievements).values(insert);

      logInfo("Achievement unlocked", {
        userId,
        achievementType,
        rewardAmount: definition.rewardAmount,
      });

      return true;
    } catch (error) {
      logError(error as Error, {
        context: "checkAndUnlockAchievement",
        userId,
        achievementType,
      });
      return false;
    }
  }

  /**
   * Check achievements after deposit
   */
  async checkDepositAchievements(userId: string, depositAmount: string): Promise<void> {
    try {
      // Check first deposit
      const existingDeposits = await db
        .select({ count: count() })
        .from(yieldVaults)
        .where(eq(yieldVaults.userId, userId));

      if (existingDeposits.length === 0 || existingDeposits[0].count === 1) {
        await this.checkAndUnlockAchievement(userId, "first_deposit");
      }

      // Check yield milestones (would need to check total yield earned)
      // This would be called after yield calculation
    } catch (error) {
      logError(error as Error, { context: "checkDepositAchievements", userId });
    }
  }

  /**
   * Check yield milestone achievements
   */
  async checkYieldMilestones(userId: string, totalYieldEarned: string): Promise<void> {
    try {
      const yieldAmount = parseFloat(totalYieldEarned);

      if (yieldAmount >= 10000) {
        await this.checkAndUnlockAchievement(userId, "yield_milestone_10000");
      } else if (yieldAmount >= 1000) {
        await this.checkAndUnlockAchievement(userId, "yield_milestone_1000");
      } else if (yieldAmount >= 100) {
        await this.checkAndUnlockAchievement(userId, "yield_milestone_100");
      }
    } catch (error) {
      logError(error as Error, { context: "checkYieldMilestones", userId });
    }
  }

  /**
   * Check referral achievements
   */
  async checkReferralAchievements(userId: string, referralCount: number): Promise<void> {
    try {
      if (referralCount >= 10) {
        await this.checkAndUnlockAchievement(userId, "referral_10");
      } else if (referralCount >= 5) {
        await this.checkAndUnlockAchievement(userId, "referral_5");
      } else if (referralCount >= 1) {
        await this.checkAndUnlockAchievement(userId, "referral_1");
      }
    } catch (error) {
      logError(error as Error, { context: "checkReferralAchievements", userId });
    }
  }

  /**
   * Check long-term holder achievements
   */
  async checkLongTermHolderAchievements(userId: string): Promise<void> {
    try {
      // Get oldest vault creation date
      const vaults = await db
        .select()
        .from(yieldVaults)
        .where(eq(yieldVaults.userId, userId))
        .orderBy(yieldVaults.createdAt)
        .limit(1);

      if (vaults.length === 0) {
        return;
      }

      const oldestVaultDate = new Date(vaults[0].createdAt);
      const daysHeld = Math.floor(
        (Date.now() - oldestVaultDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysHeld >= 365) {
        await this.checkAndUnlockAchievement(userId, "long_term_holder_365");
      } else if (daysHeld >= 90) {
        await this.checkAndUnlockAchievement(userId, "long_term_holder_90");
      } else if (daysHeld >= 30) {
        await this.checkAndUnlockAchievement(userId, "long_term_holder_30");
      }
    } catch (error) {
      logError(error as Error, { context: "checkLongTermHolderAchievements", userId });
    }
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<Array<{
    type: AchievementType;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    rewardAmount?: string;
  }>> {
    try {
      const userAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId))
        .orderBy(achievements.unlockedAt);

      return userAchievements.map((ach: DbAchievement) => ({
        type: ach.achievementType as AchievementType,
        title: (ach.achievementData as any)?.title || "",
        description: (ach.achievementData as any)?.description || "",
        icon: (ach.achievementData as any)?.icon || "🏆",
        unlockedAt: ach.unlockedAt,
        rewardAmount: ach.rewardAmount || undefined,
      }));
    } catch (error) {
      logError(error as Error, { context: "getUserAchievements", userId });
      return [];
    }
  }

  /**
   * Get achievement definitions (all available achievements)
   */
  getAchievementDefinitions(): Achievement[] {
    return Object.values(ACHIEVEMENT_DEFINITIONS);
  }
}

export const achievementService = new AchievementService();

