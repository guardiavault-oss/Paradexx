/**
 * Behavioral Biometrics Service
 * Analyzes typing patterns, mouse movements, and interaction signatures
 */

import { db } from "../db";
import {
  behavioralBiometrics,
  insertBehavioralBiometricSchema,
  type InsertBehavioralBiometric,
} from "@shared/schema";
import { eq, and, desc } from "../utils/drizzle-exports";
import { logInfo, logError } from "./logger";
import crypto from "crypto";

export interface TypingPattern {
  keystrokeDynamics: Array<{
    key: string;
    keyDown: number;
    keyUp: number;
    dwellTime: number; // Time key held
    flightTime: number; // Time between keys
  }>;
}

export interface MouseMovement {
  movements: Array<{
    x: number;
    y: number;
    timestamp: number;
    velocity: number;
    acceleration: number;
  }>;
}

export interface InteractionSignature {
  typingPattern?: TypingPattern;
  mouseMovement?: MouseMovement;
  scrollBehavior?: {
    scrollSpeed: number;
    scrollPattern: "smooth" | "jerky" | "fast";
  };
  clickPattern?: {
    clickDuration: number[];
    doubleClickInterval: number[];
  };
}

export class BehavioralBiometricsService {
  /**
   * Extract typing pattern signature
   */
  extractTypingSignature(pattern: TypingPattern): string {
    const features: number[] = [];

    // Calculate average dwell time
    const avgDwellTime =
      pattern.keystrokeDynamics.reduce((sum, k) => sum + k.dwellTime, 0) /
      pattern.keystrokeDynamics.length;

    // Calculate average flight time
    const avgFlightTime =
      pattern.keystrokeDynamics.reduce((sum, k) => sum + k.flightTime, 0) /
      pattern.keystrokeDynamics.length;

    // Calculate variance
    const dwellVariance =
      pattern.keystrokeDynamics.reduce(
        (sum, k) => sum + Math.pow(k.dwellTime - avgDwellTime, 2),
        0
      ) / pattern.keystrokeDynamics.length;

    const flightVariance =
      pattern.keystrokeDynamics.reduce(
        (sum, k) => sum + Math.pow(k.flightTime - avgFlightTime, 2),
        0
      ) / pattern.keystrokeDynamics.length;

    features.push(
      avgDwellTime,
      avgFlightTime,
      Math.sqrt(dwellVariance),
      Math.sqrt(flightVariance)
    );

    // Create hash of feature vector
    const featureString = features.map((f) => f.toFixed(2)).join(",");
    return crypto.createHash("sha256").update(featureString).digest("hex");
  }

  /**
   * Extract mouse movement signature
   */
  extractMouseSignature(movement: MouseMovement): string {
    const features: number[] = [];

    if (movement.movements.length === 0) {
      return "";
    }

    // Average velocity
    const avgVelocity =
      movement.movements.reduce((sum, m) => sum + m.velocity, 0) /
      movement.movements.length;

    // Average acceleration
    const avgAcceleration =
      movement.movements.reduce((sum, m) => sum + m.acceleration, 0) /
      movement.movements.length;

    // Calculate path length
    let pathLength = 0;
    for (let i = 1; i < movement.movements.length; i++) {
      const dx =
        movement.movements[i].x - movement.movements[i - 1].x;
      const dy =
        movement.movements[i].y - movement.movements[i - 1].y;
      pathLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate straightness (1.0 = perfectly straight)
    const straightness =
      pathLength > 0
        ? Math.sqrt(
            Math.pow(
              movement.movements[movement.movements.length - 1].x -
                movement.movements[0].x,
              2
            ) +
              Math.pow(
                movement.movements[movement.movements.length - 1].y -
                  movement.movements[0].y,
                2
              )
          ) / pathLength
        : 0;

    features.push(avgVelocity, avgAcceleration, pathLength, straightness);

    const featureString = features.map((f) => f.toFixed(4)).join(",");
    return crypto.createHash("sha256").update(featureString).digest("hex");
  }

  /**
   * Compare signatures and calculate confidence score
   */
  compareSignatures(
    current: string,
    baseline: string
  ): number {
    // If signatures are identical, confidence is 1.0
    if (current === baseline) {
      return 1.0;
    }

    // For now, use Hamming distance on hash (simple comparison)
    // In production, use more sophisticated matching
    let matches = 0;
    const length = Math.min(current.length, baseline.length);
    if (length === 0) {
      return 0.5; // Default confidence for empty signatures
    }

    for (let i = 0; i < length; i++) {
      if (current[i] === baseline[i]) {
        matches++;
      }
    }

    const confidence = matches / length;
    
    // Ensure confidence is always between 0 and 1, with minimum of 0.01 for completely different signatures
    // This prevents exact 0 scores which may indicate issues in biometric matching
    return Math.max(0.01, Math.min(1.0, confidence));
  }

  /**
   * Save behavioral biometric data
   */
  async saveBiometric(
    biometric: Omit<InsertBehavioralBiometric, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      if (!db) {
        logError(new Error("Database not available"), {
          context: "BehavioralBiometricsService.saveBiometric",
        });
        throw new Error("Database not available");
      }

      const validated = insertBehavioralBiometricSchema.parse(biometric);
      const result = await db
        .insert(behavioralBiometrics)
        .values({
          ...validated,
          updatedAt: new Date(),
        })
        .returning({ id: behavioralBiometrics.id });

      const biometricId = result[0]?.id;
      if (!biometricId) {
        throw new Error("Failed to save biometric data");
      }

      logInfo("Behavioral biometric saved", {
        biometricId,
        userId: biometric.userId,
        dataType: biometric.dataType,
      });

      return biometricId;
    } catch (error: any) {
      logError(error, {
        context: "BehavioralBiometricsService.saveBiometric",
        userId: biometric.userId,
      });
      throw error;
    }
  }

