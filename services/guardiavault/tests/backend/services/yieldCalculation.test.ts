/**
 * Yield Calculation Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { YieldCalculationService } from "../../../server/services/yieldCalculation";

describe("YieldCalculationService", () => {
  let service: YieldCalculationService;

  beforeEach(() => {
    service = new YieldCalculationService();
  });

  describe("getProtocolAPY", () => {
    it("should return APY for Lido", async () => {
      const apy = await service.getProtocolAPY("lido");
      expect(apy).toBeGreaterThan(0);
      expect(apy).toBeLessThan(10);
    });

    it("should return APY for Aave with asset", async () => {
      const apy = await service.getProtocolAPY("aave", "usdc");
      expect(apy).toBeGreaterThan(0);
    });

    it("should return default APY for unknown protocol", async () => {
      const apy = await service.getProtocolAPY("unknown");
      expect(apy).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe("calculateVaultYield", () => {
    it("should calculate yield correctly for 30 days", async () => {
      const principal = "1000";
      const daysSinceLastUpdate = 30;

      const result = await service.calculateVaultYield(
        "vault-1",
        principal,
        "lido",
        "ETH",
        daysSinceLastUpdate
      );

      expect(result.yieldEarned).toBeDefined();
      expect(parseFloat(result.yieldEarned)).toBeGreaterThan(0);
      expect(parseFloat(result.performanceFee)).toBeGreaterThan(0);
      expect(parseFloat(result.newTotalValue)).toBeGreaterThan(
        parseFloat(principal)
      );
    });

    it("should calculate performance fee as 1% of yield", async () => {
      const principal = "10000";
      const daysSinceLastUpdate = 90;

      const result = await service.calculateVaultYield(
        "vault-1",
        principal,
        "aave",
        "USDC",
        daysSinceLastUpdate
      );

      const yieldAmount = parseFloat(result.yieldEarned);
      const feeAmount = parseFloat(result.performanceFee);
      const expectedFee = yieldAmount * 0.01;

      expect(feeAmount).toBeCloseTo(expectedFee, 2);
    });

    it("should handle zero days since update", async () => {
      const result = await service.calculateVaultYield(
        "vault-1",
        "1000",
        "lido",
        "ETH",
        0
      );

      expect(parseFloat(result.yieldEarned)).toBe(0);
      expect(parseFloat(result.performanceFee)).toBe(0);
      expect(result.newTotalValue).toBe("1000");
    });
  });

  describe("updateAllVaults", () => {
    it("should process all vaults without error", async () => {
      const results = await service.updateAllVaults();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

