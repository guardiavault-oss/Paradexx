/**
 * GuardiaVault Contract Tests
 * Comprehensive tests for the main vault contract
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { GuardiaVault } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GuardiaVault", function () {
  let vault: GuardiaVault;
  let owner: any;
  let guardian1: any, guardian2: any, guardian3: any;
  let beneficiary1: any, beneficiary2: any;

  beforeEach(async function () {
    [owner, guardian1, guardian2, guardian3, beneficiary1, beneficiary2] =
      await ethers.getSigners();

    const GuardiaVaultFactory = await ethers.getContractFactory("GuardiaVault");
    vault = await GuardiaVaultFactory.deploy();
    await vault.waitForDeployment();
  });

  describe("Vault Creation", function () {
    it("Should create a vault with 3 guardians", async function () {
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const checkInInterval = 30 * 24 * 60 * 60; // 30 days (minimum)
      const gracePeriod = 7 * 24 * 60 * 60; // 7 days (minimum)
      const metadataHash = "QmTestHash123";
      const guardiansArray: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];

      const tx = await vault.createVault(
        checkInInterval,
        gracePeriod,
        beneficiaries,
        guardiansArray,
        metadataHash
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = vault.interface.parseLog(log);
          return parsed?.name === "VaultCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it.skip("Should revert if guardians array is not exactly 3", async function () {
      // Skip: TypeScript/Ethers.js prevents wrong array length at encode time
      // This is tested at the contract level, not test level
      const beneficiaries = [beneficiary1.address];
      const guardiansWrong: any = [guardian1.address, guardian2.address]; // Only 2

      await expect(
        vault.createVault(
          30 * 24 * 60 * 60,
          7 * 24 * 60 * 60,
          beneficiaries,
          guardiansWrong,
          "QmHash"
        )
      ).to.be.reverted;
    });

    it("Should revert if check-in interval is too short", async function () {
      const beneficiaries = [beneficiary1.address];
      const guardiansArray: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];

      await expect(
        vault.createVault(
          1, // Too short
          7 * 24 * 60 * 60,
          beneficiaries,
          guardiansArray,
          "QmHash"
        )
      ).to.be.reverted;
    });
  });

  describe("Check-In", function () {
    let vaultId: bigint;

    beforeEach(async function () {
      const beneficiaries = [beneficiary1.address];
      const guardiansArray: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const tx = await vault.createVault(
        30 * 24 * 60 * 60,
        7 * 24 * 60 * 60,
        beneficiaries,
        guardiansArray,
        "QmHash"
      );
      const receipt = await tx.wait();
      const event = vault.interface.parseLog(receipt!.logs[receipt!.logs.length - 1] as any);
      vaultId = event!.args.vaultId;
    });

    it("Should allow owner to check in", async function () {
      await expect(vault.checkIn(vaultId)).to.not.be.reverted;
    });

    it("Should update last check-in timestamp", async function () {
      const before = await time.latest();
      await vault.checkIn(vaultId);
      const vaultData = await vault.getVault(vaultId);
      expect(vaultData.lastCheckIn).to.be.gte(before);
    });

    it("Should clear guardian attestations on check-in", async function () {
      // Attest death with only one guardian (not enough to trigger)
      await vault.connect(guardian1).attestDeath(vaultId);
      
      // Verify attestation count is 1
      expect(await vault.getGuardianAttestationCount(vaultId)).to.equal(1);

      // Check in should clear attestations (vault is not triggered yet)
      await vault.checkIn(vaultId);
      const count = await vault.getGuardianAttestationCount(vaultId);
      expect(count).to.equal(0);
    });
  });

  describe("Guardian Attestation", function () {
    let vaultId: bigint;

    beforeEach(async function () {
      const beneficiaries = [beneficiary1.address];
      const guardiansArray: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const tx = await vault.createVault(
        30 * 24 * 60 * 60,
        7 * 24 * 60 * 60,
        beneficiaries,
        guardiansArray,
        "QmHash"
      );
      const receipt = await tx.wait();
      const event = vault.interface.parseLog(receipt!.logs[receipt!.logs.length - 1] as any);
      vaultId = event!.args.vaultId;
    });

    it("Should allow guardians to attest death", async function () {
      await expect(vault.connect(guardian1).attestDeath(vaultId)).to.not.be.reverted;
    });

    it("Should trigger vault when 2 of 3 guardians attest", async function () {
      await vault.connect(guardian1).attestDeath(vaultId);
      await vault.connect(guardian2).attestDeath(vaultId);

      const vaultData = await vault.getVault(vaultId);
      expect(vaultData.status).to.equal(2); // Triggered (VaultStatus.Triggered = 2)
    });

    it("Should enforce cooldown between attestations", async function () {
      await vault.connect(guardian1).attestDeath(vaultId);
      
      // Try to attest again immediately - should fail with cooldown
      await expect(
        vault.connect(guardian1).attestDeath(vaultId)
      ).to.be.revertedWithCustomError(vault, "AttestationCooldown");

      // Advance time by 24 hours + 1 second
      await time.increase(24 * 60 * 60 + 1);
      
      // Now should fail with AlreadyAttested since guardian already attested
      await expect(
        vault.connect(guardian1).attestDeath(vaultId)
      ).to.be.revertedWithCustomError(vault, "AlreadyAttested");
    });

    it("Should revert if non-guardian tries to attest", async function () {
      const nonGuardian = beneficiary1;
      await expect(
        vault.connect(nonGuardian).attestDeath(vaultId)
      ).to.be.reverted;
    });
  });

  describe("Claim", function () {
    let vaultId: bigint;

    beforeEach(async function () {
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const guardiansArray: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const tx = await vault.createVault(
        30 * 24 * 60 * 60,
        7 * 24 * 60 * 60,
        beneficiaries,
        guardiansArray,
        "QmHash"
      );
      const receipt = await tx.wait();
      const event = vault.interface.parseLog(receipt!.logs[receipt!.logs.length - 1] as any);
      vaultId = event!.args.vaultId;

      // Trigger vault
      await vault.connect(guardian1).attestDeath(vaultId);
      await vault.connect(guardian2).attestDeath(vaultId);
    });

    it("Should allow beneficiaries to claim", async function () {
      await expect(vault.connect(beneficiary1).claim(vaultId)).to.not.be.reverted;
    });

    it("Should emit metadata hash on claim", async function () {
      const tx = await vault.connect(beneficiary1).claim(vaultId);
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = vault.interface.parseLog(log);
          return parsed?.name === "BeneficiaryClaimed";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("Should prevent double claiming", async function () {
      await vault.connect(beneficiary1).claim(vaultId);
      await expect(
        vault.connect(beneficiary1).claim(vaultId)
      ).to.be.reverted;
    });

    it("Should revert if non-beneficiary tries to claim", async function () {
      const nonBeneficiary = guardian1;
      await expect(
        vault.connect(nonBeneficiary).claim(vaultId)
      ).to.be.reverted;
    });
  });

  describe("Emergency Revoke", function () {
    let vaultId: bigint;

    beforeEach(async function () {
      const beneficiaries = [beneficiary1.address];
      const guardiansArray: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const tx = await vault.createVault(
        30 * 24 * 60 * 60,
        7 * 24 * 60 * 60,
        beneficiaries,
        guardiansArray,
        "QmHash"
      );
      const receipt = await tx.wait();
      const event = vault.interface.parseLog(receipt!.logs[receipt!.logs.length - 1] as any);
      vaultId = event!.args.vaultId;

      // Trigger vault
      await vault.connect(guardian1).attestDeath(vaultId);
      await vault.connect(guardian2).attestDeath(vaultId);
    });

    it("Should allow owner to revoke within 7 days", async function () {
      await expect(vault.emergencyRevoke(vaultId)).to.not.be.reverted;
    });

    it("Should restore vault to active status", async function () {
      await vault.emergencyRevoke(vaultId);
      const vaultData = await vault.getVault(vaultId);
      expect(vaultData.status).to.equal(0); // Active
    });

    it("Should revert revoke after 7 days", async function () {
      await time.increase(8 * 24 * 60 * 60); // 8 days
      await expect(vault.emergencyRevoke(vaultId)).to.be.reverted;
    });

    it("Should revert if non-owner tries to revoke", async function () {
      await expect(
        vault.connect(guardian1).emergencyRevoke(vaultId)
      ).to.be.reverted;
    });
  });
});

