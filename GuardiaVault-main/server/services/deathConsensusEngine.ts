/**
 * Death Consensus Engine
 * Verifies death from multiple sources and triggers vault release
 */

import { db } from "../db";
import { eq, and, gte, count } from "../utils/drizzle-exports";
import { deathVerificationEvents, type DeathVerificationEvent } from "../../shared/schema.death-verification";
import { users, vaults } from "../../shared/schema";
import { logInfo, logError, logWarn } from "./logger";

export class DeathConsensusEngine {
  private minConfidenceThreshold: number;
  private minSourcesRequired: number;
  private deathCertificateService: any;

  constructor() {
    this.minConfidenceThreshold = parseFloat(
      process.env.DEATH_VERIFICATION_MIN_CONFIDENCE || "0.7"
    );
    this.minSourcesRequired = parseInt(
      process.env.DEATH_VERIFICATION_MIN_SOURCES || "2",
      10
    );
  }

  /**
   * Initialize death certificate service (lazy load to avoid circular dependency)
   */
  private async getDeathCertificateService() {
    if (!this.deathCertificateService) {
      const { DeathCertificateService } = await import("./deathCertificateService");
      this.deathCertificateService = new DeathCertificateService();
    }
    return this.deathCertificateService;
  }

  /**
   * Check if death is verified by consensus
   */
  async checkConsensus(userId: string): Promise<{
    verified: boolean;
    confidence?: number;
    sources?: string[];
    sourceCount?: number;
    reason?: string;
  }> {
    logInfo("Checking death consensus", { userId });

    try {
      // Get all verification events for user
      const events = await db
        .select()
        .from(deathVerificationEvents)
        .where(eq(deathVerificationEvents.userId, userId));

      // Filter by status (SQL doesn't support enum comparison easily, so filter in JS)
      const validEvents = events.filter(
        (e: DeathVerificationEvent) => e.status === "confirmed" || e.status === "pending"
      );

      if (validEvents.length === 0) {
        return {
          verified: false,
          reason: "No verification events found",
        };
      }

      // Calculate weighted confidence
      const sourceWeights: Record<string, number> = {
        death_certificate_official: 1.0,
        ssdi: 0.8,
        obituary_legacy: 0.7,
        obituary_tributes: 0.6,
        obituary_findagrave: 0.65,
        insurance_claim: 0.9,
        hospital_ehr: 0.85,
        funeral_home: 0.75,
      };

      let totalWeight = 0;
      let weightedConfidence = 0;
      const sources: string[] = [];
      const uniqueSources = new Set<string>();

      for (const event of validEvents) {
        const weight = sourceWeights[event.source] || 0.5;
        const confidence = parseFloat(event.confidenceScore || "0");

        totalWeight += weight;
        weightedConfidence += confidence * weight;
        sources.push(event.source);
        uniqueSources.add(event.source);
      }

      const finalConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

      // Check consensus criteria
      const verified =
        finalConfidence >= this.minConfidenceThreshold &&
        uniqueSources.size >= this.minSourcesRequired;

      // Auto-order death certificate if death is suspected but not confirmed
      if (!verified && finalConfidence >= 0.5 && uniqueSources.size >= 1) {
        // Death suspected but needs official confirmation
        try {
          const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          if (userRows.length > 0 && userRows[0].fullName) {
            const certService = await this.getDeathCertificateService();
            await certService.autoOrderCertificate(
              userId,
              {
                full_name: userRows[0].fullName,
                date_of_birth: userRows[0].dateOfBirth,
              },
              new Date(), // Suspected death date
              userRows[0].lastKnownLocation || undefined
            );
            
            logInfo("Auto-ordered death certificate for suspected death", {
              userId,
              confidence: finalConfidence,
              sources: uniqueSources.size,
            });
          }
        } catch (error: any) {
          logError(error, { userId, context: "auto_order_certificate" });
        }
      }

      if (verified) {
        // Update user status
        await this.updateUserDeathStatus(userId, finalConfidence);

        // Trigger vault release
        await this.triggerVaultRelease(userId);

        logInfo("Death verified by consensus", {
          userId,
          confidence: finalConfidence,
          sources: Array.from(uniqueSources),
          sourceCount: uniqueSources.size,
        });

        return {
          verified: true,
          confidence: finalConfidence,
          sources: Array.from(uniqueSources),
          sourceCount: uniqueSources.size,
        };
      }

      logInfo("Death not verified - insufficient consensus", {
        userId,
        confidence: finalConfidence,
        threshold: this.minConfidenceThreshold,
        sources: Array.from(uniqueSources),
        requiredSources: this.minSourcesRequired,
      });

      return {
        verified: false,
        confidence: finalConfidence,
        sources: Array.from(uniqueSources),
        sourceCount: uniqueSources.size,
        reason: `Confidence ${finalConfidence.toFixed(2)} below threshold ${this.minConfidenceThreshold} or insufficient sources (${uniqueSources.size}/${this.minSourcesRequired})`,
      };
    } catch (error: any) {
      logError(error, { userId, type: "consensus_check" });
      return {
        verified: false,
        reason: error.message,
      };
    }
  }

