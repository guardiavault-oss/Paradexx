/**
 * Biometric Check-in Verification Service
 * Integrates behavioral biometrics with vault check-in flow
 */

import { behavioralBiometricsService, type InteractionSignature } from "./behavioralBiometrics";
import { logInfo, logError, logWarn } from "./logger";
import type { User } from "@shared/schema";

export interface BiometricCheckInRequest {
  userId: string;
  vaultId: string;
  biometricData: InteractionSignature;
  requireBiometric?: boolean; // If false, biometrics are optional/for logging only
}

export interface BiometricCheckInResult {
  verified: boolean;
  confidence: number;
  details: string[];
  requiresManualVerification: boolean;
  canProceed: boolean; // Whether check-in can proceed despite biometric result
}

export class BiometricCheckInService {
  /**
   * Verify check-in with biometric data
   * Returns whether check-in can proceed and verification details
   */
  async verifyCheckIn(
    request: BiometricCheckInRequest
  ): Promise<BiometricCheckInResult> {
    const { userId, vaultId, biometricData, requireBiometric = false } = request;

    try {
      logInfo("Biometric check-in verification started", {
        userId,
        vaultId,
        requireBiometric,
      });

      // Check if user has biometric baseline
      const hasTypingBaseline = await behavioralBiometricsService.getBaselineBiometric(
        userId,
        "typing_pattern"
      );
      const hasMouseBaseline = await behavioralBiometricsService.getBaselineBiometric(
        userId,
        "mouse_movement"
      );

      // If no baseline exists and biometrics are not required, allow check-in
      if (!hasTypingBaseline && !hasMouseBaseline && !requireBiometric) {
        logInfo("No biometric baseline found, allowing check-in", { userId });
        return {
          verified: false,
          confidence: 0,
          details: ["No biometric baseline configured. Check-in allowed."],
          requiresManualVerification: false,
          canProceed: true,
        };
      }

      // If baseline exists, verify identity
      if (hasTypingBaseline || hasMouseBaseline) {
        const verificationResult = await behavioralBiometricsService.verifyIdentity(
          userId,
          biometricData
        );

        const canProceed = requireBiometric
          ? verificationResult.verified
          : true; // If not required, allow even if verification fails (just log)

        if (!verificationResult.verified && requireBiometric) {
          logWarn("Biometric verification failed for check-in", {
            userId,
            vaultId,
            confidence: verificationResult.confidence,
          });
        } else {
          logInfo("Biometric verification completed", {
            userId,
            vaultId,
            verified: verificationResult.verified,
            confidence: verificationResult.confidence,
          });
        }

        return {
          verified: verificationResult.verified,
          confidence: verificationResult.confidence,
          details: verificationResult.details,
          requiresManualVerification:
            requireBiometric && !verificationResult.verified,
          canProceed,
        };
      }

      // Fallback: if required but no baseline, require manual verification
      if (requireBiometric) {
        logWarn("Biometric required but no baseline found", { userId });
        return {
          verified: false,
          confidence: 0,
          details: [
            "Biometric verification required but no baseline found. Manual verification needed.",
          ],
          requiresManualVerification: true,
          canProceed: false,
        };
      }

      // Default: allow check-in
      return {
        verified: false,
        confidence: 0,
        details: ["No biometric verification performed"],
        requiresManualVerification: false,
        canProceed: true,
      };
    } catch (error: any) {
      logError(error, {
        context: "BiometricCheckInService.verifyCheckIn",
        userId,
        vaultId,
      });

      // On error, allow check-in if not required, block if required
      return {
        verified: false,
        confidence: 0,
        details: [
          `Error during biometric verification: ${error.message}. ${
            requireBiometric
              ? "Manual verification required."
              : "Check-in allowed."
          }`,
        ],
        requiresManualVerification: requireBiometric,
        canProceed: !requireBiometric,
      };
    }
  }

  /**
   * Check if user has biometric baseline configured
   */
  async hasBiometricBaseline(userId: string): Promise<boolean> {
    try {
      const typingBaseline =
        await behavioralBiometricsService.getBaselineBiometric(
          userId,
          "typing_pattern"
        );
      const mouseBaseline =
        await behavioralBiometricsService.getBaselineBiometric(
          userId,
          "mouse_movement"
        );
      return !!(typingBaseline || mouseBaseline);
    } catch (error: any) {
      logError(error, {
        context: "BiometricCheckInService.hasBiometricBaseline",
        userId,
      });
      return false;
    }
  }
}

export const biometricCheckInService = new BiometricCheckInService();

