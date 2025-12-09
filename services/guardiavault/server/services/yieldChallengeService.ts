/**
 * Yield Challenge Service
 * Monthly earning challenges with APY bonuses and community leaderboards
 */

import { db } from "../db";
import {
  yieldChallenges,
  userChallengeParticipation,
  type InsertYieldChallenge,
  type InsertUserChallengeParticipation,
} from "@shared/schema-extensions";
import { yieldVaults } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";

export interface ChallengeLeaderboard {
  userId: string;
  username: string;
  earnings: string;
  rank: number;
  rewardEarned?: string;
}

export class YieldChallengeService {
  /**
   * Create a new yield challenge
   */
  async createChallenge(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
    apyBonus: number,
    rewardPool: string
  ): Promise<string> {
    try {
      const insert: InsertYieldChallenge = {
        name,
        description,
        startDate,
        endDate,
        apyBonus: apyBonus.toString(),
        rewardPool,
        status: "upcoming",
      };

      const [created] = await db
        .insert(yieldChallenges)
        .values(insert)
        .returning();

      logInfo("Yield challenge created", { challengeId: created.id, name });
      return created.id;
    } catch (error) {
      logError(error as Error, { context: "createChallenge" });
      throw error;
    }
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    apyBonus: number;
    rewardPool: string;
    status: string;
    participantCount: number;
  }>> {
    try {
      const challenges = await db
        .select()
        .from(yieldChallenges)
        .where(eq(yieldChallenges.status, "active"))
        .orderBy(desc(yieldChallenges.startDate));

      // Get participant counts
      const challengesWithCounts = await Promise.all(
        challenges.map(async (challenge) => {
          const participants = await db
            .select({ count: sql<number>`COUNT(*)::integer` })
            .from(userChallengeParticipation)
            .where(eq(userChallengeParticipation.challengeId, challenge.id));

          return {
            id: challenge.id,
            name: challenge.name,
            description: challenge.description || "",
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            apyBonus: parseFloat(challenge.apyBonus || "0"),
            rewardPool: challenge.rewardPool || "0",
            status: challenge.status,
            participantCount: participants[0]?.count || 0,
          };
        })
      );

      return challengesWithCounts;
    } catch (error) {
      logError(error as Error, { context: "getActiveChallenges" });
      return [];
    }
  }

  /**
   * Join a challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<void> {
    try {
      // Check if already joined
      const existing = await db
        .select()
        .from(userChallengeParticipation)
        .where(
          and(
            eq(userChallengeParticipation.userId, userId),
            eq(userChallengeParticipation.challengeId, challengeId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return; // Already joined
      }

      // Verify challenge is active
      const challenge = await db
        .select()
        .from(yieldChallenges)
        .where(eq(yieldChallenges.id, challengeId))
        .limit(1);

      if (challenge.length === 0 || challenge[0].status !== "active") {
        throw new Error("Challenge is not active");
      }

      // Join challenge
      const insert: InsertUserChallengeParticipation = {
        userId,
        challengeId,
        currentEarnings: "0",
        joinedAt: new Date(),
      };

      await db.insert(userChallengeParticipation).values(insert);

      logInfo("User joined challenge", { userId, challengeId });
    } catch (error) {
      logError(error as Error, { context: "joinChallenge", userId, challengeId });
      throw error;
    }
  }

  /**
   * Update user's challenge earnings
   */
  async updateChallengeEarnings(
    userId: string,
    challengeId: string,
    earnings: string
  ): Promise<void> {
    try {
      await db
        .update(userChallengeParticipation)
        .set({
          currentEarnings: earnings,
        })
        .where(
          and(
            eq(userChallengeParticipation.userId, userId),
            eq(userChallengeParticipation.challengeId, challengeId)
          )
        );

      // Update rankings
      await this.updateChallengeRankings(challengeId);
    } catch (error) {
      logError(error as Error, {
        context: "updateChallengeEarnings",
        userId,
        challengeId,
      });
    }
  }

