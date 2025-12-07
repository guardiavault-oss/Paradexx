import secrets from "secrets.js-grempe";
import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from "crypto";

/**
 * Shamir Secret Sharing Service
 * Implements 2-of-3 threshold scheme for splitting recovery phrases
 */

interface SplitResult {
  shares: string[];
  threshold: number;
  total: number;
}

interface EncryptedFragment {
  encryptedData: string;
  iv: string;
  salt: string;
}

/**
 * Split a secret into shares using Shamir's Secret Sharing
 * @param secret - The secret to split (recovery phrase, private key, etc.)
 * @param threshold - Minimum number of shares needed to reconstruct (default: 2)
 * @param totalShares - Total number of shares to create (default: 3)
 */
export function splitSecret(
  secret: string,
  threshold: number = 2,
  totalShares: number = 3
): SplitResult {
  if (threshold > totalShares) {
    throw new Error("Threshold cannot exceed total shares");
  }

  if (threshold < 2) {
    throw new Error("Threshold must be at least 2");
  }

  // Convert secret to hex
  const hexSecret = Buffer.from(secret, "utf8").toString("hex");

  // Split using Shamir's algorithm
  const shares = secrets.share(hexSecret, totalShares, threshold);

  return {
    shares,
    threshold,
    total: totalShares,
  };
}

/**
 * Reconstruct the secret from shares
 * @param shares - Array of share strings
 */
export function combineShares(shares: string[]): string {
  if (shares.length < 2) {
    throw new Error("At least 2 shares required for reconstruction");
  }

  try {
    // Combine shares to get hex secret
    const hexSecret = secrets.combine(shares);

    // Convert hex back to original secret
    const secret = Buffer.from(hexSecret, "hex").toString("utf8");

    return secret;
  } catch (error) {
    throw new Error("Failed to reconstruct secret. Invalid or insufficient shares.");
  }
}

/**
 * Encrypt a fragment for storage
 * Uses AES-256-CBC encryption with PBKDF2 key derivation
 * @param fragment - The fragment to encrypt
 * @param passphrase - Secret passphrase (should be high-entropy, user-supplied or generated)
 */
export function encryptFragment(
  fragment: string,
  passphrase: string
): EncryptedFragment {
  // Generate random salt for key derivation
  const salt = randomBytes(32);

  // Derive a 32-byte key using PBKDF2 with 100,000 iterations
  // In production, consider using Scrypt or Argon2 for better protection
  const key = pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");

  // Generate random IV
  const iv = randomBytes(16);

  // Create cipher
  const cipher = createCipheriv("aes-256-cbc", key, iv);

  // Encrypt the fragment
  let encrypted = cipher.update(fragment, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
  };
}

/**
 * Decrypt a fragment
 * @param encryptedFragment - The encrypted fragment object (includes salt and IV)
 * @param passphrase - The same passphrase used for encryption
 */
export function decryptFragment(
  encryptedFragment: EncryptedFragment,
  passphrase: string
): string {
  // Convert salt and IV from hex
  const salt = Buffer.from(encryptedFragment.salt, "hex");
  const iv = Buffer.from(encryptedFragment.iv, "hex");

  // Derive the same key using PBKDF2
  const key = pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");

  // Create decipher
  const decipher = createDecipheriv("aes-256-cbc", key, iv);

  // Decrypt the fragment
  let decrypted = decipher.update(encryptedFragment.encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a secure random passphrase for fragment encryption
 * Returns a base64-encoded random string
 */
export function generateSecurePassphrase(): string {
  return randomBytes(32).toString("base64");
}

/**
 * Derive a guardian-specific passphrase from a master secret
 * Uses PBKDF2 to create deterministic but unique passphrases per guardian
 * @param masterSecret - User's master secret (from wallet or user input)
 * @param guardianEmail - Guardian's email address (salt component)
 * @param fragmentIndex - Fragment index for additional entropy
 */
export function deriveGuardianPassphrase(
  masterSecret: string,
  guardianEmail: string,
  fragmentIndex: number
): string {
  // Combine email and index for salt
  const salt = `${guardianEmail}:fragment:${fragmentIndex}`;
  
  // Derive a 32-byte key using PBKDF2
  const derivedKey = pbkdf2Sync(masterSecret, salt, 100000, 32, "sha256");
  
  // Return as base64 for easy handling
  return derivedKey.toString("base64");
}

/**
 * Generate a random recovery phrase (for testing/demo purposes)
 * In production, this would be the user's actual wallet recovery phrase
 */
export function generateMockRecoveryPhrase(): string {
  const words = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
    "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
    "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
  ];

  const phrase: string[] = [];
  for (let i = 0; i < 12; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }

  return phrase.join(" ");
}

/**
 * Validate that shares can reconstruct the original secret
 */
export function validateShares(
  originalSecret: string,
  shares: string[],
  threshold: number
): boolean {
  if (shares.length < threshold) {
    return false;
  }

  try {
    const reconstructed = combineShares(shares.slice(0, threshold));
    return reconstructed === originalSecret;
  } catch {
    return false;
  }
}
