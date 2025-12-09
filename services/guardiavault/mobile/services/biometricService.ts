/**
 * Biometric Authentication Service
 * Provides Face ID, Touch ID, and Fingerprint authentication
 */

import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricType {
  type: "fingerprint" | "face" | "iris" | "none";
  available: boolean;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
}

class BiometricService {
  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return false;

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      return false;
    }
  }

  /**
   * Get available biometric type
   */
  async getBiometricType(): Promise<BiometricType> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { type: "none", available: false };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return { type: "face", available: true };
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return { type: "fingerprint", available: true };
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return { type: "iris", available: true };
      }

      return { type: "none", available: false };
    } catch (error) {
      console.error("Error getting biometric type:", error);
      return { type: "none", available: false };
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(reason?: string): Promise<BiometricResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: "Biometric authentication not available",
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || "Authenticate to continue",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        fallbackLabel: "Use Passcode",
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || "Authentication failed",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Biometric authentication error",
      };
    }
  }

  /**
   * Get human-readable biometric name
   */
  async getBiometricName(): Promise<string> {
    const biometricType = await this.getBiometricType();
    
    switch (biometricType.type) {
      case "face":
        return "Face ID";
      case "fingerprint":
        return "Fingerprint";
      case "iris":
        return "Iris";
      default:
        return "Biometric";
    }
  }
}

export const biometricService = new BiometricService();

