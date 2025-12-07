/**
 * Yield Leaderboard API Routes
 * Real leaderboard data from database
 */

import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { yieldAnalytics } from "@shared/schema-extensions";
import { eq, desc, sql, and, gte } from "./utils/drizzle-exports";
import { logInfo, logError } from "./services/logger";

export function registerYieldLeaderboardRoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/yield/leaderboard
   * Get yield leaderboard with real earnings data
   */
  app.get(
    "/api/yield/leaderboard",
    async (req: Request, res: Response) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const period = (req.query.period as string) || "month"; // month, year, all

        // Calculate date range
        let sinceDate: Date;
        const now = new Date();
        if (period === "month") {
          sinceDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "year") {
          sinceDate = new Date(now.getFullYear(), 0, 1);
        } else {
          sinceDate = new Date(0); // All time
        }

        // Aggregate yield earnings by user
        const leaderboardData = await db
          .select({
            userId: yieldAnalytics.userId,
            totalEarnings: sql<number>`SUM(${yieldAnalytics.yieldEarned})::numeric`,
            avgAPY: sql<number>`AVG(${yieldAnalytics.apy})::numeric`,
            totalDeposits: sql<number>`SUM(${yieldAnalytics.principal})::numeric`,
          })
          .from(yieldAnalytics)
          .where(gte(yieldAnalytics.timestamp, sinceDate))
          .groupBy(yieldAnalytics.userId)
          .orderBy(desc(sql`SUM(${yieldAnalytics.yieldEarned})`))
          .limit(limit);

        // Get user details
        const userIds = leaderboardData.map((d: { userId: string; totalEarnings: number; avgAPY: number; totalDeposits: number }) => d.userId);
        const userDetails = await db
          .select({
            id: users.id,
            email: users.email,
            walletAddress: users.walletAddress,
          })
          .from(users)
          .where(sql`${users.id} = ANY(${userIds})`);

        const userMap = new Map(userDetails.map((u: { id: string; email: string | null; walletAddress: string | null }) => [u.id, u]));

        // Format leaderboard
        const leaderboard = leaderboardData.map((data: { userId: string; totalEarnings: number; avgAPY: number; totalDeposits: number }, index: number) => {
          const user = userMap.get(data.userId);
          const username = user?.walletAddress
            ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
            : user?.email?.split("@")[0] || "Anonymous";

          return {
            rank: index + 1,
            userId: data.userId,
            username,
            email: user?.email,
            apy: parseFloat(data.avgAPY.toString()),
            earnings: parseFloat(data.totalEarnings.toString()),
            totalDeposits: parseFloat(data.totalDeposits.toString()),
            isYou: false, // Will be set on frontend
          };
        });

        res.json({
          success: true,
          data: leaderboard,
          period,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logError(error as Error, { context: "getYieldLeaderboard" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch leaderboard",
          error: error.message,
        });
      }
    }
  );
}

