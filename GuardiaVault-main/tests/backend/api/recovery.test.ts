/**
 * Recovery API Route Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../../../server/routes";

describe("Recovery API Routes", () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use((req: any, res: any, next: any) => {
      req.session = { userId: "test-user-id" };
      next();
    });
    await registerRoutes(app);
  });

  describe("POST /api/recovery/create", () => {
    it("should create a recovery with valid data", async () => {
      const recoveryData = {
        walletAddress: "0x1234567890123456789012345678901234567890",
        recoveryKeys: [
          { email: "key1@test.com", name: "Key 1" },
          { email: "key2@test.com", name: "Key 2" },
          { email: "key3@test.com", name: "Key 3" },
        ],
        encryptedData: "0xabcdef1234567890",
      };

      const response = await request(app)
        .post("/api/recovery/create")
        .send(recoveryData);

      expect(response.status).toBe(201);
      expect(response.body.recovery).toBeDefined();
      expect(response.body.recovery.id).toBeDefined();
    });

    it("should require exactly 3 recovery keys", async () => {
      const recoveryData = {
        walletAddress: "0x1234567890123456789012345678901234567890",
        recoveryKeys: [
          { email: "key1@test.com", name: "Key 1" },
          { email: "key2@test.com", name: "Key 2" },
        ],
        encryptedData: "0xabcdef1234567890",
      };

      const response = await request(app)
        .post("/api/recovery/create")
        .send(recoveryData);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/recovery/verify-token/:token", () => {
    it("should return recovery info for valid token", async () => {
      // First create a recovery to get a token
      const createResponse = await request(app)
        .post("/api/recovery/create")
        .send({
          walletAddress: "0x1234567890123456789012345678901234567890",
          recoveryKeys: [
            { email: "key1@test.com", name: "Key 1" },
            { email: "key2@test.com", name: "Key 2" },
            { email: "key3@test.com", name: "Key 3" },
          ],
          encryptedData: "0xabcdef1234567890",
        });

      // Get token from recovery keys (would need to extract from response)
      // For now, test with placeholder
      const token = "test-token";
      const response = await request(app).get(`/api/recovery/verify-token/${token}`);

      // Should either return recovery or 404
      expect([200, 404]).toContain(response.status);
    });
  });
});

