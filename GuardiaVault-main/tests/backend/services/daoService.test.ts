/**
 * DAO Verification Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ethers } from "ethers";
import { DAOVerificationService } from "../../../server/services/daoService";

describe("DAOVerificationService", () => {
  let service: DAOVerificationService;

  beforeEach(() => {
    service = new DAOVerificationService();
    // Initialize with mock contract for testing
    const mockProvider = new ethers.JsonRpcProvider("http://localhost:8545");
    const mockContract = {
      getVerifier: vi.fn().mockResolvedValue([
        true, // isActive
        "1000000000000000000", // stake
        100, // reputation
        50, // totalVotes
        45, // correctVotes
      ]),
      createClaim: vi.fn().mockResolvedValue({
        wait: vi.fn().mockResolvedValue({
          logs: [],
          transactionHash: "0x1234567890abcdef",
        }),
      }),
      vote: vi.fn().mockResolvedValue({
        wait: vi.fn().mockResolvedValue({
          transactionHash: "0x1234567890abcdef",
        }),
      }),
    } as any;
    
    // Mock the contract initialization
    (service as any).daoContract = mockContract;
    (service as any).provider = mockProvider;
  });

  describe("getVerifierStats", () => {
    it("should return verifier stats structure", async () => {
      const stats = await service.getVerifierStats("0x1234567890abcdef");
      
      expect(stats).toHaveProperty("isActive");
      expect(stats).toHaveProperty("stake");
      expect(stats).toHaveProperty("reputation");
      expect(stats).toHaveProperty("totalVotes");
      expect(stats).toHaveProperty("correctVotes");
    });
  });

  describe("createClaim", () => {
    it("should create a claim and return claim ID", async () => {
      // Mock signer
      const mockSigner = {
        address: "0x1234567890abcdef",
      } as any;

      const result = await service.createClaim(
        1,
        "0x1234567890abcdef",
        "Test reason for claim",
        mockSigner
      );

      expect(result).toHaveProperty("claimId");
      expect(result).toHaveProperty("txHash");
      expect(typeof result.claimId).toBe("number");
    });
  });

  describe("voteOnClaim", () => {
    it("should process vote and return transaction hash", async () => {
      const mockSigner = {
        address: "0x1234567890abcdef",
      } as any;

      const result = await service.voteOnClaim(
        1,
        "0x1234567890abcdef",
        true,
        mockSigner
      );

      expect(result).toHaveProperty("txHash");
      expect(result).toHaveProperty("reputationChange");
    });
  });
});

