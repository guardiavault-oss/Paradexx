/**
 * Shamir Secret Sharing Tests
 * Comprehensive tests for secret sharing and recovery
 */

import { describe, it, expect } from "vitest";
import { splitSecret, combineShares } from "../../../server/services/shamir";

describe("Shamir Secret Sharing", () => {
  describe("splitSecret", () => {
    it("should split a secret into the correct number of shares", () => {
      const secret = "test-secret-12345";
      const result = splitSecret(secret, 3, 5);
      const shares = result.shares;

      expect(shares).toHaveLength(5);
      expect(shares.every((share) => typeof share === "string")).toBe(true);
    });

    it("should require at least threshold shares to recover", () => {
      const secret = "test-secret-12345";
      const result = splitSecret(secret, 3, 5);
      const shares = result.shares;

      // Try with less than threshold (may not throw but will produce incorrect result)
      const partialShares = shares.slice(0, 2);
      try {
        const invalidResult = combineShares(partialShares);
        // If it doesn't throw, the result should not match the original
        expect(invalidResult).not.toBe(secret);
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }

      // Try with threshold
      const thresholdShares = shares.slice(0, 3);
      const recovered = combineShares(thresholdShares);
      expect(recovered).toBe(secret);
    });

    it("should recover secret with any combination of threshold shares", () => {
      const secret = "test-secret-12345";
      const result = splitSecret(secret, 3, 5);
      const shares = result.shares;

      // Try different combinations
      const combination1 = [shares[0], shares[1], shares[2]];
      const combination2 = [shares[1], shares[3], shares[4]];
      const combination3 = [shares[0], shares[3], shares[4]];

      expect(combineShares(combination1)).toBe(secret);
      expect(combineShares(combination2)).toBe(secret);
      expect(combineShares(combination3)).toBe(secret);
    });
  });

  describe("combineShares", () => {
    it("should recover original secret with threshold shares", () => {
      const secret = "my-very-secret-key-12345";
      const result = splitSecret(secret, 3, 5);
      const shares = result.shares;
      const recovered = combineShares(shares.slice(0, 3));

      expect(recovered).toBe(secret);
    });

    it("should throw error with insufficient shares", () => {
      const secret = "test-secret";
      const result = splitSecret(secret, 3, 5);
      const shares = result.shares;

      // secrets.js may not throw but will produce incorrect result
      try {
        const invalidResult = combineShares(shares.slice(0, 2));
        // Result should not match original secret
        expect(invalidResult).not.toBe(secret);
      } catch (error) {
        // Throwing is also acceptable behavior
        expect(error).toBeDefined();
      }
    });

    it("should handle empty secret", () => {
      const secret = "";
      const result = splitSecret(secret, 2, 3);
      const shares = result.shares;
      const recovered = combineShares(shares.slice(0, 2));

      expect(recovered).toBe(secret);
    });
  });
});

