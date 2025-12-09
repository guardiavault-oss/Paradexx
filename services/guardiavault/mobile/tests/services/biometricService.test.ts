/**
 * Biometric Service Tests
 * Unit tests for biometric authentication service
 */

import { biometricService } from "../../services/biometricService";
import * as LocalAuthentication from "expo-local-authentication";

// Mock expo-local-authentication
jest.mock("expo-local-authentication");

describe("BiometricService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isAvailable", () => {
    it("should return true when hardware is available and enrolled", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await biometricService.isAvailable();

      expect(result).toBe(true);
      expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
      expect(LocalAuthentication.isEnrolledAsync).toHaveBeenCalled();
    });

    it("should return false when hardware not available", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await biometricService.isAvailable();

      expect(result).toBe(false);
    });

    it("should return false when not enrolled", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const result = await biometricService.isAvailable();

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(
        new Error("Test error")
      );

      const result = await biometricService.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe("getBiometricType", () => {
    it("should return face type when facial recognition available", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const result = await biometricService.getBiometricType();

      expect(result.type).toBe("face");
      expect(result.available).toBe(true);
    });

    it("should return fingerprint type when fingerprint available", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const result = await biometricService.getBiometricType();

      expect(result.type).toBe("fingerprint");
      expect(result.available).toBe(true);
    });

    it("should return iris type when iris available", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.IRIS,
      ]);

      const result = await biometricService.getBiometricType();

      expect(result.type).toBe("iris");
      expect(result.available).toBe(true);
    });

    it("should return none when hardware not available", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const result = await biometricService.getBiometricType();

      expect(result.type).toBe("none");
      expect(result.available).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(
        new Error("Test error")
      );

      const result = await biometricService.getBiometricType();

      expect(result.type).toBe("none");
      expect(result.available).toBe(false);
    });
  });

  describe("authenticate", () => {
    it("should authenticate successfully", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await biometricService.authenticate("Test reason");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: "Test reason",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        fallbackLabel: "Use Passcode",
      });
    });

    it("should return error when authentication fails", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: "User cancelled",
      });

      const result = await biometricService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe("User cancelled");
    });

    it("should return error when biometric not available", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const result = await biometricService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Biometric authentication not available");
    });

    it("should handle authentication errors", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValue(
        new Error("Authentication error")
      );

      const result = await biometricService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication error");
    });
  });

  describe("getBiometricName", () => {
    it("should return Face ID for face type", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const name = await biometricService.getBiometricName();

      expect(name).toBe("Face ID");
    });

    it("should return Fingerprint for fingerprint type", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const name = await biometricService.getBiometricName();

      expect(name).toBe("Fingerprint");
    });

    it("should return Biometric for none type", async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const name = await biometricService.getBiometricName();

      expect(name).toBe("Biometric");
    });
  });
});







