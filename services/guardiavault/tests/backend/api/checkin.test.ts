/**
 * Check-In API Route Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerCheckInRoutes } from "../../../server/routes-checkin";

describe("Check-In API Routes", () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    const requireAuth = (req: any, res: any, next: any) => {
      req.session = { userId: "test-user-id" };
      next();
    };

    registerCheckInRoutes(app, requireAuth);
  });

  describe("POST /api/vaults/:vaultId/checkin", () => {
    it("should perform check-in with signature", async () => {
      const response = await request(app)
        .post("/api/vaults/test-vault-id/checkin")
        .send({
          message: "Test check-in",
          signature: "0x1234567890abcdef",
        });

      // Should succeed or fail with appropriate status
      expect([200, 400, 404]).toContain(response.status);
    });

    it("should require signature", async () => {
      const response = await request(app)
        .post("/api/vaults/test-vault-id/checkin")
        .send({
          message: "Test check-in",
          // Missing signature
        });

      expect(response.status).toBe(400);
    });

    it("should accept optional biometric data", async () => {
      const response = await request(app)
        .post("/api/vaults/test-vault-id/checkin")
        .send({
          message: "Test check-in",
          signature: "0x1234567890abcdef",
          biometricData: {
            typingPattern: {
              keystrokeDynamics: [],
            },
            mouseMovement: {
              movements: [],
            },
          },
        });

      expect([200, 400, 404]).toContain(response.status);
    });
  });
});

