/**
 * Admin Dashboard API Routes
 * System monitoring, user management, protocol oversight
 */

import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, yieldVaults, vaults, adminAuditLog } from "@shared/schema";
import { yieldAnalytics, protocolHealth, referrals, referralCodes } from "@shared/schema-extensions";
import { eq, sql, desc, count, gte, and } from "./utils/drizzle-exports";
import { logInfo, logError } from "./services/logger";
import { protocolHealthService } from "./services/protocolHealthService";
import Stripe from "stripe";
import { z } from "zod";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    })
  : null;

// Zod validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().max(1000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");
const userIdSchema = z.coerce.number().int().positive();

// Admin authentication with database role check
async function isAdmin(req: Request): Promise<boolean> {
  const userId = (req.session as any)?.userId;
  if (!userId) return false;

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user[0]?.isAdmin === true && user[0]?.role === "admin";
  } catch (error) {
    logError(error as Error, { context: "isAdminCheck" });
    return false;
  }
}

// Admin audit logging middleware
async function logAdminAction(
  req: Request,
  action: string,
  additionalData?: Record<string, any>
): Promise<void> {
  const userId = (req.session as any)?.userId;

  try {
    await db.insert(adminAuditLog).values({
      userId: userId || null,
      action,
      resource: req.path,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || null,
      userAgent: req.get("user-agent") || null,
      requestData: JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params,
        ...additionalData,
      }),
    });
  } catch (error) {
    logError(error as Error, { context: "adminAuditLog", action });
  }
}

