/**
 * AI Risk Monitor Service
 * Detects suspicious login patterns, anomalous behavior, and impersonation attempts
 */

import { db } from "../db";
import { aiRiskEvents, insertAiRiskEventSchema, type InsertAiRiskEvent } from "@shared/schema";
import { eq, and, desc } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";

export interface LoginPattern {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp: Date;
  success: boolean;
}

export interface RiskScore {
  score: number; // 0.0 to 1.0
  severity: "low" | "medium" | "high" | "critical";
  reasons: string[];
}

export class AIRiskMonitor {
  /**
   * Analyze login pattern for suspicious activity
   */
  analyzeLoginPattern(
    userId: string,
    currentLogin: LoginPattern,
    recentLogins: LoginPattern[]
  ): RiskScore {
    const reasons: string[] = [];
    let riskScore = 0.0;

    // Check for new IP address (20% risk)
    if (currentLogin.ipAddress) {
      const knownIPs = new Set(
        recentLogins.map((l) => l.ipAddress).filter(Boolean) as string[]
      );
      if (!knownIPs.has(currentLogin.ipAddress)) {
        riskScore += 0.2;
        reasons.push("Login from new IP address");
      }
    }

    // Check for new user agent (15% risk)
    if (currentLogin.userAgent) {
      const knownAgents = new Set(
        recentLogins.map((l) => l.userAgent).filter(Boolean) as string[]
      );
      if (!knownAgents.has(currentLogin.userAgent)) {
        riskScore += 0.15;
        reasons.push("Login from new device/browser");
      }
    }

    // Check for location change (25% risk if significant)
    if (currentLogin.location && recentLogins.length > 0) {
      const lastLocation = recentLogins[0].location;
      if (lastLocation && lastLocation !== currentLogin.location) {
        riskScore += 0.25;
        reasons.push("Login from different location");
      }
    }

    // Check for rapid successive logins (30% risk)
    if (recentLogins.length > 0) {
      const timeDiff =
        currentLogin.timestamp.getTime() -
        recentLogins[0].timestamp.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      if (minutesDiff < 5 && recentLogins.length >= 3) {
        riskScore += 0.3;
        reasons.push("Multiple rapid login attempts");
      }
    }

    // Check for failed authentication pattern (40% risk)
    const recentFailures = recentLogins.filter((l) => !l.success).length;
    if (recentFailures >= 3) {
      riskScore += 0.4;
      reasons.push("Multiple failed authentication attempts");
    }

    // Clamp risk score to 1.0
    riskScore = Math.min(1.0, riskScore);

    // Determine severity
    let severity: "low" | "medium" | "high" | "critical";
    if (riskScore >= 0.75) {
      severity = "critical";
    } else if (riskScore >= 0.5) {
      severity = "high";
    } else if (riskScore >= 0.25) {
      severity = "medium";
    } else {
      severity = "low";
    }

    return { score: riskScore, severity, reasons };
  }

  /**
   * Detect unusual activity patterns
   */
  detectUnusualActivity(
    userId: string,
    currentActivity: {
      action: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    },
    recentActivities: Array<{
      action: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    }>
  ): RiskScore {
    const reasons: string[] = [];
    let riskScore = 0.0;

    // Check for action frequency anomaly
    const actionFrequency = new Map<string, number>();
    recentActivities.forEach((a) => {
      actionFrequency.set(a.action, (actionFrequency.get(a.action) || 0) + 1);
    });

    const currentActionCount = actionFrequency.get(currentActivity.action) || 0;
    const avgActionCount = recentActivities.length / actionFrequency.size;

    if (currentActionCount > avgActionCount * 3) {
      riskScore += 0.35;
      reasons.push(`Unusual frequency of action: ${currentActivity.action}`);
    }

    // Check for time-of-day anomaly (if we have enough data)
    if (recentActivities.length > 10) {
      const hour = currentActivity.timestamp.getHours();
      const typicalHours = recentActivities.map((a) => a.timestamp.getHours());
      const hourFrequency = new Map<number, number>();
      typicalHours.forEach((h) => {
        hourFrequency.set(h, (hourFrequency.get(h) || 0) + 1);
      });

      const typicalHourCount = hourFrequency.get(hour) || 0;
      if (typicalHourCount < typicalHours.length * 0.1) {
        riskScore += 0.2;
        reasons.push("Activity at unusual time of day");
      }
    }

    // Clamp and determine severity
    riskScore = Math.min(1.0, riskScore);
    let severity: "low" | "medium" | "high" | "critical";
    if (riskScore >= 0.75) {
      severity = "critical";
    } else if (riskScore >= 0.5) {
      severity = "high";
    } else if (riskScore >= 0.25) {
      severity = "medium";
    } else {
      severity = "low";
    }

    return { score: riskScore, severity, reasons };
  }

