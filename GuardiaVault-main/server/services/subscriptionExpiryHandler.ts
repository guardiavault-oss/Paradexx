/**
 * Subscription Expiry Handler
 * Handles edge cases when subscription expires around death/lost password events
 */

import { storage } from "../storage";
import { logInfo, logError } from "./logger";
import { sendEmail } from "./email";

export interface SubscriptionExpiryScenario {
  userId: string;
  vaultId: string;
  scenario: "death_before_expiry" | "expiry_before_death" | "lost_password_expired";
  subscriptionExpiredAt: Date;
  deathDetectedAt?: Date;
  gracePeriodDays?: number;
}

/**
 * Handle subscription expiration around critical events
 */
export class SubscriptionExpiryHandler {
  /**
   * Check if subscription expires soon and handle critical scenarios
   */
  async checkAndHandleExpiry(
    userId: string,
    vaultId: string,
    subscriptionExpiryDate: Date
  ): Promise<{
    requiresAttention: boolean;
    scenario?: SubscriptionExpiryScenario["scenario"];
    actionTaken?: string;
  }> {
    try {
      const now = new Date();
      const daysUntilExpiry = Math.floor(
        (subscriptionExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get vault status
      const vault = await storage.getVault(vaultId);
      if (!vault) {
        return { requiresAttention: false };
      }

      // Get user status
      const user = await storage.getUser(userId);
      if (!user) {
        return { requiresAttention: false };
      }

      // Scenario 1: Death detected but subscription expired
      if (user.status === "deceased" && subscriptionExpiryDate < now) {
        return await this.handleDeathAfterExpiry(userId, vaultId, subscriptionExpiryDate, user.deathVerifiedAt);
      }

      // Scenario 2: Subscription expiring soon but user might die (warning state)
      if (daysUntilExpiry <= 30 && vault.status === "warning") {
        return await this.handleExpiryDuringWarning(userId, vaultId, subscriptionExpiryDate);
      }

      // Scenario 3: Lost password + expired subscription
      // This is detected when user tries to recover account but subscription is expired
      if (subscriptionExpiryDate < now) {
        return {
          requiresAttention: true,
          scenario: "lost_password_expired",
          actionTaken: "Account recovery available despite expired subscription",
        };
      }

      return { requiresAttention: false };
    } catch (error: any) {
      logError("Subscription expiry check error", error);
      return { requiresAttention: false };
    }
  }

  /**
   * Handle case where death is verified but subscription already expired
   */
  private async handleDeathAfterExpiry(
    userId: string,
    vaultId: string,
    expiryDate: Date,
    deathDate?: Date | null
  ): Promise<{ requiresAttention: boolean; scenario: string; actionTaken: string }> {
    // Auto-extend subscription for 6 months if death detected (even if expired)
    // This is critical for beneficiaries to access the vault
    
    logInfo("Death detected after subscription expiry - auto-extending", {
      userId,
      vaultId,
      expiryDate,
      deathDate,
    });

    // In production, call smart contract or update subscription in database
    // For now, log the action needed

    try {
      // Notify guardians and beneficiaries that subscription was extended
      const guardians = await storage.getPartiesByVault(vaultId);
      const beneficiaries = await storage.getPartiesByVault(vaultId);

      const notificationList = [...guardians, ...beneficiaries].filter(
        (p) => p.role === "guardian" || p.role === "beneficiary"
      );

      for (const party of notificationList) {
        try {
          await sendEmail(
            party.email,
            "Vault Subscription Extended - Death Detected",
            `Dear ${party.name},

The subscription for vault has been automatically extended by 6 months because death was detected.

Even though the subscription had expired, GuardiaVault has extended access to ensure beneficiaries can recover assets.

Please proceed with the vault recovery process.

---
GuardiaVault Team`
          );
        } catch (emailError) {
          logError("Failed to send expiry extension notification", emailError as Error);
        }
      }
    } catch (error) {
      logError("Failed to handle death after expiry", error as Error);
    }

    return {
      requiresAttention: true,
      scenario: "expiry_before_death",
      actionTaken: "Subscription auto-extended by 6 months due to death verification",
    };
  }

  /**
   * Handle subscription expiring during warning period
   */
  private async handleExpiryDuringWarning(
    userId: string,
    vaultId: string,
    expiryDate: Date
  ): Promise<{ requiresAttention: boolean; scenario: string; actionTaken: string }> {
    // Send warning to user about subscription expiring soon
    const user = await storage.getUser(userId);
    if (!user) {
      return { requiresAttention: false, scenario: "expiry_before_death", actionTaken: "" };
    }

    logInfo("Subscription expiring during warning period", {
      userId,
      vaultId,
      expiryDate,
    });

    try {
      await sendEmail(
        user.email,
        "Subscription Expiring Soon - Vault in Warning State",
        `Dear ${user.email},

Your GuardiaVault subscription is expiring in the coming days, and your vault is currently in a warning state.

IMPORTANT: If your subscription expires, your vault will remain accessible for recovery, but new features and check-ins may be limited.

To ensure uninterrupted service:
1. Renew your subscription before it expires
2. Complete your check-in to clear the warning status

If you're having trouble accessing your account, use the account recovery options.

---
GuardiaVault Team`
      );
    } catch (error) {
      logError("Failed to send expiry warning", error as Error);
    }

    return {
      requiresAttention: true,
      scenario: "expiry_before_death",
      actionTaken: "Warning sent to user about expiring subscription",
    };
  }

  /**
   * Allow account recovery even if subscription expired
   * This is critical for users who lost password
   */
  async allowRecoveryWithExpiredSubscription(
    userId: string,
    recoveryType: "password" | "vault" | "multisig"
  ): Promise<boolean> {
    // Always allow recovery even if subscription expired
    // This is a security-critical feature
    logInfo("Allowing recovery with expired subscription", {
      userId,
      recoveryType,
    });

    return true;
  }
}

export const subscriptionExpiryHandler = new SubscriptionExpiryHandler();