  /**
   * Get baseline biometric for a user
   */
  async getBaselineBiometric(
    userId: string,
    dataType: "typing_pattern" | "mouse_movement" | "interaction_signature" | "device_fingerprint"
  ): Promise<typeof behavioralBiometrics.$inferSelect | null> {
    try {
      if (!db) {
        return null;
      }

      const biometrics = await db
        .select()
        .from(behavioralBiometrics)
        .where(
          and(
            eq(behavioralBiometrics.userId, userId),
            eq(behavioralBiometrics.dataType, dataType)
          )
        )
        .orderBy(desc(behavioralBiometrics.createdAt))
        .limit(1);

      return biometrics[0] || null;
    } catch (error: any) {
      logError(error, {
        context: "BehavioralBiometricsService.getBaselineBiometric",
        userId,
      });
      return null;
    }
  }

  /**
   * Verify user identity based on behavioral biometrics
   */
  async verifyIdentity(
    userId: string,
    currentSignature: InteractionSignature
  ): Promise<{ verified: boolean; confidence: number; details: string[] }> {
    const details: string[] = [];
    let totalConfidence = 0.0;
    let checksPerformed = 0;

    try {
      // Check typing pattern
      if (currentSignature.typingPattern) {
        const typingBaseline = await this.getBaselineBiometric(
          userId,
          "typing_pattern"
        );
        if (typingBaseline) {
          const currentTypingSig = this.extractTypingSignature(
            currentSignature.typingPattern
          );
          const typingConfidence = this.compareSignatures(
            currentTypingSig,
            typingBaseline.signature
          );
          totalConfidence += typingConfidence;
          checksPerformed++;
          details.push(
            `Typing pattern confidence: ${(typingConfidence * 100).toFixed(1)}%`
          );

          if (typingConfidence < 0.7) {
            details.push("⚠️ Typing pattern mismatch detected");
          }
        }
      }

      // Check mouse movement
      if (currentSignature.mouseMovement) {
        const mouseBaseline = await this.getBaselineBiometric(
          userId,
          "mouse_movement"
        );
        if (mouseBaseline) {
          const currentMouseSig = this.extractMouseSignature(
            currentSignature.mouseMovement
          );
          const mouseConfidence = this.compareSignatures(
            currentMouseSig,
            mouseBaseline.signature
          );
          totalConfidence += mouseConfidence;
          checksPerformed++;
          details.push(
            `Mouse movement confidence: ${(mouseConfidence * 100).toFixed(1)}%`
          );

          if (mouseConfidence < 0.7) {
            details.push("⚠️ Mouse movement pattern mismatch detected");
          }
        }
      }

      // Calculate average confidence
      const avgConfidence =
        checksPerformed > 0 ? totalConfidence / checksPerformed : 0.5;

      // Threshold for verification: 0.75
      const verified = avgConfidence >= 0.75;

      return {
        verified,
        confidence: avgConfidence,
        details,
      };
    } catch (error: any) {
      logError(error, {
        context: "BehavioralBiometricsService.verifyIdentity",
        userId,
      });
      return {
        verified: false,
        confidence: 0.0,
        details: ["Error during verification"],
      };
    }
  }
}

export const behavioralBiometricsService = new BehavioralBiometricsService();