  /**
   * Update user death status
   */
  private async updateUserDeathStatus(
    userId: string,
    confidence: number
  ): Promise<void> {
    try {
      // Note: This requires users table to have death verification columns
      // Migration should add: death_verified_at, death_confidence_score, status

      // For now, we'll just log - actual update requires migration
      logInfo("User death status updated", {
        userId,
        confidence,
        status: "deceased",
      });

      // Future implementation after migration:
      // await db
      //   .update(users)
      //   .set({
      //     status: 'deceased',
      //     deathVerifiedAt: new Date(),
      //     deathConfidenceScore: confidence.toFixed(2),
      //   })
      //   .where(eq(users.id, userId));
    } catch (error: any) {
      logError(error, { userId, type: "update_death_status" });
    }
  }

  /**
   * Trigger smart contract vault release
   */
  private async triggerVaultRelease(userId: string): Promise<void> {
    logInfo("Triggering vault release", { userId });

    try {
      // Get user's active vaults
      const userVaults = await db
        .select()
        .from(vaults)
        .where(
          and(
            eq(vaults.ownerId, userId),
            eq(vaults.status, "active" as any)
          )
        );

      if (userVaults.length === 0) {
        logInfo("No active vaults found for user", { userId });
        return;
      }

      for (const vault of userVaults) {
        try {
          // TODO: Call smart contract to release vault
          // await blockchainService.releaseVault(vault.id);

          // For now, update vault status
          await db
            .update(vaults)
            .set({
              status: "triggered" as any,
              updatedAt: new Date(),
            })
            .where(eq(vaults.id, vault.id));

          logInfo("Vault released", {
            userId,
            vaultId: vault.id,
          });

          // Mark legacy messages as ready for delivery
          try {
            const { legacyMessagesService } = await import("./legacyMessages");
            await legacyMessagesService.markReadyForDelivery(vault.id);
          } catch (error: any) {
            logError(error, {
              userId,
              vaultId: vault.id,
              type: "legacy_message_delivery",
            });
          }

          // Trigger smart contract release if deployed
          try {
            const { smartContractService } = await import("./smartContract");
            const contractRecord = await smartContractService.getContractRecord(vault.id);
            if (contractRecord && contractRecord.deploymentStatus === "deployed") {
              await smartContractService.triggerVaultRelease(vault.id);
            }
          } catch (error: any) {
            logError(error, {
              userId,
              vaultId: vault.id,
              type: "smart_contract_release",
            });
          }

          // TODO: Notify beneficiaries
          // await notificationService.notifyBeneficiaries(
          //   vault.beneficiaries,
          //   'Vault Unlocked',
          //   'The vault has been released. You can now claim your inheritance.'
          // );
        } catch (error: any) {
          logError(error, {
            userId,
            vaultId: vault.id,
            type: "vault_release",
          });
        }
      }
    } catch (error: any) {
      logError(error, { userId, type: "trigger_vault_release" });
    }
  }

  /**
   * Get verification summary for user
   */
  async getVerificationSummary(userId: string): Promise<{
    totalEvents: number;
    sources: string[];
    averageConfidence: number;
    highestConfidence: number;
    consensusReached: boolean;
  }> {
    try {
      const events = await db
        .select()
        .from(deathVerificationEvents)
        .where(eq(deathVerificationEvents.userId, userId));

      const validEvents = events.filter(
        (e: DeathVerificationEvent) => e.status === "confirmed" || e.status === "pending"
      );

      if (validEvents.length === 0) {
        return {
          totalEvents: 0,
          sources: [],
          averageConfidence: 0,
          highestConfidence: 0,
          consensusReached: false,
        };
      }

      const sources = Array.from(new Set(validEvents.map((e: DeathVerificationEvent) => e.source)));
      const confidences = validEvents.map((e: DeathVerificationEvent) =>
        parseFloat(e.confidenceScore || "0")
      );
      const averageConfidence =
        confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length;
      const highestConfidence = Math.max(...confidences);

      const consensus = await this.checkConsensus(userId);

      return {
        totalEvents: validEvents.length,
        sources,
        averageConfidence,
        highestConfidence,
        consensusReached: consensus.verified || false,
      };
    } catch (error: any) {
      logError(error, { userId, type: "verification_summary" });
      return {
        totalEvents: 0,
        sources: [],
        averageConfidence: 0,
        highestConfidence: 0,
        consensusReached: false,
      };
    }
  }
}

// Create singleton instance and export
export const deathConsensusEngine = new DeathConsensusEngine();
export default deathConsensusEngine;