  /**
   * Create a risk event in the database
   */
  async createRiskEvent(
    event: Omit<InsertAiRiskEvent, "id" | "createdAt">
  ): Promise<string> {
    try {
      if (!db) {
        logError(new Error("Database not available"), {
          context: "AIRiskMonitor.createRiskEvent",
        });
        throw new Error("Database not available");
      }

      const validated = insertAiRiskEventSchema.parse(event);
      const result = await db
        .insert(aiRiskEvents)
        .values(validated)
        .returning({ id: aiRiskEvents.id });

      const eventId = result[0]?.id;
      if (!eventId) {
        throw new Error("Failed to create risk event");
      }

      logInfo("AI Risk Event created", {
        eventId,
        userId: event.userId,
        eventType: event.eventType,
        severity: event.severity,
      });

      return eventId;
    } catch (error: any) {
      logError(error, {
        context: "AIRiskMonitor.createRiskEvent",
        userId: event.userId,
      });
      throw error;
    }
  }

  /**
   * Get risk events for a user
   */
  async getUserRiskEvents(
    userId: string,
    limit: number = 50
  ): Promise<typeof aiRiskEvents.$inferSelect[]> {
    try {
      if (!db) {
        return [];
      }

      const events = await db
        .select()
        .from(aiRiskEvents)
        .where(eq(aiRiskEvents.userId, userId))
        .orderBy(desc(aiRiskEvents.createdAt))
        .limit(limit);

      return events;
    } catch (error: any) {
      logError(error, {
        context: "AIRiskMonitor.getUserRiskEvents",
        userId,
      });
      return [];
    }
  }

  /**
   * Get unresolved critical events
   */
  async getUnresolvedCriticalEvents(): Promise<
    typeof aiRiskEvents.$inferSelect[]
  > {
    try {
      if (!db) {
        return [];
      }

      const events = await db
        .select()
        .from(aiRiskEvents)
        .where(
          and(
            eq(aiRiskEvents.resolved, false),
            eq(aiRiskEvents.severity, "critical")
          )
        )
        .orderBy(desc(aiRiskEvents.createdAt));

      return events;
    } catch (error: any) {
      logError(error, {
        context: "AIRiskMonitor.getUnresolvedCriticalEvents",
      });
      return [];
    }
  }

  /**
   * Resolve a risk event
   */
  async resolveRiskEvent(
    eventId: string,
    resolvedBy: string
  ): Promise<boolean> {
    try {
      if (!db) {
        return false;
      }

      await db
        .update(aiRiskEvents)
        .set({
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy,
        })
        .where(eq(aiRiskEvents.id, eventId));

      logInfo("AI Risk Event resolved", { eventId, resolvedBy });
      return true;
    } catch (error: any) {
      logError(error, {
        context: "AIRiskMonitor.resolveRiskEvent",
        eventId,
      });
      return false;
    }
  }
}

export const aiRiskMonitor = new AIRiskMonitor();

