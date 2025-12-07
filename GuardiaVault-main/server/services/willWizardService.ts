/**
 * Smart Will Wizard Service
 * Manages wizard state, validation, and finalization
 */

import { db } from "../db";
import { 
  wills, 
  willBeneficiaries, 
  willGuardians, 
  willTriggers, 
  willAssetAllowances,
  willWizardState,
  type InsertWill,
  type InsertWillBeneficiary,
  type InsertWillGuardian,
  type InsertWillTrigger,
  type InsertWillAssetAllowance,
} from "@shared/schema";
import { eq } from "../utils/drizzle-exports";
import { encryptWizardState, decryptWizardState } from "./wizardEncryption";
import { logInfo, logError } from "./logger";
import { initializeWillOnChain } from "./smartWillContract";

export interface WizardState {
  step: number;
  // Step 1: User Profile
  userProfile?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
  };
  // Step 2: Beneficiaries
  beneficiaries?: Array<{
    address: string;
    name?: string;
    email?: string;
    phone?: string;
    percent: number;
    tokenAddress?: string;
    isNftOnly?: boolean;
    isCharityDao?: boolean;
  }>;
  // Step 3: Guardians
  guardians?: Array<{
    type: "email" | "wallet";
    identifier: string; // Email or wallet address
    walletAddress?: string;
    verified?: boolean;
  }>;
  guardianThreshold?: number; // M-of-N threshold
  // Step 4: Assets
  assets?: Array<{
    tokenAddress: string;
    tokenSymbol?: string;
    tokenName?: string;
    spenderAddress: string;
    allowanceAmount?: string;
    network?: string;
  }>;
  // Step 5: Triggers
  triggers?: {
    type: "time_lock" | "death_oracle" | "multisig_recovery" | "manual";
    // Time-lock
    checkInIntervalDays?: number;
    gracePeriodDays?: number;
    // Death oracle
    deathOracleAddress?: string;
    requiredConfidenceScore?: number;
    // Multi-sig recovery
    recoveryContractAddress?: string;
    recoveryKeys?: string[];
    threshold?: number;
    // Manual
    executorAddress?: string;
  };
}

/**
 * Save wizard state (encrypted)
 */
