/**
 * Tier-based subscription limits for GuardiaVault plans
 * Enforces wallet, guardian, and beneficiary limits based on user's subscription plan
 */

import type { IStorage } from "../storage";

export interface TierLimits {
  maxVaults: number;
  maxGuardians: number;
  maxBeneficiaries: number;
  features: {
    multiWalletSupport: boolean;
    smartWillBuilder: boolean;
    priorityRecovery: boolean;
    yieldVaults: boolean;
  };
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  // Starter Plan - $9.99/mo
  "Starter": {
    maxVaults: 1,
    maxGuardians: 3,
    maxBeneficiaries: 1,
    features: {
      multiWalletSupport: false,
      smartWillBuilder: false,
      priorityRecovery: false,
      yieldVaults: false,
    },
  },

  // Guardian+ Plan - $29.99/mo
  "Guardian+": {
    maxVaults: 1,
    maxGuardians: 3,
    maxBeneficiaries: 3,
    features: {
      multiWalletSupport: false,
      smartWillBuilder: false,
      priorityRecovery: false,
      yieldVaults: false,
    },
  },

  // Vault Pro Plan - $49.99/mo
  "Vault Pro": {
    maxVaults: 999, // Unlimited
    maxGuardians: 5,
    maxBeneficiaries: 5,
    features: {
      multiWalletSupport: true,
      smartWillBuilder: true,
      priorityRecovery: true,
      yieldVaults: true,
    },
  },

  // Free tier (for users without subscription)
  "Free": {
    maxVaults: 0,
    maxGuardians: 0,
    maxBeneficiaries: 0,
    features: {
      multiWalletSupport: false,
      smartWillBuilder: false,
      priorityRecovery: false,
      yieldVaults: false,
    },
  },
};

/**
 * Get tier limits for a given plan
 */
export function getTierLimits(plan: string | null | undefined): TierLimits {
  if (!plan) {
    return TIER_LIMITS["Free"];
  }

  return TIER_LIMITS[plan] || TIER_LIMITS["Free"];
}

/**
 * Check if a feature is available for a given plan
 */
export function hasFeature(
  plan: string | null | undefined,
  feature: keyof TierLimits["features"]
): boolean {
  const limits = getTierLimits(plan);
  return limits.features[feature];
}

/**
 * Get a user-friendly upgrade message
 */
export function getUpgradeMessage(plan: string | null | undefined, limitType: "vaults" | "guardians" | "beneficiaries"): string {
  const currentPlan = plan || "Free";

  const messages = {
    vaults: {
      "Free": "Subscribe to create vaults. Start with the Starter plan!",
      "Starter": "Upgrade to Vault Pro for unlimited wallets!",
      "Guardian+": "Upgrade to Vault Pro for multi-wallet support!",
      "Vault Pro": "You have unlimited vaults!",
    },
    guardians: {
      "Free": "Subscribe to add guardians. Start with the Starter plan!",
      "Starter": `You've reached the maximum of 3 guardians on the Starter plan. Upgrade to Vault Pro for up to 5 guardians!`,
      "Guardian+": `You've reached the maximum of 3 guardians on the Guardian+ plan. Upgrade to Vault Pro for up to 5 guardians!`,
      "Vault Pro": `You've reached the maximum of 5 guardians on the Vault Pro plan.`,
    },
    beneficiaries: {
      "Free": "Subscribe to add beneficiaries. Start with the Starter plan!",
      "Starter": "You've reached the maximum of 1 beneficiary on the Starter plan. Upgrade to Guardian+ or Vault Pro for more beneficiaries!",
      "Guardian+": "You've reached the maximum of 3 beneficiaries on the Guardian+ plan. Upgrade to Vault Pro for up to 5 beneficiaries!",
      "Vault Pro": "You've reached the maximum of 5 beneficiaries on the Vault Pro plan.",
    },
  };

  return messages[limitType][currentPlan] || `Upgrade your plan to increase your ${limitType} limit.`;
}

/**
 * Check if user can create another vault based on their tier
 */
export async function canCreateVault(storage: IStorage, userId: string): Promise<{ allowed: boolean; message?: string; plan?: string }> {
  // Get user's active subscription
  const subscription = await storage.getActiveSubscription(userId);
  const plan = subscription?.plan || "Free";
  const limits = getTierLimits(plan);

  // Get user's current vault count
  const vaults = await storage.getVaultsByOwner(userId);
  const currentVaultCount = vaults.length;

  if (currentVaultCount >= limits.maxVaults) {
    return {
      allowed: false,
      message: getUpgradeMessage(plan, "vaults"),
      plan,
    };
  }

  return { allowed: true, plan };
}

/**
 * Check if guardians/beneficiaries count is within tier limits
 */
export function checkPartyLimits(
  plan: string | null | undefined,
  guardianCount: number,
  beneficiaryCount: number
): { allowed: boolean; message?: string } {
  const limits = getTierLimits(plan);

  if (guardianCount > limits.maxGuardians) {
    return {
      allowed: false,
      message: `Your ${plan || "Free"} plan allows a maximum of ${limits.maxGuardians} guardians. You tried to add ${guardianCount}. ${getUpgradeMessage(plan, "guardians")}`,
    };
  }

  if (beneficiaryCount > limits.maxBeneficiaries) {
    return {
      allowed: false,
      message: `Your ${plan || "Free"} plan allows a maximum of ${limits.maxBeneficiaries} ${limits.maxBeneficiaries === 1 ? "beneficiary" : "beneficiaries"}. You tried to add ${beneficiaryCount}. ${getUpgradeMessage(plan, "beneficiaries")}`,
    };
  }

  return { allowed: true };
}
