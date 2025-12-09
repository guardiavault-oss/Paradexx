/**
 * Death Verification Cron Jobs
 * Scheduled tasks for SSDI monitoring and obituary searching
 */

import cron from "node-cron";
import { logInfo, logError } from "../services/logger";

/**
 * SSDI Daily Check Job
 * Runs daily at 2 AM to check SSDI for user deaths
 */
export function startSSDIMonitoringCron() {
  // Run daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    logInfo("🕐 Starting SSDI monitoring job...");

    try {
      const { default: ssdiMonitor } = await import("../services/ssdiMonitor");
      await ssdiMonitor.runDailyCheck();

      logInfo("✅ SSDI monitoring job completed");
    } catch (error: any) {
      logError(error, { source: "ssdi_cron_job" });
    }
  });

  logInfo("✅ SSDI monitoring cron job scheduled (daily at 2 AM)");
}

/**
 * Obituary Search Job
 * Runs every 6 hours to search for obituaries for pending death verifications
 */
export function startObituarySearchCron() {
  // Run every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    logInfo("🔍 Starting obituary search job...");

    try {
      const { default: obituaryScraper } = await import("../services/obituaryScraper");
      const { db } = await import("../db");
      const { deathVerificationEvents } = await import("../../shared/schema.death-verification");
      const { eq, and } = await import("drizzle-orm");

      // Get pending death verification events that need obituary search
      try {
        const pendingEvents = await db
          .select()
          .from(deathVerificationEvents)
          .where(
            and(
              eq(deathVerificationEvents.source, "ssdi" as any),
              eq(deathVerificationEvents.status, "pending" as any)
            )
          )
          .limit(100); // Process 100 at a time

        logInfo(`Found ${pendingEvents.length} pending SSDI events to verify`);

        for (const event of pendingEvents) {
          try {
            // Get user info (would need to join with users table)
            // For now, use data from verification event
            const verificationData = event.verificationData as any;

            if (verificationData && event.userId) {
              // Search obituaries
              const obituaries = await obituaryScraper.searchObituary({
                id: event.userId,
                full_name: verificationData.name || "",
                date_of_birth: verificationData.birthDate || null,
                last_known_location: event.reportedLocation || null,
              });

              // Store high-confidence matches
              for (const obit of obituaries) {
                if (obit.matchScore > 0.7) {
                  await obituaryScraper.storeVerificationEvent(
                    event.userId,
                    obit,
                    obit.source
                  );
                }
              }
            }
          } catch (error: any) {
            logError(error, {
              eventId: event.id,
              userId: event.userId,
              source: "obituary_search",
            });
          }
        }
      } catch (error: any) {
        logError(error, { source: "obituary_search_query" });
      }

      logInfo("✅ Obituary search job completed");
    } catch (error: any) {
      logError(error, { source: "obituary_cron_job" });
    }
  });

  logInfo("✅ Obituary search cron job scheduled (every 6 hours)");
}

/**
 * Consensus Check Job
 * Runs hourly to check for consensus on pending death verifications
 */
export function startConsensusCheckCron() {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    logInfo("🤝 Starting consensus check job...");

    try {
      const { default: consensusEngine } = await import("../services/deathConsensusEngine");
      const { db } = await import("../db");
      const { deathVerificationEvents } = await import("../../shared/schema.death-verification");
      const { eq } = await import("drizzle-orm");

      // Get unique users with pending verification events
      try {
        const events = await db
          .select({
            userId: deathVerificationEvents.userId,
          })
          .from(deathVerificationEvents)
          .where(eq(deathVerificationEvents.status, "pending" as any));

        const uniqueUserIds = Array.from(
          new Set(events.map((e: any) => e.userId as string))
        );

        logInfo(`Checking consensus for ${uniqueUserIds.length} users`);

        for (const userId of uniqueUserIds) {
          try {
            await consensusEngine.checkConsensus(userId as string);
          } catch (error: any) {
            logError(error, { userId: userId as string, source: "consensus_check" });
          }
        }
      } catch (error: any) {
        logError(error, { source: "consensus_check_query" });
      }

      logInfo("✅ Consensus check job completed");
    } catch (error: any) {
      logError(error, { source: "consensus_cron_job" });
    }
  });

  logInfo("✅ Consensus check cron job scheduled (every hour)");
}

/**
 * Initialize all death verification cron jobs
 */
export function startDeathVerificationCrons() {
  startSSDIMonitoringCron();
  startObituarySearchCron();
  startConsensusCheckCron();

  logInfo("✅ All death verification cron jobs initialized");
}

