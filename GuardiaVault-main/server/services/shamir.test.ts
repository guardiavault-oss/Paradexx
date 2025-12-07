import { describe, it, expect } from 'vitest';
import {
  splitSecret,
  combineShares,
  encryptFragment,
  decryptFragment,
  generateSecurePassphrase,
  deriveGuardianPassphrase,
} from './shamir';

describe('Shamir Secret Sharing', () => {
  const testSecret = 'test recovery phrase with twelve words minimum length';
  
  describe('splitSecret', () => {
    it('should split secret into 3 shares (2-of-3 threshold)', () => {
      const result = splitSecret(testSecret, 2, 3);
      expect(result.shares).toHaveLength(3);
      expect(result.shares.every(share => typeof share === 'string')).toBe(true);
      expect(result.threshold).toBe(2);
      expect(result.total).toBe(3);
    });

    it('should require at least 2 shares to reconstruct (2-of-3 threshold)', () => {
      const result = splitSecret(testSecret, 2, 3);
      const shares = result.shares;
      
      // Try with 1 share (may not throw but will produce incorrect result)
      // The actual behavior depends on secrets.js - it may return garbage data
      try {
        const invalidResult = combineShares(shares.slice(0, 1));
        // If it doesn't throw, the result should not match the original
        expect(invalidResult).not.toBe(testSecret);
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }
      
      // Try with 2 shares (should succeed)
      const reconstructed = combineShares(shares.slice(0, 2));
      expect(reconstructed).toBe(testSecret);
    });

    it('should work with any 2 of 3 shares (2-of-3 threshold)', () => {
      const result = splitSecret(testSecret, 2, 3);
      const shares = result.shares;
      
      // Test different combinations - any 2 should work
      const combinations = [
        shares.slice(0, 2), // First 2
        [shares[0], shares[2]], // First and last
        shares.slice(1, 3), // Last 2
      ];

      combinations.forEach(combination => {
        const reconstructed = combineShares(combination);
        expect(reconstructed).toBe(testSecret);
      });
    });

    // Legacy compatibility test for 3-of-5 (if needed for existing vaults)
    it('should support legacy 3-of-5 scheme for backward compatibility', () => {
      const result = splitSecret(testSecret, 3, 5);
      const shares = result.shares;
      
      // Test that 3 of 5 still works
      const reconstructed = combineShares(shares.slice(0, 3));
      expect(reconstructed).toBe(testSecret);
    });
  });

  describe('combineShares', () => {
    it('should reconstruct original secret from 2 valid shares (2-of-3)', () => {
      const result = splitSecret(testSecret, 2, 3);
      const reconstructed = combineShares(result.shares.slice(0, 2));
      expect(reconstructed).toBe(testSecret);
    });

    it('should fail with insufficient shares (only 1 share for 2-of-3)', () => {
      const result = splitSecret(testSecret, 2, 3);
      // secrets.js may not throw but will produce incorrect result
      try {
        const invalidResult = combineShares(result.shares.slice(0, 1));
        // Result should not match original secret
        expect(invalidResult).not.toBe(testSecret);
      } catch (error) {
        // Throwing is also acceptable behavior
        expect(error).toBeDefined();
      }
    });

    it('should throw error with invalid shares', () => {
      const result = splitSecret(testSecret, 2, 3);
      const shares = result.shares;
      const invalidShares = shares.slice(0, 1).concat('invalid-share');
      expect(() => combineShares(invalidShares)).toThrow();
    });
  });

  describe('encryptFragment / decryptFragment', () => {
    it('should encrypt and decrypt fragment correctly', () => {
      const passphrase = 'test-passphrase-123';
      const plaintext = 'test-fragment-data';
      
      const encrypted = encryptFragment(plaintext, passphrase);
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      
      const decrypted = decryptFragment(encrypted, passphrase);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption with wrong passphrase', () => {
      const passphrase = 'correct-passphrase';
      const wrongPassphrase = 'wrong-passphrase';
      const plaintext = 'test-data';
      
      const encrypted = encryptFragment(plaintext, passphrase);
      
      expect(() => {
        decryptFragment(encrypted, wrongPassphrase);
      }).toThrow();
    });
  });

  describe('generateSecurePassphrase', () => {
    it('should generate passphrase of correct length', () => {
      const passphrase = generateSecurePassphrase();
      expect(passphrase.length).toBeGreaterThan(20);
    });

    it('should generate unique passphrases', () => {
      const passphrases = Array.from({ length: 10 }, () => generateSecurePassphrase());
      const unique = new Set(passphrases);
      expect(unique.size).toBe(passphrases.length);
    });
  });

  describe('deriveGuardianPassphrase', () => {
    it('should derive consistent passphrase from same inputs', () => {
      const masterSecret = 'test-master-secret';
      const guardianEmail = 'guardian@example.com';
      const fragmentIndex = 1;
      
      const passphrase1 = deriveGuardianPassphrase(masterSecret, guardianEmail, fragmentIndex);
      const passphrase2 = deriveGuardianPassphrase(masterSecret, guardianEmail, fragmentIndex);
      
      expect(passphrase1).toBe(passphrase2);
    });

    it('should derive different passphrases for different guardians', () => {
      const masterSecret = 'test-master-secret';
      
      const passphrase1 = deriveGuardianPassphrase(masterSecret, 'guardian1@example.com', 0);
      const passphrase2 = deriveGuardianPassphrase(masterSecret, 'guardian2@example.com', 0);
      
      expect(passphrase1).not.toBe(passphrase2);
    });

    it('should derive different passphrases for different fragment indices', () => {
      const masterSecret = 'test-master-secret';
      const guardianEmail = 'guardian@example.com';
      
      const passphrase1 = deriveGuardianPassphrase(masterSecret, guardianEmail, 0);
      const passphrase2 = deriveGuardianPassphrase(masterSecret, guardianEmail, 1);
      
      expect(passphrase1).not.toBe(passphrase2);
    });
  });
});

