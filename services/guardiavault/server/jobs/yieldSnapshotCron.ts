/**
 * Yield Snapshot Cron Job
 * Records yield analytics snapshots periodically
 */

import { enhancedYieldService } from "../services/enhancedYieldService";
import { yieldService } from "../services/yieldService";
import { achievementService } from "../services/achievementService";
import { db } from "../db";
import { yieldVaults } from "@shared/schema";
import { eq } from "../utils/drizzle-exports";
import { logInfo, logError } from "../services/logger";

/**
 * Record yield snapshot for all active vaults
 */
export async function recordYieldSnapshots() {
  try {
    logInfo("Starting yield snapshot recording", {});

    // Get all active yield vaults
    if (!db) {
      logWarn("Database not available, skipping yield snapshot recording");
      return;
    }
    const vaults = await db.select().from(yieldVaults);

    for (const vault of vaults) {
      try {
        // Get current vault value from protocol
        const positions = await yieldService.getUserPositions(vault.userId);

        const position = positions.find(
          (p) => p.vaultId === vault.id
        );

        if (!position) {
          continue;
        }

        // Record snapshot
        await enhancedYieldService.recordYieldSnapshot(
          vault.userId,
          vault.id,
          position.protocol.toLowerCase(),
          position.asset,
          position.principal.toString(),
          position.currentValue.toString(),
          position.yieldEarned.toString(),
          position.apy,
          "api"
        );

        // Check yield milestone achievements
        await achievementService.checkYieldMilestones(
          vault.userId,
          position.yieldEarned.toString()
        );

        // Check long-term holder achievements
        await achievementService.checkLongTermHolderAchievements(vault.userId);

        logInfo("Yield snapshot recorded", {
          vaultId: vault.id,
          userId: vault.userId,
          apy: position.apy,
        });
      } catch (error) {
        logError(error as Error, {
          context: "recordYieldSnapshot",
          vaultId: vault.id,
        });
        // Continue with other vaults
      }
    }

    logInfo("Yield snapshot recording completed", {
      totalVaults: vaults.length,
    });
  } catch (error) {
    logError(error as Error, { context: "recordYieldSnapshots" });
  }
}

/**
 * Start cron job (runs every hour)
 */
export function startYieldSnapshotCron() {
  // Run immediately
  recordYieldSnapshots();

  // Then run every hour
  setInterval(() => {
    recordYieldSnapshots();
  }, 60 * 60 * 1000);

  logInfo("Yield snapshot cron job started", {
    interval: "1 hour",
  });
}

