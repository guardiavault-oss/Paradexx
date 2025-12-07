/**
 * Vault Death Verification Monitor
 * 
 * Monitors vaults that enter Warning or Triggered states
 * and flags them for death verification via Chainlink oracle
 */

import { storage } from "../storage";
import { vaults } from "../../shared/schema";
import { eq, and, or, lt } from "../utils/drizzle-exports";
import { db } from "../db";
import { chainlinkDeathOracle } from "./chainlinkDeathOracle";
import { logInfo, logError, logWarn } from "./logger";

export class VaultDeathVerificationMonitor {
  /**
   * Check all vaults and flag any in Warning/Triggered states for verification
   */
  async checkAndFlagVaults(): Promise<void> {
    try {
      logInfo("Checking vaults for death verification");

      // Get all vaults in warning or triggered state
      const flaggedVaults = await db
        .select()
        .from(vaults)
        .where(
          or(
            eq(vaults.status, "warning" as any),
            eq(vaults.status, "triggered" as any)
          )
        );

      logInfo("Found vaults to check", { count: flaggedVaults.length });

      for (const vault of flaggedVaults) {
        try {
          // Get vault owner
          const owner = await storage.getUser(vault.ownerId);
          if (!owner) {
            logWarn("Vault owner not found", { vaultId: vault.id });
            continue;
          }

          // Check if already verified
          // In production, you'd check the on-chain death verification status
          // For now, we'll flag it if it's been in warning/triggered for > 7 days
          const daysInState = this.getDaysInState(vault);
          
          if (daysInState >= 7) {
            logInfo("Flagging vault for death verification", {
              vaultId: vault.id,
              ownerId: vault.ownerId,
              status: vault.status,
              daysInState,
            });

            // Get user's wallet address if available
            // Note: This assumes users have wallet addresses stored
            // In production, you might need to add a walletAddress column
            const userAddress = await this.getUserWalletAddress(vault.ownerId);

            if (userAddress) {
              await chainlinkDeathOracle.flagVaultForVerification(
                parseInt(vault.id),
                userAddress
              );
            } else {
              logWarn("User wallet address not found", {
                vaultId: vault.id,
                ownerId: vault.ownerId,
              });
            }
          }
        } catch (error: any) {
          logError(error, {
            vaultId: vault.id,
            type: "flag_vault_error",
          });
        }
      }
    } catch (error: any) {
      logError(error, { type: "check_and_flag_vaults" });
    }
  }

  /**
   * Get number of days vault has been in current state
   */
  private getDaysInState(vault: any): number {
    // If vault has updatedAt, use that
    if (vault.updatedAt) {
      const updated = new Date(vault.updatedAt);
      const now = new Date();
      const diffMs = now.getTime() - updated.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Otherwise, use createdAt as fallback
    if (vault.createdAt) {
      const created = new Date(vault.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return 0;
  }

  /**
   * Get user's wallet address
   * In production, this would query the users table for walletAddress
   */
  private async getUserWalletAddress(userId: string): Promise<string | null> {
    try {
      // For now, we'll try to find the wallet address from the database
      // In production, you'd add a walletAddress column to users table
      // or maintain a separate mapping

      // Check if user has a connected wallet (if you store this)
      // This is a placeholder - implement based on your actual user schema
      const user = await storage.getUser(userId);
      
      // If you store wallet addresses, return it here
      // For now, return null to indicate we need to add this functionality
      return null;
    } catch (error: any) {
      logError(error, { userId, type: "get_wallet_address" });
      return null;
    }
  }

  /**
   * Manually flag a specific vault for verification
   */
  async flagVault(vaultId: string, userAddress: string): Promise<void> {
    logInfo("Manually flagging vault for verification", { vaultId, userAddress });
    
    await chainlinkDeathOracle.flagVaultForVerification(
      parseInt(vaultId),
      userAddress
    );
  }
}

// Export singleton instance
export const vaultDeathVerificationMonitor = new VaultDeathVerificationMonitor();
export default vaultDeathVerificationMonitor;






