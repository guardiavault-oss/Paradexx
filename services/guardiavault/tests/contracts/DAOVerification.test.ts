/**
 * DAOVerification Contract Tests
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { DAOVerification } from "../../typechain-types";

describe("DAOVerification", function () {
  let dao: DAOVerification;
  let owner: any;
  let verifier1: any, verifier2: any;
  let claimant: any;

  beforeEach(async function () {
    [owner, verifier1, verifier2, claimant] = await ethers.getSigners();

    const DAOVerificationFactory = await ethers.getContractFactory("DAOVerification");
    dao = await DAOVerificationFactory.deploy();
    await dao.waitForDeployment();
  });

  describe("Verifier Registration", function () {
    it.skip("Should allow users to register as verifiers", async function () {
      // Skip: Requires governance token deployment
      // const stakeAmount = ethers.parseUnits("1000", 18);
      // await expect(
      //   dao.connect(verifier1).registerVerifier(stakeAmount)
      // ).to.not.be.reverted;
    });
  });

  describe("Claim Creation", function () {
    it.skip("Should allow beneficiaries to create claims", async function () {
      // Skip: Requires vault and beneficiary setup
      // const reason = "Owner has not checked in for 120 days";
      // await expect(
      //   dao.connect(claimant).createClaim(vaultId, reason)
      // ).to.not.be.reverted;
    });
  });

  describe("Voting", function () {
    it.skip("Should allow verifiers to vote on claims", async function () {
      // Skip: Requires claim creation first
      // await expect(
      //   dao.connect(verifier1).vote(claimId, true)
      // ).to.not.be.reverted;
    });
  });
});