export async function saveWizardState(userId: string, state: WizardState): Promise<void> {
  try {
    const encryptedState = encryptWizardState(state);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check if state exists
    const existing = await db
      .select()
      .from(willWizardState)
      .where(eq(willWizardState.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing state
      await db
        .update(willWizardState)
        .set({
          encryptedState,
          currentStep: state.step,
          updatedAt: new Date(),
          expiresAt,
        })
        .where(eq(willWizardState.userId, userId));
    } else {
      // Create new state
      await db.insert(willWizardState).values({
        userId,
        encryptedState,
        currentStep: state.step,
        expiresAt,
      });
    }

    logInfo("Wizard state saved", { userId, step: state.step });
  } catch (error) {
    logError(error as Error, { context: "save_wizard_state", userId });
    throw error;
  }
}

/**
 * Load wizard state (decrypted)
 */
export async function loadWizardState(userId: string): Promise<WizardState | null> {
  try {
    const result = await db
      .select()
      .from(willWizardState)
      .where(eq(willWizardState.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const state = decryptWizardState(result[0].encryptedState);
    return { ...state, step: result[0].currentStep || 1 };
  } catch (error) {
    logError(error as Error, { context: "load_wizard_state", userId });
    return null;
  }
}

/**
 * Clear wizard state
 */
export async function clearWizardState(userId: string): Promise<void> {
  try {
    await db.delete(willWizardState).where(eq(willWizardState.userId, userId));
    logInfo("Wizard state cleared", { userId });
  } catch (error) {
    logError(error as Error, { context: "clear_wizard_state", userId });
    throw error;
  }
}

/**
 * Finalize will from wizard state
 */
export async function finalizeWillFromWizard(
  userId: string,
  state: WizardState
): Promise<{ willId: string; contractAddress?: string; txHash?: string }> {
  try {
    // Validate state
    if (!state.userProfile) {
      throw new Error("User profile is required");
    }
    if (!state.beneficiaries || state.beneficiaries.length === 0) {
      throw new Error("At least one beneficiary is required");
    }
    if (state.beneficiaries.reduce((sum, b) => sum + b.percent, 0) !== 100) {
      throw new Error("Beneficiary percentages must total 100%");
    }
    if (!state.triggers) {
      throw new Error("Trigger conditions are required");
    }

    // Create will record
    const [will] = await db
      .insert(wills)
      .values({
        userId,
        status: "draft",
      })
      .returning();

    const willId = will.id;

    // Insert beneficiaries
    if (state.beneficiaries) {
      const beneficiaryInserts: InsertWillBeneficiary[] = state.beneficiaries.map((b) => ({
        willId,
        address: b.address,
        name: b.name,
        email: b.email,
        phone: b.phone,
        percent: b.percent,
        tokenAddress: b.tokenAddress,
        isNftOnly: b.isNftOnly || false,
        isCharityDao: b.isCharityDao || false,
      }));
      await db.insert(willBeneficiaries).values(beneficiaryInserts);
    }

    // Insert guardians
    if (state.guardians && state.guardians.length > 0) {
      const guardianInserts: InsertWillGuardian[] = state.guardians.map((g) => ({
        willId,
        guardianType: g.type,
        identifier: g.identifier,
        walletAddress: g.walletAddress || (g.type === "wallet" ? g.identifier : null),
        verified: g.verified || false,
      }));
      await db.insert(willGuardians).values(guardianInserts);
    }

    // Insert trigger
    if (state.triggers) {
      const triggerInsert: InsertWillTrigger = {
        willId,
        triggerType: state.triggers.type,
        checkInIntervalDays: state.triggers.checkInIntervalDays,
        gracePeriodDays: state.triggers.gracePeriodDays,
        deathOracleAddress: state.triggers.deathOracleAddress,
        requiredConfidenceScore: state.triggers.requiredConfidenceScore?.toString(),
        recoveryContractAddress: state.triggers.recoveryContractAddress,
        recoveryKeys: state.triggers.recoveryKeys ? JSON.stringify(state.triggers.recoveryKeys) : null,
        threshold: state.triggers.threshold,
        executorAddress: state.triggers.executorAddress,
      };
      await db.insert(willTriggers).values(triggerInsert);
    }

    // Insert assets
    if (state.assets && state.assets.length > 0) {
      const assetInserts: InsertWillAssetAllowance[] = state.assets.map((a) => ({
        willId,
        tokenAddress: a.tokenAddress,
        tokenSymbol: a.tokenSymbol,
        tokenName: a.tokenName,
        spenderAddress: a.spenderAddress,
        allowanceAmount: a.allowanceAmount,
        network: a.network || "ethereum",
      }));
      await db.insert(willAssetAllowances).values(assetInserts);
    }

    // Update wizard state with will ID
    await db
      .update(willWizardState)
      .set({ willId })
      .where(eq(willWizardState.userId, userId));

    logInfo("Will finalized from wizard", { userId, willId });

    // Optional: Deploy on-chain if requested
    let contractAddress: string | undefined;
    let txHash: string | undefined;
    let contractWillId: number | undefined;

    if (deployOnChain && state.beneficiaries && state.beneficiaries.length > 0) {
      try {
        // Prepare contract parameters
        const recipients = state.beneficiaries.map((b) => b.address);
        const percentages = state.beneficiaries.map((b) => b.percent * 100); // Convert to basis points
        const nftOnlyFlags = state.beneficiaries.map((b) => b.isNftOnly || false);
        const tokenAddresses = state.beneficiaries.map((b) => b.tokenAddress || "0x0000000000000000000000000000000000000000");
        const charityDAOFlags = state.beneficiaries.map((b) => b.isCharityDao || false);
        
        const metadataHash = `will_${willId}_${Date.now()}`;
        const requiresGuardianAttestation = (state.guardians && state.guardians.length > 0) || false;
        const guardians = state.guardians?.map((g) => g.walletAddress || g.identifier).filter(Boolean) || [];
        const guardianThreshold = state.guardianThreshold || (guardians.length > 0 ? Math.ceil(guardians.length / 2) : 0);

        const deploymentResult = await initializeWillOnChain({
          recipients,
          percentages,
          nftOnlyFlags,
          tokenAddresses,
          charityDAOFlags,
          metadataHash,
          requiresGuardianAttestation,
          guardians,
          guardianThreshold,
        });

        contractAddress = deploymentResult.contractAddress;
        txHash = deploymentResult.transactionHash;
        contractWillId = deploymentResult.willId;

        // Update will record with on-chain info
        await db
          .update(wills)
          .set({
            contractAddress,
            contractWillId,
            deploymentTxHash: txHash,
            status: "active",
            finalizedAt: new Date(),
          })
          .where(eq(wills.id, willId));

        logInfo("Will deployed on-chain", { userId, willId, contractAddress, txHash });
      } catch (error) {
        logError(error as Error, { context: "onchain_deployment", userId, willId });
        // Don't fail finalization if on-chain deployment fails
        // Will can still be finalized and deployed later
      }
    }

    return { willId, contractAddress, txHash };
  } catch (error) {
    logError(error as Error, { context: "finalize_will_from_wizard", userId });
    throw error;
  }
}

