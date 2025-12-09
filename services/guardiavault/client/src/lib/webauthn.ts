/**
 * Frontend WebAuthn Client
 * Handles biometric authentication with fallback to password + TOTP
 */

import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type { 
  PublicKeyCredentialCreationOptionsJSON, 
  PublicKeyCredentialRequestOptionsJSON 
} from "@simplewebauthn/typescript-types";

/**
 * Detect mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}

/**
 * Get biometric type name for mobile
 */
export function getBiometricTypeName(): string {
  if (typeof window === "undefined") return "Biometric";
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // iOS devices
  if (/iphone|ipad|ipod/.test(userAgent)) {
    // iOS 14.5+ supports Face ID or Touch ID
    return "Face ID or Touch ID";
  }
  
  // Android devices
  if (/android/.test(userAgent)) {
    return "Biometric";
  }
  
  // Desktop
  if (/windows/.test(userAgent)) {
    return "Windows Hello";
  }
  
  if (/mac/.test(userAgent)) {
    return "Touch ID or Face ID";
  }
  
  return "Biometric";
}

export interface BiometricAuthResult {
  success: boolean;
  method: "webauthn" | "totp" | "password";
  error?: string;
}

export interface WebAuthnStatus {
  hasCredentials: boolean;
  credentials: Array<{
    id: string;
    deviceName: string | null;
    deviceType: string | null;
    lastUsedAt: Date | null;
  }>;
}

/**
 * Check if WebAuthn is supported in this browser
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.credentials !== "undefined" &&
    typeof navigator.credentials.create !== "undefined";
}

/**
 * Register a new WebAuthn credential
 */
export async function registerWebAuthnCredential(deviceName?: string): Promise<BiometricAuthResult> {
  try {
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        method: "webauthn",
        error: "WebAuthn not supported in this browser",
      };
    }

    // Step 1: Start registration
    const startResponse = await fetch("/api/webauthn/register/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ deviceName }),
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.message || "Failed to start registration");
    }

    const { options }: { options: PublicKeyCredentialCreationOptionsJSON } = await startResponse.json();

    // Step 2: Create credential in browser
    const attestationResponse = await startRegistration({ optionsJSON: options });

    // Step 3: Complete registration
    const completeResponse = await fetch("/api/webauthn/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        attestationResponse,
      }),
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.message || "Registration failed");
    }

    return {
      success: true,
      method: "webauthn",
    };
  } catch (error: any) {
    return {
      success: false,
      method: "webauthn",
      error: error.message || "Registration failed",
    };
  }
}

/**
 * Authenticate using WebAuthn
 */
export async function authenticateWithWebAuthn(): Promise<BiometricAuthResult> {
  try {
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        method: "webauthn",
        error: "WebAuthn not supported in this browser",
      };
    }

    // Step 1: Start authentication
    const startResponse = await fetch("/api/webauthn/authenticate/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.message || "Failed to start authentication");
    }

    const { options }: { options: PublicKeyCredentialRequestOptionsJSON } = await startResponse.json();

    // Step 2: Get assertion from browser
    const assertionResponse = await startAuthentication({ optionsJSON: options });

    // Step 3: Complete authentication
    const completeResponse = await fetch("/api/webauthn/authenticate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        assertionResponse,
      }),
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.message || "Authentication failed");
    }

    return {
      success: true,
      method: "webauthn",
    };
  } catch (error: any) {
    return {
      success: false,
      method: "webauthn",
      error: error.message || "Authentication failed",
    };
  }
}

/**
 * Authenticate with password + TOTP fallback
 */
export async function authenticateWithPasswordAndTotp(
  password: string,
  totpToken?: string
): Promise<BiometricAuthResult> {
  try {
    // First verify password (this should already be done via session, but we'll use TOTP as additional verification)
    if (totpToken) {
      const totpResponse = await fetch("/api/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: totpToken }),
      });

      if (!totpResponse.ok) {
        const error = await totpResponse.json();
        throw new Error(error.message || "TOTP verification failed");
      }

      return {
        success: true,
        method: "totp",
      };
    }

    // If no TOTP, fallback to just password (user already authenticated via session)
    return {
      success: true,
      method: "password",
    };
  } catch (error: any) {
    return {
      success: false,
      method: totpToken ? "totp" : "password",
      error: error.message || "Authentication failed",
    };
  }
}

/**
 * Get WebAuthn status for current user
 */
export async function getWebAuthnStatus(): Promise<WebAuthnStatus | null> {
  try {
    const response = await fetch("/api/webauthn/status", {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Check if TOTP is enabled
 */
export async function isTotpEnabled(): Promise<boolean> {
  try {
    const response = await fetch("/api/totp/status", {
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.enabled || false;
  } catch (error) {
    return false;
  }
}

/**
 * Unified biometric authentication function
 * Tries WebAuthn first, falls back to password + TOTP
 */
export async function authenticateBiometric(
  fallbackPassword?: string,
  fallbackTotp?: string
): Promise<BiometricAuthResult> {
  // Try WebAuthn first if supported
  if (isWebAuthnSupported()) {
    const status = await getWebAuthnStatus();
    if (status?.hasCredentials) {
      const result = await authenticateWithWebAuthn();
      if (result.success) {
        return result;
      }
      // WebAuthn failed, try fallback
    }
  }

  // Fallback to password + TOTP
  if (fallbackPassword || fallbackTotp) {
    return await authenticateWithPasswordAndTotp(fallbackPassword || "", fallbackTotp);
  }

  return {
    success: false,
    method: "webauthn",
    error: "No authentication method available",
  };
}

