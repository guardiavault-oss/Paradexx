/**
 * Web3 Signature Verification API Route Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { ethers } from "ethers";
import { registerRoutes } from "../../../server/routes";

describe("Web3 Signature Verification API Routes", () => {
  let app: express.Application;
  let wallet: ethers.Wallet;
  let testAddress: string;

  beforeEach(async () => {
    // Create a test wallet for signing messages
    wallet = ethers.Wallet.createRandom();
    testAddress = wallet.address;

    app = express();
    app.use(express.json());
    app.use((req: any, res: any, next: any) => {
      req.session = { userId: "test-user-id" };
      req.ip = "127.0.0.1";
      next();
    });
    await registerRoutes(app);
  });

  describe("POST /api/web3/signature/verify", () => {
    it("should verify a valid signature successfully", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.verified).toBe(true);
      expect(response.body.address.toLowerCase()).toBe(testAddress.toLowerCase());
    });

    it("should reject request without authentication", async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, res: any, next: any) => {
        req.session = {}; // No userId
        req.ip = "127.0.0.1";
        next();
      });
      await registerRoutes(appNoAuth);

      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      const response = await request(appNoAuth)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should reject invalid Ethereum address format", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: "invalid-address",
          message,
          signature,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_ADDRESS");
    });

    it("should reject message without timestamp", async () => {
      const message = "Test message without timestamp";
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("MISSING_TIMESTAMP");
    });

    it("should reject message with timestamp in the future", async () => {
      const futureTimestamp = Date.now() + 60000; // 1 minute in the future
      const message = `GuardiaVault Signature\nTimestamp: ${futureTimestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_TIMESTAMP");
    });

    it("should reject message with expired timestamp (more than 5 minutes)", async () => {
      const expiredTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const message = `GuardiaVault Signature\nTimestamp: ${expiredTimestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("TIMESTAMP_EXPIRED");
    });

    it("should reject invalid signature format", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature: "invalid-signature",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject corrupted signature", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature: "0x" + "1".repeat(130), // Valid format but invalid signature
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_SIGNATURE");
    });

    it("should reject address mismatch", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      // Use a different address
      const differentAddress = ethers.Wallet.createRandom().address;

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: differentAddress,
          message,
          signature,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("ADDRESS_MISMATCH");
    });

    it("should reject empty message", async () => {
      const timestamp = Date.now();
      const signature = await wallet.signMessage("");

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message: "",
          signature,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject missing required fields", async () => {
      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          // Missing message and signature
        });

      expect(response.status).toBe(400);
    });

    it("should enforce rate limiting (5 attempts per minute per IP)", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      // Make 5 successful requests (should all pass)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post("/api/web3/signature/verify")
          .send({
            address: testAddress,
            message,
            signature,
          });
        expect(response.status).toBe(200);
      }

      // 6th request should be rate limited
      const rateLimitedResponse = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should handle timestamp at exact 5 minute boundary", async () => {
      const exactFiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const message = `GuardiaVault Signature\nTimestamp: ${exactFiveMinutesAgo}\nTest message`;
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      // Should accept timestamp at exactly 5 minutes (boundary case)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should handle timestamp just over 5 minutes (expired)", async () => {
      const justOverFiveMinutes = Date.now() - 5 * 60 * 1000 - 1; // 1ms over 5 minutes
      const message = `GuardiaVault Signature\nTimestamp: ${justOverFiveMinutes}\nTest message`;
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("TIMESTAMP_EXPIRED");
    });

    it("should handle different timestamp formats in message", async () => {
      // Test case-insensitive timestamp matching
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\ntimestamp: ${timestamp}\nTest message`; // lowercase
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should handle timestamp with whitespace variations", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp:  ${timestamp}  \nTest message`; // extra spaces
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress,
          message,
          signature,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should handle case-insensitive address comparison", async () => {
      const timestamp = Date.now();
      const message = `GuardiaVault Signature\nTimestamp: ${timestamp}\nTest message`;
      const signature = await wallet.signMessage(message);

      // Use uppercase address
      const response = await request(app)
        .post("/api/web3/signature/verify")
        .send({
          address: testAddress.toUpperCase(),
          message,
          signature,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return proper error structure for all failure modes", async () => {
      const testCases = [
        {
          name: "invalid address",
          body: {
            address: "0xInvalid",
            message: "Test",
            signature: "0x" + "1".repeat(130),
          },
          expectedCode: "INVALID_ADDRESS",
        },
        {
          name: "missing timestamp",
          body: {
            address: testAddress,
            message: "No timestamp here",
            signature: "0x" + "1".repeat(130),
          },
          expectedCode: "MISSING_TIMESTAMP",
        },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post("/api/web3/signature/verify")
          .send(testCase.body);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("code", testCase.expectedCode);
        expect(response.body).toHaveProperty("message");
      }
    });
  });
});

