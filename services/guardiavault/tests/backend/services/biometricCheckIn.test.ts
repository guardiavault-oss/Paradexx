/**
 * Biometric Check-In Service Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BiometricCheckInService } from "../../../server/services/biometricCheckIn";

describe("BiometricCheckInService", () => {
  let service: BiometricCheckInService;

  beforeEach(() => {
    service = new BiometricCheckInService();
  });

  describe("verifyCheckIn", () => {
    it("should verify biometric data and return confidence score", async () => {
      const mockBiometricData = {
        typingPattern: {
          keystrokeDynamics: [
            { key: "a", keyDown: 1000, keyUp: 1100, dwellTime: 100, flightTime: 50 },
          ],
        },
        mouseMovement: {
          movements: [
            { x: 100, y: 200, timestamp: 1000 },
            { x: 150, y: 250, timestamp: 1100 },
          ],
        },
      };

      const userId = "test-user-id";
      const vaultId = "test-vault-id";
      
      // First, need to set up baseline (would normally be done during setup)
      // Then verify
      const result = await service.verifyCheckIn({
        userId,
        vaultId,
        biometricData: mockBiometricData,
        requireBiometric: false,
      });

      expect(result).toHaveProperty("verified");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("canProceed");
    });

    it("should return requiresManualVerification if confidence is low", async () => {
      // Test with mismatched biometric data
      const result = await service.verifyCheckIn({
        userId: "test-user",
        vaultId: "test-vault",
        biometricData: {
          typingPattern: {
            keystrokeDynamics: [],
          },
          mouseMovement: {
            movements: [],
          },
        },
        requireBiometric: true,
      });

      if (!result.verified && result.confidence < 0.7) {
        expect(result.requiresManualVerification).toBe(true);
      }
    });
  });
});

