/**
 * Strategy Optimization API Routes
 */

import type { Express, Request, Response } from "express";
import { db } from "./db";
import { optimizationHistory } from "../shared/schema";
import { eq, desc } from "./utils/drizzle-exports";
import { logInfo, logError } from "./services/logger";

export function registerOptimizeRoutes(app: Express) {
  /**
   * POST /api/optimize
   * Save strategy optimization recommendation
   */
  app.post("/api/optimize", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { vaultId, currentAllocation, newAllocation, reason, estimatedApyGain } = req.body;

      // Validate input
      if (!currentAllocation || !newAllocation) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      // Save to database
      const [optimization] = await db
        .insert(optimizationHistory)
        .values({
          userId,
          vaultId: vaultId || null,
          oldAllocation: JSON.stringify(currentAllocation),
          newAllocation: JSON.stringify(newAllocation),
          reason: reason || "AI optimization suggestion",
          estimatedApyGain: estimatedApyGain ? estimatedApyGain.toString() : null,
          status: "pending",
          createdAt: new Date(),
        })
        .returning();

      logInfo("Optimization saved to history", { userId, vaultId, optimizationId: optimization.id });

      res.json({
        success: true,
        message: "Optimization saved",
        data: {
          id: optimization.id,
          currentAllocation,
          newAllocation,
          reason,
          estimatedApyGain,
          status: optimization.status,
        },
      });
    } catch (error: any) {
      logError(error, { context: "routes-optimize", userId: req.session?.userId });
      res.status(500).json({
        message: "Failed to save optimization",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/optimize/history
   * Get optimization history for user
   */
  app.get("/api/optimize/history", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const history = await db
        .select()
        .from(optimizationHistory)
        .where(eq(optimizationHistory.userId, userId))
        .orderBy(desc(optimizationHistory.createdAt))
        .limit(50);

      // Parse JSON strings back to objects
      const parsedHistory = history.map((h) => ({
        ...h,
        oldAllocation: JSON.parse(h.oldAllocation),
        newAllocation: JSON.parse(h.newAllocation),
      }));

      res.json({
        success: true,
        history: parsedHistory,
      });
    } catch (error: any) {
      logError(error, { context: "routes-optimize-history", userId: req.session?.userId });
      res.status(500).json({
        message: "Failed to fetch optimization history",
        error: error.message,
      });
    }
  });

  /**
   * PATCH /api/optimize/:id/apply
   * Mark optimization as applied
   */
  app.patch("/api/optimize/:id/apply", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      const [updated] = await db
        .update(optimizationHistory)
        .set({
          status: "applied",
          appliedAt: new Date(),
        })
        .where(eq(optimizationHistory.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Optimization not found" });
      }

      logInfo("Optimization marked as applied", { userId, optimizationId: id });

      res.json({
        success: true,
        message: "Optimization applied",
        data: updated,
      });
    } catch (error: any) {
      logError(error, { context: "routes-optimize-apply", userId: req.session?.userId });
      res.status(500).json({
        message: "Failed to apply optimization",
        error: error.message,
      });
    }
  });
}

