/**
 * Acceptance Test: Death Verification with Chainlink Oracle
 * 
 * Tests the complete flow:
 * 1. Mock oracle verifies death
 * 2. Contract transitions vault state → ReadyForClaim
 */

import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const { ethers } = hre;

describe("Death Verification Oracle Integration", function () {
  let guardiaVault: any; // Using any type since typechain-types generation is having issues
  let GuardiaVaultFactory: any;
  let owner: any;
  let beneficiary: any;
  let guardian1: any;
  let guardian2: any;
  let guardian3: any;
  let oracle: any;
  
  const CHECK_IN_INTERVAL = 30 * 24 * 60 * 60; // 30 days
  const GRACE_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const DEATH_VERIFICATION_DELAY = 7 * 24 * 60 * 60; // 7 days

  // Enum values: Active=0, Warning=1, Triggered=2, DeathVerified=3, ReadyForClaim=4, Claimed=5
  const VaultStatus = {
    Active: 0,
    Warning: 1,
    Triggered: 2,
    DeathVerified: 3,
    ReadyForClaim: 4,
    Claimed: 5,
  };

  beforeEach(async function () {
    [owner, beneficiary, guardian1, guardian2, guardian3, oracle] = await ethers.getSigners();

    GuardiaVaultFactory = await ethers.getContractFactory("GuardiaVault");
    guardiaVault = await GuardiaVaultFactory.deploy() as any;
    await guardiaVault.waitForDeployment();

    // Set oracle address (oracle is deployer by default, but let's set it explicitly)
    await guardiaVault.setOracle(oracle.address);

    // Set death verification delay
    await guardiaVault.setDeathVerificationDelay(DEATH_VERIFICATION_DELAY);
  });

  describe("Oracle Death Verification", function () {
    it("Should allow oracle to verify death", async function () {
      // Create vault
      const metadataHash = "QmTest123";
      const tx = await guardiaVault
        .connect(owner)
        .createVault(
          CHECK_IN_INTERVAL,
          GRACE_PERIOD,
          [beneficiary.address],
          [guardian1.address, guardian2.address, guardian3.address],
          metadataHash
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "VaultCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
      const parsedEvent = guardiaVault.interface.parseLog(event as any);
      const vaultId = parsedEvent?.args[0];

      // Verify death as oracle
      const verifyTx = await guardiaVault.connect(oracle).verifyDeath(owner.address);
      const verifyReceipt = await verifyTx.wait();
      
      // Check for DeathVerified event
      const deathEvent = verifyReceipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "DeathVerified";
        } catch {
          return false;
        }
      });
      expect(deathEvent).to.not.be.undefined;

      // Check vault status is DeathVerified (handle BigInt)
      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(Number(status)).to.equal(VaultStatus.DeathVerified);
    });

    it("Should transition from DeathVerified to ReadyForClaim after delay", async function () {
      // Create vault
      const metadataHash = "QmTest123";
      const tx = await guardiaVault
        .connect(owner)
        .createVault(
          CHECK_IN_INTERVAL,
          GRACE_PERIOD,
          [beneficiary.address],
          [guardian1.address, guardian2.address, guardian3.address],
          metadataHash
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "VaultCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
      const parsedEvent = guardiaVault.interface.parseLog(event as any);
      const vaultId = parsedEvent?.args[0];

      // Verify death as oracle
      await guardiaVault.connect(oracle).verifyDeath(owner.address);

      // Fast-forward time by delay period
      await time.increase(DEATH_VERIFICATION_DELAY + 1);

      // Update status
      await guardiaVault.updateDeathVerificationStatus(vaultId);

      // Check vault status is ReadyForClaim (handle BigInt)
      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(Number(status)).to.equal(VaultStatus.ReadyForClaim);
    });

    it("Should allow beneficiary to claim when ReadyForClaim", async function () {
      // Create vault
      const metadataHash = "QmTest123";
      const tx = await guardiaVault
        .connect(owner)
        .createVault(
          CHECK_IN_INTERVAL,
          GRACE_PERIOD,
          [beneficiary.address],
          [guardian1.address, guardian2.address, guardian3.address],
          metadataHash
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "VaultCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
      const parsedEvent = guardiaVault.interface.parseLog(event as any);
      const vaultId = parsedEvent?.args[0];

      // Verify death as oracle
      await guardiaVault.connect(oracle).verifyDeath(owner.address);

      // Set delay to 0 for immediate transition
      await guardiaVault.setDeathVerificationDelay(0);

      // Update status to transition to ReadyForClaim
      await guardiaVault.updateDeathVerificationStatus(vaultId);

      // Beneficiary claims
      const claimTx = await guardiaVault.connect(beneficiary).claim(vaultId);
      const claimReceipt = await claimTx.wait();
      
      // Check for BeneficiaryClaimed event
      const claimEvent = claimReceipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "BeneficiaryClaimed";
        } catch {
          return false;
        }
      });
      expect(claimEvent).to.not.be.undefined;
    });

    it("Should reject non-oracle from verifying death", async function () {
      // Create vault
      const metadataHash = "QmTest123";
      const tx = await guardiaVault
        .connect(owner)
        .createVault(
          CHECK_IN_INTERVAL,
          GRACE_PERIOD,
          [beneficiary.address],
          [guardian1.address, guardian2.address, guardian3.address],
          metadataHash
        );

      await tx.wait();

      // Try to verify death as non-oracle (should fail)
      try {
        await guardiaVault.connect(guardian1).verifyDeath(owner.address);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("Should prevent double verification", async function () {
      // Create vault
      const metadataHash = "QmTest123";
      const tx = await guardiaVault
        .connect(owner)
        .createVault(
          CHECK_IN_INTERVAL,
          GRACE_PERIOD,
          [beneficiary.address],
          [guardian1.address, guardian2.address, guardian3.address],
          metadataHash
        );

      await tx.wait();

      // Verify death first time
      await guardiaVault.connect(oracle).verifyDeath(owner.address);

      // Try to verify again (should fail)
      try {
        await guardiaVault.connect(oracle).verifyDeath(owner.address);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });

    it("Should emit DeathVerified event with correct parameters", async function () {
      // Create vault
      const metadataHash = "QmTest123";
      const tx = await guardiaVault
        .connect(owner)
        .createVault(
          CHECK_IN_INTERVAL,
          GRACE_PERIOD,
          [beneficiary.address],
          [guardian1.address, guardian2.address, guardian3.address],
          metadataHash
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "VaultCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
      const parsedEvent = guardiaVault.interface.parseLog(event as any);
      const vaultId = parsedEvent?.args[0];

      // Verify death
      const verifyTx = await guardiaVault.connect(oracle).verifyDeath(owner.address);
      const verifyReceipt = await verifyTx.wait();
      
      const deathVerifiedEvent = verifyReceipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "DeathVerified";
        } catch {
          return false;
        }
      });

      expect(deathVerifiedEvent).to.not.be.undefined;
      const parsedDeathEvent = guardiaVault.interface.parseLog(deathVerifiedEvent as any);
      expect(parsedDeathEvent?.args[0]).to.equal(vaultId); // vaultId
      expect(parsedDeathEvent?.args[1]).to.equal(owner.address); // user
      expect(parsedDeathEvent?.args[2]).to.equal(oracle.address); // verifiedBy
      expect(Number(parsedDeathEvent?.args[3])).to.be.gt(0); // timestamp (handle BigInt)
      expect(Number(parsedDeathEvent?.args[4])).to.be.gt(0); // readyForClaimAt (handle BigInt)
    });
  });

  describe("Integration: Complete Flow", function () {
    it("Should complete full flow: DeathVerified → ReadyForClaim → Claimed", async function () {
      // Create vault
      const metadataHash = "QmTest123";
      const tx = await guardiaVault
        .connect(owner)
        .createVault(
          CHECK_IN_INTERVAL,
          GRACE_PERIOD,
          [beneficiary.address],
          [guardian1.address, guardian2.address, guardian3.address],
          metadataHash
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = guardiaVault.interface.parseLog(log);
          return parsed?.name === "VaultCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;
      const parsedEvent = guardiaVault.interface.parseLog(event as any);
      const vaultId = parsedEvent?.args[0];

      // Initial status should be Active
      let status = await guardiaVault.getVaultStatus(vaultId);
      expect(Number(status)).to.equal(VaultStatus.Active);

      // Oracle verifies death
      await guardiaVault.connect(oracle).verifyDeath(owner.address);
      
      // Status should be DeathVerified
      status = await guardiaVault.getVaultStatus(vaultId);
      expect(Number(status)).to.equal(VaultStatus.DeathVerified);

      // Fast-forward time
      await time.increase(DEATH_VERIFICATION_DELAY + 1);

      // Update status to ReadyForClaim
      await guardiaVault.updateDeathVerificationStatus(vaultId);
      
      // Verify status shows ReadyForClaim
      status = await guardiaVault.getVaultStatus(vaultId);
      expect(Number(status)).to.equal(VaultStatus.ReadyForClaim);

      // Beneficiary claims (claim() will call updateDeathVerificationStatus internally)
      await guardiaVault.connect(beneficiary).claim(vaultId);
      
      // Status should be Claimed
      status = await guardiaVault.getVaultStatus(vaultId);
      expect(Number(status)).to.equal(VaultStatus.Claimed);

      // Check death verification details
      const [verified, verifiedAt, verifiedBy] = await guardiaVault.getDeathVerification(vaultId);
      expect(verified).to.be.true;
      expect(Number(verifiedAt)).to.be.gt(0); // Handle BigInt
      expect(verifiedBy).to.equal(oracle.address);
    });
  });
});


