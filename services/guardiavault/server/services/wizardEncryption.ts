/**
 * Wizard State Encryption Service
 * Encrypts/decrypts wizard state using AES-256-GCM
 */

import crypto from "crypto";
import { logError } from "./logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment
 * CRITICAL: No fallback allowed - will throw error if WIZARD_ENCRYPTION_KEY is not set
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.WIZARD_ENCRYPTION_KEY;
  
  if (!envKey) {
    const error = new Error(
      "CRITICAL: WIZARD_ENCRYPTION_KEY environment variable is required but not set. " +
      "Application cannot start without this secret. " +
      "Generate a secure 64-character hex key (32 bytes) and set it in your environment."
    );
    logError(error, { context: 'getEncryptionKey' });
    throw error;
  }
  
  // Validate format (must be 64 hex characters = 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(envKey)) {
    const error = new Error(
      "CRITICAL: WIZARD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). " +
      "Current value length: " + envKey.length
    );
    logError(error, {
      context: 'getEncryptionKey',
      keyLength: envKey.length,
      expectedLength: 64
    });
    throw error;
  }
  
  return Buffer.from(envKey, "hex");
}

/**
 * Encrypt wizard state
 */
export function encryptWizardState(data: any): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, "hex")
    ]);
    
    return combined.toString("base64");
  } catch (error) {
    logError(error as Error, { context: "wizard_encryption" });
    throw new Error("Failed to encrypt wizard state");
  }
}

/**
 * Decrypt wizard state
 */
export function decryptWizardState(encryptedData: string): any {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, "base64");
    
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted);
  } catch (error) {
    logError(error as Error, { context: "wizard_decryption" });
    throw new Error("Failed to decrypt wizard state");
  }
}

