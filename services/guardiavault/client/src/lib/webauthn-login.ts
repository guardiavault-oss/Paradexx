/**
 * WebAuthn Login Functions
 * Public authentication endpoints for login flow
 */

import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/typescript-types";

export interface WebAuthnLoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    walletAddress?: string | null;
  };
  error?: string;
}

/**
 * Check if user has WebAuthn credentials for login
 */
export async function checkWebAuthnAvailable(email: string): Promise<boolean> {
  try {
    if (!isWebAuthnSupported()) {
      return false;
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    const response = await fetch("/api/auth/webauthn/login/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.hasCredentials || false;
  } catch (error) {
    const { logError } = await import("@/utils/logger");
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "checkWebAuthnAvailable",
      email,
    });
    return false;
  }
}

/**
 * Check if WebAuthn is supported in this browser
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.credentials !== "undefined" &&
    typeof navigator.credentials.get !== "undefined";
}

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

/**
 * Authenticate with WebAuthn for login
 */
export async function authenticateWithWebAuthnForLogin(email: string): Promise<WebAuthnLoginResult> {
  try {
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        error: "WebAuthn not supported in this browser",
      };
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    // Step 1: Start authentication
    const startResponse = await fetch("/api/auth/webauthn/login/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(error.message || "Failed to start authentication");
    }

    const data = await startResponse.json();

    if (!data.hasCredentials || !data.options) {
      return {
        success: false,
        error: "No biometric credentials found for this account",
      };
    }

    const options: PublicKeyCredentialRequestOptionsJSON = data.options;

    // Step 2: Get assertion from browser/device
    const assertionResponse = await startAuthentication({ optionsJSON: options });

    // Step 3: Complete authentication
    const completeResponse = await fetch("/api/auth/webauthn/login/complete", {
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

    const result = await completeResponse.json();

    return {
      success: true,
      user: result.user,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Authentication failed",
    };
  }
}

