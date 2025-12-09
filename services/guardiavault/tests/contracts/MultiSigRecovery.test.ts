/**
 * MultiSigRecovery Contract Tests
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MultiSigRecovery } from "../../typechain-types";

describe("MultiSigRecovery", function () {
  let recovery: MultiSigRecovery;
  let owner: any;
  let key1: any, key2: any, key3: any;

  beforeEach(async function () {
    [owner, key1, key2, key3] = await ethers.getSigners();

    const MultiSigRecoveryFactory = await ethers.getContractFactory("MultiSigRecovery");
    recovery = await MultiSigRecoveryFactory.deploy();
    await recovery.waitForDeployment();
  });

  describe("Recovery Creation", function () {
    it("Should create a recovery with 3 recovery keys", async function () {
      const walletAddress = owner.address;
      const encryptedData = "0x1234567890abcdef";
      const recoveryKeys: [string, string, string] = [key1.address, key2.address, key3.address];

      const tx = await recovery.createRecovery(walletAddress, recoveryKeys, encryptedData);
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = recovery.interface.parseLog(log);
          return parsed?.name === "RecoveryCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it.skip("Should revert if recovery keys are not exactly 3", async function () {
      // Skip: TypeScript/Ethers.js prevents wrong array length at encode time
      // This is tested at the contract level, not test level
      const recoveryKeysWrong: any = [key1.address, key2.address]; // Only 2

      await expect(
        recovery.createRecovery(owner.address, recoveryKeysWrong, "0x1234")
      ).to.be.reverted;
    });
  });

  describe("Recovery Attestation", function () {
    let recoveryId: bigint;

    beforeEach(async function () {
      const recoveryKeys: [string, string, string] = [key1.address, key2.address, key3.address];
      const tx = await recovery.createRecovery(
        owner.address,
        recoveryKeys,
        "0x1234567890abcdef"
      );
      const receipt = await tx.wait();
      const event = recovery.interface.parseLog(receipt!.logs[receipt!.logs.length - 1] as any);
      recoveryId = event!.args.recoveryId;
    });

    it("Should allow recovery keys to attest", async function () {
      await expect(recovery.connect(key1).attestRecovery(recoveryId)).to.not.be.reverted;
    });

    it("Should trigger recovery when 2 of 3 keys attest", async function () {
      await recovery.connect(key1).attestRecovery(recoveryId);
      await recovery.connect(key2).attestRecovery(recoveryId);

      const recoveryData = await recovery.getRecovery(recoveryId);
      expect(recoveryData.status).to.equal(1); // Triggered
    });

    it("Should revert if non-key tries to attest", async function () {
      const nonKey = owner;
      await expect(
        recovery.connect(nonKey).attestRecovery(recoveryId)
      ).to.be.reverted;
    });
  });

  describe("Recovery Completion", function () {
    let recoveryId: bigint;

    beforeEach(async function () {
      const recoveryKeys: [string, string, string] = [key1.address, key2.address, key3.address];
      const tx = await recovery.createRecovery(
        owner.address,
        recoveryKeys,
        "0x1234567890abcdef"
      );
      const receipt = await tx.wait();
      const event = recovery.interface.parseLog(receipt!.logs[receipt!.logs.length - 1] as any);
      recoveryId = event!.args.recoveryId;

      // Trigger recovery
      await recovery.connect(key1).attestRecovery(recoveryId);
      await recovery.connect(key2).attestRecovery(recoveryId);
    });

    it("Should allow completion after 7-day time lock", async function () {
      await time.increase(8 * 24 * 60 * 60); // 8 days

      await expect(recovery.completeRecovery(recoveryId)).to.not.be.reverted;
    });

    it("Should revert completion before time lock expires", async function () {
      await expect(recovery.completeRecovery(recoveryId)).to.be.reverted;
    });
  });
});

