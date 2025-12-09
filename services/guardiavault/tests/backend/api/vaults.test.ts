/**
 * Vault API Route Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../../../server/routes";

describe("Vault API Routes", () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    // Mock auth middleware
    app.use((req: any, res: any, next: any) => {
      req.session = { userId: "test-user-id" };
      next();
    });
    await registerRoutes(app);
  });

  describe("GET /api/vaults", () => {
    it("should return list of vaults", async () => {
      const response = await request(app).get("/api/vaults");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("vaults");
      expect(Array.isArray(response.body.vaults)).toBe(true);
    });
  });

  describe("POST /api/vaults", () => {
    it("should create a new vault with valid data", async () => {
      const vaultData = {
        name: "Test Vault",
        checkInIntervalDays: 90,
        gracePeriodDays: 30,
        guardians: [
          { email: "guardian1@test.com", name: "Guardian 1" },
          { email: "guardian2@test.com", name: "Guardian 2" },
          { email: "guardian3@test.com", name: "Guardian 3" },
        ],
        beneficiaries: [
          { email: "beneficiary1@test.com", name: "Beneficiary 1" },
        ],
      };

      const response = await request(app)
        .post("/api/vaults")
        .send(vaultData);

      expect(response.status).toBe(201);
      expect(response.body.vault).toBeDefined();
      expect(response.body.vault.id).toBeDefined();
    });

    it("should reject vault with invalid check-in interval", async () => {
      const vaultData = {
        name: "Test Vault",
        checkInIntervalDays: 0, // Invalid
        gracePeriodDays: 30,
        guardians: [],
        beneficiaries: [],
      };

      const response = await request(app)
        .post("/api/vaults")
        .send(vaultData);

      expect(response.status).toBe(400);
    });

    it("should require exactly 3 guardians", async () => {
      const vaultData = {
        name: "Test Vault",
        checkInIntervalDays: 90,
        gracePeriodDays: 30,
        guardians: [
          { email: "guardian1@test.com", name: "Guardian 1" },
          { email: "guardian2@test.com", name: "Guardian 2" },
          // Only 2 guardians - should fail
        ],
        beneficiaries: [],
      };

      const response = await request(app)
        .post("/api/vaults")
        .send(vaultData);

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/vaults/:id/checkin", () => {
    it("should perform check-in successfully", async () => {
      // First create a vault
      const createResponse = await request(app)
        .post("/api/vaults")
        .send({
          name: "Test Vault",
          checkInIntervalDays: 90,
          gracePeriodDays: 30,
          guardians: [
            { email: "g1@test.com", name: "G1" },
            { email: "g2@test.com", name: "G2" },
            { email: "g3@test.com", name: "G3" },
          ],
          beneficiaries: [{ email: "b1@test.com", name: "B1" }],
        });

      const vaultId = createResponse.body.vault.id;

      // Then check in
      const checkInResponse = await request(app)
        .post(`/api/vaults/${vaultId}/checkin`)
        .send({
          message: "Test check-in",
          signature: "0x1234567890abcdef",
        });

      expect(checkInResponse.status).toBe(200);
      expect(checkInResponse.body.success).toBe(true);
    });
  });
});