  /**
   * Update challenge leaderboard rankings
   */
  private async updateChallengeRankings(challengeId: string): Promise<void> {
    try {
      // Get all participants ordered by earnings
      const participants = await db
        .select()
        .from(userChallengeParticipation)
        .where(eq(userChallengeParticipation.challengeId, challengeId))
        .orderBy(desc(userChallengeParticipation.currentEarnings));

      // Update ranks
      for (let i = 0; i < participants.length; i++) {
        await db
          .update(userChallengeParticipation)
          .set({ rank: i + 1 })
          .where(eq(userChallengeParticipation.id, participants[i].id));
      }
    } catch (error) {
      logError(error as Error, { context: "updateChallengeRankings", challengeId });
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(
    challengeId: string,
    limit: number = 50
  ): Promise<ChallengeLeaderboard[]> {
    try {
      const participants = await db
        .select({
          userId: userChallengeParticipation.userId,
          earnings: userChallengeParticipation.currentEarnings,
          rank: userChallengeParticipation.rank,
          rewardEarned: userChallengeParticipation.rewardEarned,
        })
        .from(userChallengeParticipation)
        .where(eq(userChallengeParticipation.challengeId, challengeId))
        .orderBy(userChallengeParticipation.rank)
        .limit(limit);

      // Get user details
      const userIds = participants.map((p) => p.userId);
      const users = await db
        .select({
          id: yieldVaults.userId,
          email: sql<string>`email`,
        })
        .from(yieldVaults)
        .where(sql`${yieldVaults.userId} = ANY(${userIds})`)
        .limit(1); // Simplified - would need proper join

      return participants.map((p, idx) => ({
        userId: p.userId,
        username: `User ${p.userId.slice(0, 8)}`, // Simplified
        earnings: p.earnings || "0",
        rank: p.rank || idx + 1,
        rewardEarned: p.rewardEarned || undefined,
      }));
    } catch (error) {
      logError(error as Error, { context: "getChallengeLeaderboard", challengeId });
      return [];
    }
  }

  /**
   * Get user's challenge participation
   */
  async getUserChallenges(userId: string): Promise<Array<{
    challengeId: string;
    challengeName: string;
    currentEarnings: string;
    rank: number | null;
    rewardEarned: string | null;
    apyBonus: number;
  }>> {
    try {
      const participations = await db
        .select({
          challengeId: userChallengeParticipation.challengeId,
          currentEarnings: userChallengeParticipation.currentEarnings,
          rank: userChallengeParticipation.rank,
          rewardEarned: userChallengeParticipation.rewardEarned,
        })
        .from(userChallengeParticipation)
        .where(eq(userChallengeParticipation.userId, userId));

      // Get challenge details
      const challengeIds = participations.map((p) => p.challengeId);
      const challenges = await db
        .select()
        .from(yieldChallenges)
        .where(sql`${yieldChallenges.id} = ANY(${challengeIds})`);

      const challengeMap = new Map(
        challenges.map((c) => [c.id, { name: c.name, apyBonus: parseFloat(c.apyBonus || "0") }])
      );

      return participations.map((p) => {
        const challenge = challengeMap.get(p.challengeId);
        return {
          challengeId: p.challengeId,
          challengeName: challenge?.name || "Unknown",
          currentEarnings: p.currentEarnings || "0",
          rank: p.rank,
          rewardEarned: p.rewardEarned || null,
          apyBonus: challenge?.apyBonus || 0,
        };
      });
    } catch (error) {
      logError(error as Error, { context: "getUserChallenges", userId });
      return [];
    }
  }

  /**
   * Calculate challenge APY bonus
   */
  getChallengeAPYBonus(userId: string, challengeId: string): Promise<number> {
    // Check if user is participating in active challenge
    return db
      .select({
        apyBonus: yieldChallenges.apyBonus,
      })
      .from(userChallengeParticipation)
      .innerJoin(
        yieldChallenges,
        eq(userChallengeParticipation.challengeId, yieldChallenges.id)
      )
      .where(
        and(
          eq(userChallengeParticipation.userId, userId),
          eq(userChallengeParticipation.challengeId, challengeId),
          eq(yieldChallenges.status, "active")
        )
      )
      .then((result) => {
        if (result.length > 0) {
          return parseFloat(result[0].apyBonus || "0");
        }
        return 0;
      })
      .catch(() => 0);
  }

  /**
   * Start challenge cron job (activates challenges)
   */
  startChallengeCron(): void {
    // Check for challenges that should start
    setInterval(async () => {
      try {
        const now = new Date();
        await db
          .update(yieldChallenges)
          .set({ status: "active" })
          .where(
            and(
              eq(yieldChallenges.status, "upcoming"),
              lte(yieldChallenges.startDate, now),
              gte(yieldChallenges.endDate, now)
            )
          );

        // Mark completed challenges
        await db
          .update(yieldChallenges)
          .set({ status: "completed" })
          .where(
            and(
              eq(yieldChallenges.status, "active"),
              lte(yieldChallenges.endDate, now)
            )
          );
      } catch (error) {
        logError(error as Error, { context: "challengeCron" });
      }
    }, 60 * 60 * 1000); // Check every hour
  }
}

export const yieldChallengeService = new YieldChallengeService();

