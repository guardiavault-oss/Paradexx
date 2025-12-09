/**
 * Client-side encryption utilities for seed phrase encryption
 * Uses Web Crypto API for secure encryption
 */

/**
 * Encrypt seed phrase using AES-GCM encryption
 * @param seedPhrase The seed phrase to encrypt
 * @param password Password for encryption (derived from wallet address + timestamp)
 * @returns Encrypted data as base64 string with IV included
 */
export async function encryptSeedPhrase(
  seedPhrase: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seedPhrase);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Generate IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Combine salt, IV, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

/**
 * Decrypt seed phrase using AES-GCM decryption
 * @param encryptedData Base64 encoded encrypted data
 * @param password Password used for encryption
 * @returns Decrypted seed phrase
 */
export async function decryptSeedPhrase(
  encryptedData: string,
  password: string
): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Decode base64
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

  // Extract salt, IV, and encrypted data
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}

/**
 * Generate a secure encryption password
 * Combines wallet address with current timestamp for uniqueness
 * @param walletAddress The wallet address
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns Encryption password string
 */
export function generateEncryptionPassword(
  walletAddress: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  return `${walletAddress}-${ts}`;
}