export function registerAdminRoutes(app: Express, requireAuth: any) {
  /**
   * GET /api/admin/health
   * System health overview
   */
  app.get(
    "/api/admin/health",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!(await isAdmin(req))) {
          await logAdminAction(req, "admin_health_check_denied");
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        await logAdminAction(req, "admin_health_check");

        // Database health
        const dbHealth = await db
          .select({ count: count() })
          .from(users)
          .then(() => ({ status: "healthy", responseTime: Date.now() }))
          .catch(() => ({ status: "unhealthy", responseTime: null }));

        // Protocol health
        const protocolStatus = await protocolHealthService.getLatestProtocolHealth();

        // API status
        const apiStatus = {
          status: "operational",
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        };

        res.json({
          success: true,
          data: {
            database: dbHealth,
            protocols: protocolStatus,
            api: apiStatus,
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "adminHealthCheck" });
        res.status(500).json({
          success: false,
          message: "Failed to check system health",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/admin/stats
   * Platform statistics
   */
  app.get(
    "/api/admin/stats",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!(await isAdmin(req))) {
          await logAdminAction(req, "admin_stats_denied");
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        await logAdminAction(req, "admin_stats_view");

        // User stats
        const totalUsers = await db.select({ count: count() }).from(users);
        const activeUsers = await db
          .select({ count: count() })
          .from(users)
          .where(
            sql`${users.lastLoginAt} > NOW() - INTERVAL '30 days'`
          );

        // Vault stats
        const totalVaults = await db.select({ count: count() }).from(vaults);
        const activeVaults = await db
          .select({ count: count() })
          .from(vaults)
          .where(eq(vaults.status, "active"));

        // Yield stats
        const yieldStats = await db
          .select({
            totalDeposits: sql<number>`SUM(${yieldVaults.principal})::numeric`,
            totalYield: sql<number>`SUM(${yieldVaults.yieldAccumulated})::numeric`,
            avgAPY: sql<number>`AVG(${yieldVaults.apy})::numeric`,
          })
          .from(yieldVaults);

        // Referral stats
        const referralStats = await db
          .select({
            totalReferrals: sql<number>`COUNT(*)::integer`,
            completedReferrals: sql<number>`COUNT(*) FILTER (WHERE ${referrals.status} = 'completed')::integer`,
          })
          .from(referrals);

        res.json({
          success: true,
          data: {
            users: {
              total: totalUsers[0].count,
              active: activeUsers[0].count,
            },
            vaults: {
              total: totalVaults[0].count,
              active: activeVaults[0].count,
            },
            yield: {
              totalDeposits: yieldStats[0]?.totalDeposits?.toString() || "0",
              totalYield: yieldStats[0]?.totalYield?.toString() || "0",
              avgAPY: yieldStats[0]?.avgAPY?.toString() || "0",
            },
            referrals: {
              total: referralStats[0]?.totalReferrals || 0,
              completed: referralStats[0]?.completedReferrals || 0,
            },
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "adminStats" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch stats",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/admin/users
   * Get user list with pagination
   */
  app.get(
    "/api/admin/users",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!(await isAdmin(req))) {
          await logAdminAction(req, "admin_users_list_denied");
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        // Validate pagination parameters
        const validation = paginationSchema.safeParse(req.query);
        if (!validation.success) {
          return res.status(400).json({
            success: false,
            message: "Invalid pagination parameters",
            errors: validation.error.errors,
          });
        }

        const { page, limit } = validation.data;
        const offset = (page - 1) * limit;

        await logAdminAction(req, "admin_users_list", { page, limit });

        const userList = await db
          .select({
            id: users.id,
            email: users.email,
            walletAddress: users.walletAddress,
            createdAt: users.createdAt,
            lastLoginAt: users.lastLoginAt,
          })
          .from(users)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(users.createdAt));

        const totalUsers = await db.select({ count: count() }).from(users);

        res.json({
          success: true,
          data: {
            users: userList,
            pagination: {
              page,
              limit,
              total: totalUsers[0].count,
              totalPages: Math.ceil(totalUsers[0].count / limit),
            },
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "adminGetUsers" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/admin/protocols
   * Protocol performance and health
   */
  app.get(
    "/api/admin/protocols",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!(await isAdmin(req))) {
          await logAdminAction(req, "admin_protocols_view_denied");
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        await logAdminAction(req, "admin_protocols_view");

        const protocolData = await db
          .select({
            protocol: yieldVaults.protocol,
            totalDeposits: sql<number>`SUM(${yieldVaults.principal})::numeric`,
            totalYield: sql<number>`SUM(${yieldVaults.yieldAccumulated})::numeric`,
            avgAPY: sql<number>`AVG(${yieldVaults.apy})::numeric`,
            vaultCount: sql<number>`COUNT(*)::integer`,
          })
          .from(yieldVaults)
          .groupBy(yieldVaults.protocol);

        const healthStatus = await protocolHealthService.getLatestProtocolHealth();

        res.json({
          success: true,
          data: {
            protocols: protocolData.map((p: { protocol: string | null; totalDeposits: number | null; totalYield: number | null; avgAPY: number | null; vaultCount: number | null }) => ({
              protocol: p.protocol,
              totalDeposits: p.totalDeposits?.toString() || "0",
              totalYield: p.totalYield?.toString() || "0",
              avgAPY: p.avgAPY?.toString() || "0",
              vaultCount: p.vaultCount || 0,
              health: healthStatus.find((h) => h.protocol === p.protocol) || null,
            })),
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "adminGetProtocols" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch protocol data",
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/admin/stripe
   * Stripe subscription overview
   */
  app.get(
    "/api/admin/stripe",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!(await isAdmin(req))) {
          await logAdminAction(req, "admin_stripe_view_denied");
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        await logAdminAction(req, "admin_stripe_view");

        if (!stripe) {
          return res.status(503).json({
            success: false,
            message: "Stripe not configured",
          });
        }

        // Get recent subscriptions
        const stripeSubscriptions = await stripe.subscriptions.list({
          limit: 100,
          status: "all",
        });

        // Get revenue metrics
        const revenue = await stripe.balanceTransactions.list({
          limit: 100,
        });

        res.json({
          success: true,
          data: {
            subscriptions: {
              total: stripeSubscriptions.data.length,
              active: stripeSubscriptions.data.filter((s: Stripe.Subscription) => s.status === "active").length,
              recent: stripeSubscriptions.data.slice(0, 10).map((s: Stripe.Subscription) => ({
                id: s.id,
                status: s.status,
                customer: s.customer,
                amount: s.items.data[0]?.price?.unit_amount,
                currency: s.items.data[0]?.price?.currency,
                currentPeriodEnd: new Date((s as any).current_period_end * 1000).toISOString(),
              })),
            },
            revenue: {
              totalTransactions: revenue.data.length,
              recentTransactions: revenue.data.slice(0, 10).map((t) => ({
                id: t.id,
                amount: t.amount,
                currency: t.currency,
                type: t.type,
                status: t.status,
                created: new Date(t.created * 1000).toISOString(),
              })),
            },
          },
        });
      } catch (error: any) {
        logError(error as Error, { context: "adminGetStripe" });
        res.status(500).json({
          success: false,
          message: "Failed to fetch Stripe data",
          error: error.message,
        });
      }
    }
  );
}

