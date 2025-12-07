/**
 * DCA (Dollar Cost Averaging) API Routes
 * Stripe subscription integration for automated deposits
 */

import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { db } from "./db";
import { dcaSchedules, type InsertDCASchedule } from "@shared/schema-extensions";
import { vaults } from "@shared/schema";
import { eq, and } from "./utils/drizzle-exports";
import { logInfo, logError } from "./services/logger";
import { yieldService } from "./services/yieldService";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    })
  : null;

export function registerDCARoutes(app: Express, requireAuth: any) {
  /**
   * POST /api/dca/create
   * Create DCA schedule with Stripe subscription
   */
  app.post(
    "/api/dca/create",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { vaultId, amount, frequency, asset, protocol } = req.body;

        if (!vaultId || !amount || !frequency || !asset || !protocol) {
          return res.status(400).json({
            message: "Missing required fields",
          });
        }

        // Verify vault belongs to user
        const vault = await db
          .select()
          .from(vaults)
          .where(and(eq(vaults.id, vaultId), eq(vaults.ownerId, userId)))
          .limit(1);

        if (vault.length === 0) {
          return res.status(404).json({ message: "Vault not found" });
        }

        // Create Stripe subscription for recurring payments
        let stripeSubscriptionId: string | undefined;
        if (stripe) {
          try {
            // Get user's Stripe customer ID (would be stored in database)
            // For now, create customer if needed
            const customer = await stripe.customers.create({
              email: req.session.email,
              metadata: {
                userId: userId,
              },
            });

            // Create subscription with payment schedule
            const intervalMap: Record<string, "day" | "week" | "month" | "year"> = {
              daily: "day",
              weekly: "week",
              monthly: "month",
            };

            const subscription = await stripe.subscriptions.create({
              customer: customer.id,
              items: [
                {
                  price_data: {
                    currency: "usd",
                    product: await stripe.products.create({
                      name: `GuardiaVault DCA - ${asset}`,
                    }).then(p => p.id),
                    unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
                    recurring: {
                      interval: intervalMap[frequency] || "month",
                    },
                  } as any,
                },
              ],
              metadata: {
                userId,
                vaultId,
                asset,
                protocol,
                type: "dca",
              },
            });

            stripeSubscriptionId = subscription.id;
          } catch (error) {
            logError(error as Error, { context: "createDCAStripeSubscription" });
            // Continue without Stripe if it fails
          }
        }

        // Calculate next execution time
        const nextExecution = new Date();
        if (frequency === "daily") {
          nextExecution.setDate(nextExecution.getDate() + 1);
        } else if (frequency === "weekly") {
          nextExecution.setDate(nextExecution.getDate() + 7);
        } else if (frequency === "monthly") {
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }

        // Create DCA schedule
        const insert: InsertDCASchedule = {
          userId,
          vaultId,
          stripeSubscriptionId,
          amount: amount.toString(),
          frequency,
          asset,
          protocol,
          status: "active",
          nextExecutionAt: nextExecution,
        };

        const [created] = await db
          .insert(dcaSchedules)
          .values(insert)
          .returning();

        logInfo("DCA schedule created", {
          userId,
          vaultId,
          amount,
          frequency,
        });

        res.json({
          success: true,
          data: created,
        });
      } catch (error: any) {
        logError(error as Error, { context: "createDCASchedule" });
        res.status(500).json({
          success: false,
          message: "Failed to create DCA schedule",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/dca/schedules
   * Get user's DCA schedules
   */
  app.get(
    "/api/dca/schedules",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const schedules = await db
          .select()
          .from(dcaSchedules)
          .where(eq(dcaSchedules.userId, userId))
          .orderBy(dcaSchedules.createdAt);

        res.json({
          success: true,
          data: schedules,
        });
      } catch (error: any) {
        logError(error as Error, { context: "getDCASchedules" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch DCA schedules",
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/dca/execute
   * Execute DCA deposit (called by cron job or Stripe webhook)
   */
  app.post(
    "/api/dca/execute",
    async (req: Request, res: Response) => {
      try {
        // Verify this is called internally or via webhook
        const authHeader = req.headers["x-internal-auth"];
        if (authHeader !== process.env.INTERNAL_AUTH_TOKEN) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { scheduleId } = req.body;

        const schedule = await db
          .select()
          .from(dcaSchedules)
          .where(eq(dcaSchedules.id, scheduleId))
          .limit(1);

        if (schedule.length === 0) {
          return res.status(404).json({ message: "Schedule not found" });
        }

        const sched = schedule[0];

        if (sched.status !== "active") {
          return res.status(400).json({ message: "Schedule is not active" });
        }

        // Execute deposit via yield service
        // This would prepare transaction for user to sign
        const transaction = await yieldService.createYieldPosition(
          sched.userId,
          parseInt(sched.vaultId),
          sched.asset,
          sched.amount,
          sched.protocol
        );

        // Update schedule
        const nextExecution = new Date(sched.nextExecutionAt || new Date());
        if (sched.frequency === "daily") {
          nextExecution.setDate(nextExecution.getDate() + 1);
        } else if (sched.frequency === "weekly") {
          nextExecution.setDate(nextExecution.getDate() + 7);
        } else if (sched.frequency === "monthly") {
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }

        await db
          .update(dcaSchedules)
          .set({
            nextExecutionAt: nextExecution,
            totalExecutions: sched.totalExecutions + 1,
            updatedAt: new Date(),
          })
          .where(eq(dcaSchedules.id, scheduleId));

        logInfo("DCA executed", {
          scheduleId,
          userId: sched.userId,
          amount: sched.amount,
        });

        res.json({
          success: true,
          data: {
            transaction,
            nextExecutionAt: nextExecution,
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "executeDCA" });
        res.status(500).json({
          success: false,
          message: "Failed to execute DCA",
          error: error.message,
        });
      }
    }
  );
}

