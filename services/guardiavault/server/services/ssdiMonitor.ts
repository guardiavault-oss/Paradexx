/**
 * SSDI Monitoring Service
 * Monitors Social Security Death Index for user death records
 */

import crypto from "crypto";
import axios from "axios";
import { db } from "../db";
import { eq, and, or, isNull, lt, sql } from "../utils/drizzle-exports";
import { ssdiCheckLog, deathVerificationEvents } from "../../shared/schema.death-verification";
import { users } from "../../shared/schema";
import { logInfo, logError, logWarn } from "./logger";

// SSDI Provider Configuration
const SSDI_PROVIDERS = {
  primary: {
    name: "GenealogyBank",
    api: process.env.SSDI_API_URL || "https://api.genealogybank.com/ssdi",
    apiKey: process.env.SSDI_API_KEY,
    cost: "$500/month unlimited",
    coverage: "1935-present",
    updateFrequency: "daily",
  },
  secondary: {
    name: "FamilySearch",
    api: process.env.FAMILYSEARCH_API_URL || "https://www.familysearch.org/platform",
    apiKey: process.env.FAMILYSEARCH_API_KEY,
    cost: "Free (rate limited)",
    coverage: "1962-present",
    updateFrequency: "monthly",
  },
};

export class SSDIMonitorService {
  private batchSize: number;
  private checkInterval: number;

  constructor() {
    this.batchSize = parseInt(process.env.SSDI_BATCH_SIZE || "1000", 10);
    this.checkInterval = 24 * 60 * 60 * 1000; // Daily
  }

  /**
   * Hash SSN for storage (never store plaintext)
   */
  hashSSN(ssn: string, salt: string): string {
    return crypto
      .createHash("sha256")
      .update(ssn + salt)
      .digest("hex");
  }

  /**
   * Main monitoring function - runs daily check
   */
  async runDailyCheck(): Promise<void> {
    logInfo("Starting SSDI daily check...");

    try {
      const usersToCheck = await this.getUsersForCheck();
      logInfo(`Checking ${usersToCheck.length} users against SSDI...`);

      for (const user of usersToCheck) {
        try {
          await this.checkUserSSDI(user);
          await this.sleep(100); // Rate limiting
        } catch (error: any) {
          logError(error, { userId: user.id, source: "ssdi_check" });
        }
      }

      logInfo("SSDI check complete.");
    } catch (error: any) {
      logError(error, { source: "ssdi_daily_check" });
      throw error;
    }
  }

