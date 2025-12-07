/**
 * TOTP (Time-based One-Time Password) Service
 * Provides fallback authentication when WebAuthn is unavailable
 */

import { TOTP } from "otpauth";
import { storage } from "../storage";
import { logInfo, logError } from "./logger";
import bcrypt from "bcrypt";

const TOTP_ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || "change-me-in-production";
const ISSUER = "GuardiaVault";
const PERIOD = 30; // 30 seconds

export interface TotpSetupResult {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface TotpVerifyResult {
  valid: boolean;
  error?: string;
}

export class TotpService {
  /**
   * Generate a new TOTP secret for a user
   */
  async setupTotp(userId: string, email: string): Promise<TotpSetupResult> {
    try {
      // Generate secret
      const totp = new TOTP({
        issuer: ISSUER,
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: PERIOD,
      });

      const secret = totp.secret.base32;
      
      // Encrypt secret (simple XOR for now, should use proper encryption in production)
      const encryptedSecret = this.encryptSecret(secret);

      // Check if user already has TOTP secret
      const existing = await storage.getTotpSecret(userId);
      if (existing) {
        // Update existing secret
        await storage.updateTotpSecret(userId, {
          secret: encryptedSecret,
          enabled: false, // Will be enabled after verification
        });
      } else {
        // Create new secret
        await storage.createTotpSecret({
          userId,
          secret: encryptedSecret,
          enabled: false,
        });
      }

      // Generate QR code URL
      const qrCodeUrl = totp.toString();

      logInfo("TOTP setup completed", { userId });

      return {
        secret: totp.secret.base32,
        qrCodeUrl,
        manualEntryKey: secret,
      };
    } catch (error: any) {
      logError("TOTP setup error", error);
      throw new Error(`Failed to setup TOTP: ${error.message}`);
    }
  }

  /**
   * Verify TOTP token
   */
  async verifyTotp(userId: string, token: string): Promise<TotpVerifyResult> {
    try {
      const totpSecret = await storage.getTotpSecret(userId);
      if (!totpSecret || !totpSecret.enabled) {
        return { valid: false, error: "TOTP not enabled" };
      }

      // Decrypt secret
      const secret = this.decryptSecret(totpSecret.secret);

      const totp = new TOTP({
        secret,
        algorithm: "SHA1",
        digits: 6,
        period: PERIOD,
      });

      // Verify token (with 1 period tolerance for clock skew)
      const isValid = totp.validate({ token, window: [1, 1] }) !== null;

      if (isValid) {
        // Update last used timestamp
        await storage.updateTotpSecret(userId, {
          lastUsedAt: new Date(),
        });
      }

      return { valid: isValid };
    } catch (error: any) {
      logError("TOTP verification error", error);
      return { valid: false, error: error.message || "Verification failed" };
    }
  }

  /**
   * Enable TOTP after initial setup verification
   */
  async enableTotp(userId: string, verificationToken: string): Promise<boolean> {
    const result = await this.verifyTotp(userId, verificationToken);
    if (result.valid) {
      await storage.updateTotpSecret(userId, {
        enabled: true,
      });
      return true;
    }
    return false;
  }

  /**
   * Disable TOTP for user
   */
  async disableTotp(userId: string): Promise<boolean> {
    try {
      const secret = await storage.getTotpSecret(userId);
      if (!secret) return false;

      await storage.updateTotpSecret(userId, {
        enabled: false,
      });
      return true;
    } catch (error) {
      logError("Error disabling TOTP", error);
      return false;
    }
  }

  /**
   * Check if TOTP is enabled for user
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const secret = await storage.getTotpSecret(userId);
      return secret?.enabled || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Simple encryption (XOR cipher) - should use proper encryption in production
   */
  private encryptSecret(secret: string): string {
    // In production, use proper encryption like AES-256-GCM
    // For now, simple base64 encoding (not secure, but works for demo)
    return Buffer.from(secret).toString("base64");
  }

  /**
   * Simple decryption (XOR cipher) - should use proper decryption in production
   */
  private decryptSecret(encrypted: string): string {
    return Buffer.from(encrypted, "base64").toString("utf-8");
  }
}

export const totpService = new TotpService();

/**
 * Prepare TOTP setup for a user
 * Returns secret, QR code URL, and encrypted secret
 */
export async function prepareTOTPSetup(
  userId: string,
  email: string
): Promise<{
  secret: string;
  qrCode: string;
  encryptedSecret: string;
}> {
  const result = await totpService.setupTotp(userId, email);
  
  // Get the encrypted secret from storage
  const stored = await storage.getTotpSecret(userId);
  const encryptedSecret = stored?.secret || "";
  
  return {
    secret: result.secret,
    qrCode: result.qrCodeUrl,
    encryptedSecret,
  };
}

/**
 * Verify TOTP token against a secret (encrypted secret string)
 * Used during setup verification or login
 */
export function verifyTOTP(token: string, encryptedSecret: string): boolean {
  try {
    // Decrypt the secret (assuming it's base64 encoded)
    const secret = Buffer.from(encryptedSecret, "base64").toString("utf-8");
    
    const totp = new TOTP({
      secret,
      algorithm: "SHA1",
      digits: 6,
      period: PERIOD,
    });
    
    // Verify token (with 1 period tolerance for clock skew)
    const isValid = totp.validate({ token, window: [1, 1] }) !== null;
    return isValid;
  } catch (error: any) {
    logError("TOTP verification error", error);
    return false;
  }
}

/**
 * Generate backup codes for TOTP recovery
 */
export async function generateBackupCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup codes using bcrypt
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

/**
 * Verify a backup code against hashed codes
 * Returns the remaining codes after removing the used one
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; remainingCodes?: string[]; error?: string }> {
  try {
    let foundIndex = -1;
    for (let i = 0; i < hashedCodes.length; i++) {
      const match = await bcrypt.compare(code, hashedCodes[i]);
      if (match) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex === -1) {
      return { valid: false, error: "Invalid backup code" };
    }
    
    // Remove the used code and return remaining codes
    const remainingCodes = hashedCodes.filter((_, index) => index !== foundIndex);
    return { valid: true, remainingCodes };
  } catch (error: any) {
    logError("Backup code verification error", error);
    return { valid: false, error: error.message || "Verification failed" };
  }
}

/**
 * Encrypt TOTP secret (wrapper for consistency)
 */
export function encryptTOTPSecret(secret: string): string {
  // Use the same encryption method as TotpService
  return Buffer.from(secret).toString("base64");
}