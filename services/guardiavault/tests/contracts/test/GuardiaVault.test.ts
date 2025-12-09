import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { GuardiaVault } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GuardiaVault", function () {
  // Constants from contract
  const ONE_DAY = 24 * 60 * 60;
  const MIN_CHECK_IN_INTERVAL = 30 * ONE_DAY; // Contract requires 30 days minimum
  const MAX_CHECK_IN_INTERVAL = 365 * ONE_DAY;
  const MIN_GRACE_PERIOD = 7 * ONE_DAY; // Contract requires 7 days minimum
  const MAX_GRACE_PERIOD = 90 * ONE_DAY;

  // Test fixture for deploying contract and setting up test accounts
  async function deployGuardiaVaultFixture() {
    const [owner, beneficiary1, beneficiary2, beneficiary3, guardian1, guardian2, guardian3, otherAccount] = 
      await ethers.getSigners();

    const GuardiaVault = await ethers.getContractFactory("GuardiaVault");
    const guardiaVault = await GuardiaVault.deploy();

    return {
      guardiaVault,
      owner,
      beneficiary1,
      beneficiary2,
      beneficiary3,
      guardian1,
      guardian2,
      guardian3,
      otherAccount,
    };
  }

  // Fixture with a pre-created vault for testing
  async function deployWithVaultFixture() {
    const fixtures = await deployGuardiaVaultFixture();
    const { guardiaVault, owner, beneficiary1, beneficiary2, guardian1, guardian2, guardian3 } = fixtures;

    const checkInInterval = 30 * ONE_DAY; // 30 days (minimum required)
    const gracePeriod = 7 * ONE_DAY; // 7 days (minimum required)
    const beneficiaries = [beneficiary1.address, beneficiary2.address];
    const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
    const metadataHash = "QmTestHash123456789";

    const tx = await guardiaVault.connect(owner).createVault(
      checkInInterval,
      gracePeriod,
      beneficiaries,
      guardians,
      metadataHash
    );

    return {
      ...fixtures,
      vaultId: 0,
      checkInInterval,
      gracePeriod,
      beneficiaries,
      guardians,
      metadataHash,
    };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { guardiaVault } = await loadFixture(deployGuardiaVaultFixture);
      expect(await guardiaVault.getAddress()).to.be.properAddress;
    });

    it("Should start with nextVaultId of 0", async function () {
      const { guardiaVault } = await loadFixture(deployGuardiaVaultFixture);
      expect(await guardiaVault.getNextVaultId()).to.equal(0);
    });
  });

  describe("Vault Creation", function () {
    it("Should create a vault with valid parameters", async function () {
      const { guardiaVault, owner, beneficiary1, beneficiary2, guardian1, guardian2, guardian3 } = 
        await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.emit(guardiaVault, "VaultCreated")
        .withArgs(0, owner.address, checkInInterval, gracePeriod, beneficiaries.length, guardians);
    });

    it("Should increment vault IDs correctly", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await guardiaVault.connect(owner).createVault(
        checkInInterval,
        gracePeriod,
        beneficiaries,
        guardians,
        metadataHash
      );

      expect(await guardiaVault.getNextVaultId()).to.equal(1);

      await guardiaVault.connect(owner).createVault(
        checkInInterval,
        gracePeriod,
        beneficiaries,
        guardians,
        metadataHash
      );

      expect(await guardiaVault.getNextVaultId()).to.equal(2);
    });

    it("Should set correct vault properties", async function () {
      const { guardiaVault, owner, beneficiary1, beneficiary2, guardian1, guardian2, guardian3 } = 
        await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await guardiaVault.connect(owner).createVault(
        checkInInterval,
        gracePeriod,
        beneficiaries,
        guardians,
        metadataHash
      );

      const vault = await guardiaVault.getVault(0);
      expect(vault.owner).to.equal(owner.address);
      expect(vault.checkInInterval).to.equal(checkInInterval);
      expect(vault.gracePeriod).to.equal(gracePeriod);
      expect(vault.beneficiaries).to.deep.equal(beneficiaries);
      expect(vault.metadataHash).to.equal(metadataHash);
      expect(vault.status).to.equal(0); // VaultStatus.Active
    });

    it("Should reject check-in interval below minimum", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = MIN_CHECK_IN_INTERVAL - 1;
      const gracePeriod = 3 * ONE_DAY;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidCheckInInterval");
    });

    it("Should reject check-in interval above maximum", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = MAX_CHECK_IN_INTERVAL + 1;
      const gracePeriod = 3 * ONE_DAY;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidCheckInInterval");
    });

    it("Should reject grace period below minimum", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY; // Valid check-in interval
      const gracePeriod = MIN_GRACE_PERIOD - 1;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidGracePeriod");
    });

    it("Should reject grace period above maximum", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY; // Valid check-in interval
      const gracePeriod = MAX_GRACE_PERIOD + 1;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidGracePeriod");
    });

    it("Should reject empty beneficiaries array", async function () {
      const { guardiaVault, owner, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries: string[] = [];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidBeneficiaryCount");
    });

    it("Should reject too many beneficiaries", async function () {
      const { guardiaVault, owner, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      // Create 11 beneficiaries (MAX is 10)
      const beneficiaries = Array(11).fill(0).map((_, i) => 
        ethers.Wallet.createRandom().address
      );
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidBeneficiaryCount");
    });

    it("Should reject zero address as beneficiary", async function () {
      const { guardiaVault, owner, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = [ethers.ZeroAddress];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidBeneficiary");
    });

    it("Should reject owner as beneficiary", async function () {
      const { guardiaVault, owner, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = [owner.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidBeneficiary");
    });

    it("Should reject duplicate beneficiaries", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = [beneficiary1.address, beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "DuplicateBeneficiary");
    });

    it("Should reject empty metadata hash", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidBeneficiary");
    });
  });

  describe("Check-in Functionality", function () {
    it("Should allow owner to check in", async function () {
      const { guardiaVault, owner, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      const initialCheckIn = (await guardiaVault.getVault(vaultId)).lastCheckIn;
      
      // Move forward in time
      await time.increase(2 * ONE_DAY);

      await expect(guardiaVault.connect(owner).checkIn(vaultId))
        .to.emit(guardiaVault, "CheckInPerformed");

      const vault = await guardiaVault.getVault(vaultId);
      expect(vault.lastCheckIn).to.be.greaterThan(initialCheckIn);
    });

    it("Should reset timer on check-in", async function () {
      const { guardiaVault, owner, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      // Move forward 6 days (before deadline)
      await time.increase(6 * ONE_DAY);

      const beforeCheckIn = await time.latest();
      await guardiaVault.connect(owner).checkIn(vaultId);
      const afterCheckIn = await time.latest();

      const vault = await guardiaVault.getVault(vaultId);
      expect(vault.lastCheckIn).to.be.greaterThanOrEqual(beforeCheckIn);
      expect(vault.lastCheckIn).to.be.lessThanOrEqual(afterCheckIn);
    });

    it("Should update status to Active on check-in", async function () {
      const { guardiaVault, owner, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move to warning period
      await time.increase(checkInInterval + ONE_DAY);
      
      // Status should be Warning
      await guardiaVault.updateVaultStatus(vaultId);
      let vault = await guardiaVault.getVault(vaultId);
      expect(vault.status).to.equal(1); // Warning

      // Check in
      await guardiaVault.connect(owner).checkIn(vaultId);

      vault = await guardiaVault.getVault(vaultId);
      expect(vault.status).to.equal(0); // Active
    });

    it("Should clear attestations on check-in", async function () {
      const { guardiaVault, owner, vaultId, guardian1 } = 
        await loadFixture(deployWithVaultFixture);

      // Guardians are already set in vault (from creation)
      // Only one guardian attests (not enough to trigger vault)
      await guardiaVault.connect(guardian1).attestDeath(vaultId);

      expect(await guardiaVault.getGuardianAttestationCount(vaultId)).to.equal(1);

      // Owner checks in (vault is not triggered yet, so checkIn should succeed)
      await guardiaVault.connect(owner).checkIn(vaultId);

      // Attestations should be cleared
      expect(await guardiaVault.getGuardianAttestationCount(vaultId)).to.equal(0);
    });

    it("Should reject check-in from non-owner", async function () {
      const { guardiaVault, otherAccount, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await expect(
        guardiaVault.connect(otherAccount).checkIn(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "Unauthorized");
    });

    it("Should reject check-in for non-existent vault", async function () {
      const { guardiaVault, owner } = await loadFixture(deployGuardiaVaultFixture);

      await expect(
        guardiaVault.connect(owner).checkIn(999)
      ).to.be.revertedWithCustomError(guardiaVault, "VaultNotFound");
    });

    it("Should reject check-in after vault is claimed", async function () {
      const { guardiaVault, owner, beneficiary1, beneficiary2, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + ONE_DAY);

      // Beneficiaries claim
      await guardiaVault.connect(beneficiary1).claim(vaultId);
      await guardiaVault.connect(beneficiary2).claim(vaultId);

      // Try to check in
      await expect(
        guardiaVault.connect(owner).checkIn(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidStatus");
    });

    it("Should reject check-in after vault is Triggered", async function () {
      const { guardiaVault, owner, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + ONE_DAY);

      // Update status to Triggered
      await guardiaVault.updateVaultStatus(vaultId);

      // Verify vault is triggered
      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(2); // Triggered

      // Try to check in - should fail
      await expect(
        guardiaVault.connect(owner).checkIn(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidStatus");
    });

    it("Should allow check-in when vault is in Warning status", async function () {
      const { guardiaVault, owner, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      // Move to warning period (past deadline but within grace period)
      await time.increase(checkInInterval + ONE_DAY);

      // Update status to Warning
      await guardiaVault.updateVaultStatus(vaultId);
      let status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(1); // Warning

      // Check in should succeed
      await expect(guardiaVault.connect(owner).checkIn(vaultId))
        .to.emit(guardiaVault, "CheckInPerformed");

      // Status should be Active again
      status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(0); // Active
    });
  });

  describe("Status Transitions", function () {
    it("Should start in Active status", async function () {
      const { guardiaVault, vaultId } = await loadFixture(deployWithVaultFixture);

      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(0); // Active
    });

    it("Should transition to Warning after check-in deadline", async function () {
      const { guardiaVault, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      // Move past check-in deadline but within grace period
      await time.increase(checkInInterval + ONE_DAY);

      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(1); // Warning
    });

    it("Should transition to Triggered after grace period", async function () {
      const { guardiaVault, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past grace period
      await time.increase(checkInInterval + gracePeriod + 1);

      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(2); // Triggered
    });

    it("Should emit VaultTriggered event on status change", async function () {
      const { guardiaVault, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past grace period
      await time.increase(checkInInterval + gracePeriod + 1);

      await expect(guardiaVault.updateVaultStatus(vaultId))
        .to.emit(guardiaVault, "VaultTriggered");
    });

    it("Should transition to Claimed after all beneficiaries claim", async function () {
      const { guardiaVault, beneficiary1, beneficiary2, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + 1);

      // Beneficiaries claim
      await guardiaVault.connect(beneficiary1).claim(vaultId);
      await guardiaVault.connect(beneficiary2).claim(vaultId);

      const vault = await guardiaVault.getVault(vaultId);
      expect(vault.status).to.equal(5); // Claimed (enum value 5)
    });

    it("Should stay Active if check-in is performed before deadline", async function () {
      const { guardiaVault, owner, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      // Move forward but before deadline
      await time.increase(checkInInterval - ONE_DAY);

      await guardiaVault.connect(owner).checkIn(vaultId);

      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(0); // Active
    });
  });

  describe("Beneficiary Claiming", function () {
    it("Should allow beneficiary to claim when triggered", async function () {
      const { guardiaVault, beneficiary1, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + 1);

      const vault = await guardiaVault.getVault(vaultId);
      const blockTimestampBefore = await time.latest();
      const tx = guardiaVault.connect(beneficiary1).claim(vaultId);
      await expect(tx)
        .to.emit(guardiaVault, "BeneficiaryClaimed")
        .withArgs(vaultId, beneficiary1.address, (timestamp: bigint) => {
          // Check timestamp is within reasonable range (within 10 seconds of block timestamp)
          const blockTimestamp = Number(blockTimestampBefore);
          const diff = Math.abs(Number(timestamp) - blockTimestamp);
          return diff <= 10;
        }, vault.metadataHash);
    });

    it("Should mark beneficiary as claimed", async function () {
      const { guardiaVault, beneficiary1, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + 1);

      await guardiaVault.connect(beneficiary1).claim(vaultId);

      expect(await guardiaVault.hasClaimed(vaultId, beneficiary1.address)).to.be.true;
    });

    it("Should reject claim from non-beneficiary", async function () {
      const { guardiaVault, otherAccount, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + 1);

      await expect(
        guardiaVault.connect(otherAccount).claim(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "NotBeneficiary");
    });

    it("Should reject claim before vault is triggered", async function () {
      const { guardiaVault, beneficiary1, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await expect(
        guardiaVault.connect(beneficiary1).claim(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "NotReadyForClaim");
    });

    it("Should reject duplicate claim", async function () {
      const { guardiaVault, beneficiary1, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + 1);

      await guardiaVault.connect(beneficiary1).claim(vaultId);

      await expect(
        guardiaVault.connect(beneficiary1).claim(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "AlreadyClaimed");
    });

    it("Should allow multiple beneficiaries to claim", async function () {
      const { guardiaVault, beneficiary1, beneficiary2, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + 1);

      await guardiaVault.connect(beneficiary1).claim(vaultId);
      await guardiaVault.connect(beneficiary2).claim(vaultId);

      expect(await guardiaVault.hasClaimed(vaultId, beneficiary1.address)).to.be.true;
      expect(await guardiaVault.hasClaimed(vaultId, beneficiary2.address)).to.be.true;
    });
  });

  describe("Guardian Attestation System", function () {
    it("Should allow guardian to attest", async function () {
      const { guardiaVault, guardian1, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      // Guardians are already set from vault creation
      await expect(guardiaVault.connect(guardian1).attestDeath(vaultId))
        .to.emit(guardiaVault, "GuardianAttested")
        .withArgs(vaultId, guardian1.address, 1, false); // count=1, triggered=false

      expect(await guardiaVault.hasGuardianAttested(vaultId, guardian1.address)).to.be.true;
      expect(await guardiaVault.getGuardianAttestationCount(vaultId)).to.equal(1);
    });

    it("Should increment attestation count when guardians attest", async function () {
      const { guardiaVault, guardian1, guardian2, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      // Guardians are already set from vault creation
      await guardiaVault.connect(guardian1).attestDeath(vaultId);
      expect(await guardiaVault.getGuardianAttestationCount(vaultId)).to.equal(1);

      await guardiaVault.connect(guardian2).attestDeath(vaultId);
      expect(await guardiaVault.getGuardianAttestationCount(vaultId)).to.equal(2);
    });

    it("Should reject attestation from non-guardian", async function () {
      const { guardiaVault, otherAccount, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await expect(
        guardiaVault.connect(otherAccount).attestDeath(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "NotGuardian");
    });

    it("Should reject duplicate attestation", async function () {
      const { guardiaVault, guardian1, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      // Guardians are already set from vault creation
      await guardiaVault.connect(guardian1).attestDeath(vaultId);

      // Try to attest again immediately - should fail with cooldown
      await expect(
        guardiaVault.connect(guardian1).attestDeath(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "AttestationCooldown");

      // Wait for cooldown to pass (24 hours)
      await time.increase(24 * 60 * 60 + 1);

      // Now should fail with AlreadyAttested since guardian already attested
      await expect(
        guardiaVault.connect(guardian1).attestDeath(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "AlreadyAttested");
    });

    it("Should trigger vault when 2-of-3 guardian threshold is reached", async function () {
      const { guardiaVault, guardian1, guardian2, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      // Guardians are already set from vault creation (3 guardians)
      // First guardian attests - should NOT trigger
      await guardiaVault.connect(guardian1).attestDeath(vaultId);

      let status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(0); // Still Active

      // Second guardian attests - should trigger vault (2-of-3 threshold)
      await expect(guardiaVault.connect(guardian2).attestDeath(vaultId))
        .to.emit(guardiaVault, "VaultTriggered");

      status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(2); // Triggered
    });

    it("Should NOT allow owner to check in after guardian-triggered vault", async function () {
      const { guardiaVault, owner, guardian1, guardian2, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      // Guardians are already set from vault creation
      // Two guardians attest to trigger vault (2-of-3 threshold)
      await guardiaVault.connect(guardian1).attestDeath(vaultId);
      await guardiaVault.connect(guardian2).attestDeath(vaultId);

      // Verify vault is triggered
      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(2); // Triggered

      // Owner should NOT be able to check in
      await expect(
        guardiaVault.connect(owner).checkIn(vaultId)
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidStatus");
    });
  });

  describe("Metadata Management", function () {
    it("Should allow owner to update metadata", async function () {
      const { guardiaVault, owner, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      const newMetadata = "QmNewHash987654321";

      await expect(guardiaVault.connect(owner).updateMetadata(vaultId, newMetadata))
        .to.emit(guardiaVault, "MetadataUpdated")
        .withArgs(vaultId, newMetadata);

      const vault = await guardiaVault.getVault(vaultId);
      expect(vault.metadataHash).to.equal(newMetadata);
    });

    it("Should reject empty metadata", async function () {
      const { guardiaVault, owner, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await expect(
        guardiaVault.connect(owner).updateMetadata(vaultId, "")
      ).to.be.revertedWithCustomError(guardiaVault, "InvalidBeneficiary");
    });

    it("Should reject metadata update from non-owner", async function () {
      const { guardiaVault, otherAccount, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await expect(
        guardiaVault.connect(otherAccount).updateMetadata(vaultId, "QmNewHash")
      ).to.be.revertedWithCustomError(guardiaVault, "Unauthorized");
    });
  });

  describe("Beneficiary Management", function () {
    it.skip("Should allow owner to update beneficiaries", async function () {
      const { guardiaVault, owner, beneficiary3, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      const newBeneficiaries = [beneficiary3.address];

      await expect(
        guardiaVault.connect(owner).updateBeneficiaries(vaultId, newBeneficiaries)
      ).to.emit(guardiaVault, "BeneficiariesUpdated")
        .withArgs(vaultId, newBeneficiaries);

      const vault = await guardiaVault.getVault(vaultId);
      expect(vault.beneficiaries).to.deep.equal(newBeneficiaries);
    });

    it.skip("Should reject updating beneficiaries when triggered", async function () {
      const { guardiaVault, owner, beneficiary3, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move past trigger time
      await time.increase(checkInInterval + gracePeriod + 1);
      await guardiaVault.updateVaultStatus(vaultId);

      await expect(
        guardiaVault.connect(owner).updateBeneficiaries(vaultId, [beneficiary3.address])
      ).to.be.revertedWithCustomError(guardiaVault, "Unauthorized");
    });

    it.skip("Should reject empty beneficiaries array", async function () {
      const { guardiaVault, owner, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await expect(
        guardiaVault.connect(owner).updateBeneficiaries(vaultId, [])
      ).to.be.revertedWithCustomError(guardiaVault, "NoBeneficiaries");
    });

    it.skip("Should reject update from non-owner", async function () {
      const { guardiaVault, otherAccount, beneficiary3, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await expect(
        guardiaVault.connect(otherAccount).updateBeneficiaries(vaultId, [beneficiary3.address])
      ).to.be.revertedWithCustomError(guardiaVault, "Unauthorized");
    });
  });

  describe("View Functions", function () {
    it("Should correctly calculate time until deadline", async function () {
      const { guardiaVault, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      const timeUntilDeadline = await guardiaVault.getTimeUntilDeadline(vaultId);
      expect(timeUntilDeadline).to.be.closeTo(checkInInterval, 5);
    });

    it("Should return 0 for time until deadline when overdue", async function () {
      const { guardiaVault, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      await time.increase(checkInInterval + ONE_DAY);

      const timeUntilDeadline = await guardiaVault.getTimeUntilDeadline(vaultId);
      expect(timeUntilDeadline).to.equal(0);
    });

    it("Should correctly calculate time until trigger", async function () {
      const { guardiaVault, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      const timeUntilTrigger = await guardiaVault.getTimeUntilTrigger(vaultId);
      expect(timeUntilTrigger).to.be.closeTo(checkInInterval + gracePeriod, 5);
    });

    it("Should check if address is beneficiary", async function () {
      const { guardiaVault, beneficiary1, otherAccount, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      expect(await guardiaVault.isBeneficiary(vaultId, beneficiary1.address)).to.be.true;
      expect(await guardiaVault.isBeneficiary(vaultId, otherAccount.address)).to.be.false;
    });

    it("Should get beneficiaries array", async function () {
      const { guardiaVault, beneficiary1, beneficiary2, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      const beneficiaries = await guardiaVault.getBeneficiaries(vaultId);
      expect(beneficiaries).to.include(beneficiary1.address);
      expect(beneficiaries).to.include(beneficiary2.address);
      expect(beneficiaries.length).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle vault with maximum beneficiaries", async function () {
      const { guardiaVault, owner, guardian1, guardian2, guardian3 } = await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = 30 * ONE_DAY;
      const gracePeriod = 7 * ONE_DAY;
      const beneficiaries = Array(10).fill(0).map((_, i) => 
        ethers.Wallet.createRandom().address
      );
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await guardiaVault.connect(owner).createVault(
        checkInInterval,
        gracePeriod,
        beneficiaries,
        guardians,
        metadataHash
      );

      const vault = await guardiaVault.getVault(0);
      expect(vault.beneficiaries.length).to.equal(10);
    });

    it("Should handle rapid check-ins", async function () {
      const { guardiaVault, owner, vaultId } = 
        await loadFixture(deployWithVaultFixture);

      await guardiaVault.connect(owner).checkIn(vaultId);
      await time.increase(1);
      await guardiaVault.connect(owner).checkIn(vaultId);
      await time.increase(1);
      await guardiaVault.connect(owner).checkIn(vaultId);

      const vault = await guardiaVault.getVault(vaultId);
      expect(vault.status).to.equal(0); // Active
    });

    it("Should handle minimum valid intervals", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = 
        await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = MIN_CHECK_IN_INTERVAL;
      const gracePeriod = MIN_GRACE_PERIOD;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.not.be.reverted;
    });

    it("Should handle maximum valid intervals", async function () {
      const { guardiaVault, owner, beneficiary1, guardian1, guardian2, guardian3 } = 
        await loadFixture(deployGuardiaVaultFixture);

      const checkInInterval = MAX_CHECK_IN_INTERVAL;
      const gracePeriod = MAX_GRACE_PERIOD;
      const beneficiaries = [beneficiary1.address];
      const guardians: [string, string, string] = [guardian1.address, guardian2.address, guardian3.address];
      const metadataHash = "QmTestHash123456789";

      await expect(
        guardiaVault.connect(owner).createVault(
          checkInInterval,
          gracePeriod,
          beneficiaries,
          guardians,
          metadataHash
        )
      ).to.not.be.reverted;
    });

    it("Should correctly handle exactly at deadline boundary", async function () {
      const { guardiaVault, vaultId, checkInInterval } = 
        await loadFixture(deployWithVaultFixture);

      // Move to exact deadline
      await time.increase(checkInInterval);
      
      // Update status to reflect the deadline passing
      await guardiaVault.updateVaultStatus(vaultId);

      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(1); // Warning (deadline passed)
    });

    it("Should correctly handle exactly at trigger boundary", async function () {
      const { guardiaVault, vaultId, checkInInterval, gracePeriod } = 
        await loadFixture(deployWithVaultFixture);

      // Move to exact trigger time
      await time.increase(checkInInterval + gracePeriod);

      const status = await guardiaVault.getVaultStatus(vaultId);
      expect(status).to.equal(1); // Still Warning (not yet past trigger)

      // Move 1 second past
      await time.increase(1);

      const status2 = await guardiaVault.getVaultStatus(vaultId);
      expect(status2).to.equal(2); // Triggered
    });
  });
});