  /**
   * Get users who need checking
   * Note: This requires users table to have death verification columns added via migration
   */
  private async getUsersForCheck(): Promise<any[]> {
    // Note: This query will fail until migration adds death verification columns
    // Migration should add: death_monitoring_enabled, ssdi_consent_given, last_ssdi_check, etc.
    
    try {
      // For now, return empty array until schema is migrated
      // In production, this would query users with death monitoring enabled
      return [];

      // Future implementation after migration:
      // return await db.select({
      //   id: users.id,
      //   ssnHash: users.ssnHash,
      //   fullName: users.fullName,
      //   dateOfBirth: users.dateOfBirth,
      //   lastKnownLocation: users.lastKnownLocation,
      // }).from(users)
      // .where(
      //   and(
      //     eq(users.deathMonitoringEnabled, true),
      //     eq(users.ssdiConsentGiven, true),
      //     or(
      //       isNull(users.lastSsdiiCheck),
      //       lt(users.lastSsdiiCheck, sql`NOW() - INTERVAL '24 hours'`)
      //     )
      //   )
      // )
      // .limit(this.batchSize);
      // eslint-disable-next-line no-unreachable
    } catch (error: any) {
      logWarn("Users table not yet extended with death verification fields", {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Check single user against SSDI
   */
  async checkUserSSDI(user: any): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await this.querySSDIProvider(user);

      const responseTime = Date.now() - startTime;

      // Log check
      await db.insert(ssdiCheckLog).values({
        userId: user.id,
        ssdiProvider: SSDI_PROVIDERS.primary.name,
        matchFound: result.found,
        matchData: result.data || null,
        apiResponseTimeMs: responseTime,
      });

      // Update last check time (requires migration to add column)
      // await db
      //   .update(users)
      //   .set({ lastSsdiiCheck: new Date() })
      //   .where(eq(users.id, user.id));

      // If death found, create verification event
      if (result.found && result.confidence > 0.6) {
        await this.handleDeathFound(user, result);
      }
    } catch (error: any) {
      logError(error, { userId: user.id, source: "ssdi_check" });
      throw error;
    }
  }

  /**
   * Query SSDI provider API
   */
  private async querySSDIProvider(user: any): Promise<{
    found: boolean;
    data: any;
    confidence: number;
  }> {
    if (!SSDI_PROVIDERS.primary.apiKey) {
      logWarn("SSDI API key not configured, skipping check");
      return { found: false, data: null, confidence: 0 };
    }

    try {
      // Extract first and last name
      const nameParts = (user.full_name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(-1)[0] || "";

      const response = await axios.post(
        `${SSDI_PROVIDERS.primary.api}/search`,
        {
          firstName,
          lastName,
          birthDate: user.date_of_birth,
          // Note: In production, you'd decrypt SSN here if stored encrypted
          // For now, using name + DOB matching
        },
        {
          headers: {
            Authorization: `Bearer ${SSDI_PROVIDERS.primary.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const matches = response.data?.matches || [];

      if (matches.length > 0) {
        const match = matches[0];
        return {
          found: true,
          data: match,
          confidence: this.calculateConfidence(user, match),
        };
      }

      return { found: false, data: null, confidence: 0 };
    } catch (error: any) {
      logError(error, { userId: user.id, source: "ssdi_api_query" });
      return { found: false, data: null, confidence: 0 };
    }
  }

  /**
   * Calculate confidence score for match
   */
  private calculateConfidence(user: any, match: any): number {
    if (!match) return 0;

    let score = 0;

    // Name match (0.4 weight)
    if (this.namesMatch(user.full_name, match.name)) {
      score += 0.4;
    }

    // DOB match (0.4 weight)
    if (user.date_of_birth && match.birthDate) {
      const userDOB = new Date(user.date_of_birth).toISOString().split("T")[0];
      const matchDOB = new Date(match.birthDate).toISOString().split("T")[0];
      if (userDOB === matchDOB) {
        score += 0.4;
      }
    }

    // Location match (0.2 weight)
    if (this.locationsMatch(user.last_known_location, match.lastResidence)) {
      score += 0.2;
    }

    return score;
  }

  /**
   * Handle death found - create verification event
   */
  private async handleDeathFound(user: any, result: any): Promise<void> {
    logWarn(`Death match found for user ${user.id}`, {
      userId: user.id,
      confidence: result.confidence,
    });

    // Create verification event
    const event = await db.insert(deathVerificationEvents).values({
      userId: user.id,
      source: "ssdi" as any,
      confidenceScore: result.confidence.toFixed(2),
      verificationData: result.data,
      reportedDeathDate: result.data?.deathDate
        ? new Date(result.data.deathDate)
        : null,
      reportedLocation: result.data?.deathLocation || null,
      status: result.confidence > 0.8 ? ("pending" as any) : ("needs_confirmation" as any),
      requiresReview: result.confidence < 0.8,
      verifiedBy: SSDI_PROVIDERS.primary.name,
    });

    // Trigger secondary verification
    await this.triggerSecondaryVerification(user.id, event.id);

    // Send alerts
    await this.sendDeathAlerts(user, result);
  }

  /**
   * Trigger additional verification methods
   */
  private async triggerSecondaryVerification(userId: string, eventId: string): Promise<void> {
    // This would trigger obituary search and death certificate lookup
    // Implemented in separate services
    logInfo("Triggering secondary verification", { userId, eventId });

    // TODO: Queue obituary search
    // TODO: Queue death certificate lookup
    // TODO: Send proof of life challenge
  }

  /**
   * Send death alerts
   */
  private async sendDeathAlerts(user: any, result: any): Promise<void> {
    // Send alerts to beneficiaries and guardians
    logInfo("Sending death alerts", { userId: user.id });
    // TODO: Implement notification system
  }

  /**
   * Helper: Check if names match (fuzzy)
   */
  private namesMatch(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z]/g, "");
    return normalize(name1) === normalize(name2);
  }

  /**
   * Helper: Check if locations match
   */
  private locationsMatch(loc1: string | null, loc2: string | null): boolean {
    if (!loc1 || !loc2) return false;
    const getState = (loc: string) => {
      const parts = loc.split(",");
      return parts[parts.length - 1]?.trim() || "";
    };
    return getState(loc1).toUpperCase() === getState(loc2).toUpperCase();
  }

  /**
   * Helper: Sleep for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new SSDIMonitorService();

