/**
 * Recovery Metrics Service
 * Tracks recovery success rates, attempt statistics, and user recovery needs
 */

import { storage } from "../storage";
import { logInfo, logError } from "./logger";

export interface RecoveryAttempt {
  id: string;
  userId?: string;
  vaultId?: string;
  recoveryType: "vault" | "multisig" | "password";
  scheme: "2-of-3" | "3-of-5";
  fragmentsProvided: number;
  threshold: number;
  success: boolean;
  errorType?: string;
  createdAt: Date;
}

export interface RecoveryMetrics {
  totalAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  successRate: number; // percentage
  recoveryRate: number; // percentage of users who need recovery vs total users
  byScheme: {
    "2-of-3": {
      attempts: number;
      successes: number;
      successRate: number;
    };
    "3-of-5": {
      attempts: number;
      successes: number;
      successRate: number;
    };
  };
  byType: {
    vault: number;
    multisig: number;
    password: number;
  };
}

class RecoveryMetricsService {
  private attempts: RecoveryAttempt[] = [];

  /**
   * Record a recovery attempt
   */
  async recordAttempt(attempt: Omit<RecoveryAttempt, "id" | "createdAt">): Promise<void> {
    const record: RecoveryAttempt = {
      ...attempt,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.attempts.push(record);

    // In production, store in database
    logInfo("Recovery attempt recorded", {
      type: record.recoveryType,
      scheme: record.scheme,
      success: record.success,
      fragmentsProvided: record.fragmentsProvided,
      threshold: record.threshold,
    });

    if (!record.success && record.errorType) {
      logError("Recovery attempt failed", new Error(record.errorType), {
        type: record.recoveryType,
        scheme: record.scheme,
      });
    }
  }

  /**
   * Get recovery metrics
   */
  async getMetrics(): Promise<RecoveryMetrics> {
    const totalAttempts = this.attempts.length;
    const successfulRecoveries = this.attempts.filter((a) => a.success).length;
    const failedRecoveries = totalAttempts - successfulRecoveries;
    const successRate = totalAttempts > 0 ? (successfulRecoveries / totalAttempts) * 100 : 0;

    // Calculate recovery rate: users who attempted recovery / total users
    const uniqueUsersRecovered = new Set(
      this.attempts.filter((a) => a.userId).map((a) => a.userId)
    ).size;
    
    // TODO: Get total active users from database
    // For now, estimate based on attempts
    const estimatedTotalUsers = uniqueUsersRecovered * 10; // Rough estimate
    const recoveryRate = estimatedTotalUsers > 0 
      ? (uniqueUsersRecovered / estimatedTotalUsers) * 100 
      : 0;

    // Breakdown by scheme
    const twoOfThree = this.attempts.filter((a) => a.scheme === "2-of-3");
    const threeOfFive = this.attempts.filter((a) => a.scheme === "3-of-5");

    // Breakdown by type
    const byType = {
      vault: this.attempts.filter((a) => a.recoveryType === "vault").length,
      multisig: this.attempts.filter((a) => a.recoveryType === "multisig").length,
      password: this.attempts.filter((a) => a.recoveryType === "password").length,
    };

    return {
      totalAttempts,
      successfulRecoveries,
      failedRecoveries,
      successRate: Math.round(successRate * 100) / 100,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      byScheme: {
        "2-of-3": {
          attempts: twoOfThree.length,
          successes: twoOfThree.filter((a) => a.success).length,
          successRate:
            twoOfThree.length > 0
              ? Math.round((twoOfThree.filter((a) => a.success).length / twoOfThree.length) * 100 * 100) / 100
              : 0,
        },
        "3-of-5": {
          attempts: threeOfFive.length,
          successes: threeOfFive.filter((a) => a.success).length,
          successRate:
            threeOfFive.length > 0
              ? Math.round((threeOfFive.filter((a) => a.success).length / threeOfFive.length) * 100 * 100) / 100
              : 0,
        },
      },
      byType,
    };
  }

  /**
   * Get percentage of users who need recovery
   * This answers: "What percentage of users need account recovery?"
   */
  async getRecoveryNeedsPercentage(): Promise<{
    usersNeedingRecovery: number;
    totalActiveUsers: number;
    percentage: number;
    breakdown: {
      lostPassword: number;
      lostVault: number;
      lostWallet: number;
    };
  }> {
    // TODO: Query database for actual numbers
    // For now, estimate from attempts

    const lostPassword = this.attempts.filter((a) => a.recoveryType === "password").length;
    const lostVault = this.attempts.filter((a) => a.recoveryType === "vault").length;
    const lostWallet = this.attempts.filter((a) => a.recoveryType === "multisig").length;

    const uniqueUsersNeedingRecovery = new Set(
      this.attempts.map((a) => a.userId).filter(Boolean)
    ).size;

    // Estimate total users (in production, query from database)
    const estimatedTotalUsers = Math.max(uniqueUsersNeedingRecovery * 10, 100);

    return {
      usersNeedingRecovery: uniqueUsersNeedingRecovery,
      totalActiveUsers: estimatedTotalUsers,
      percentage: estimatedTotalUsers > 0 
        ? Math.round((uniqueUsersNeedingRecovery / estimatedTotalUsers) * 100 * 100) / 100 
        : 0,
      breakdown: {
        lostPassword,
        lostVault,
        lostWallet,
      },
    };
  }
}

export const recoveryMetrics = new RecoveryMetricsService();

