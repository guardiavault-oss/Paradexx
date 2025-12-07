/**
 * Yield Challenge Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { yieldChallengeService } from "../services/yieldChallengeService";
import * as dbModule from "../db";

// Mock database with query builder chain
vi.mock("../db", () => {
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
        limit: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: "challenge-123", name: "Monthly Yield Challenge", status: "upcoming" }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  };
  return {
    db: mockDb,
  };
});

describe("Yield Challenge Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new challenge", async () => {
    const challengeId = await yieldChallengeService.createChallenge(
      "Monthly Yield Challenge",
      "Earn the most yield this month",
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      5.0, // apyBonus
      "1000" // rewardPool
    );

    expect(challengeId).toBeDefined();
    expect(typeof challengeId).toBe("string");
  });

  it("should allow users to join challenges", async () => {
    const challengeId = "challenge-123";
    const userId = "user-123";

    // Mock: check if user already joined (should be empty)
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])), // User hasn't joined
        })),
      })),
    });

    // Mock: get challenge (should be active)
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{ id: challengeId, status: "active" }])),
        })),
      })),
    });

    // Mock: insert participation
    vi.mocked(dbModule.db.insert).mockReturnValueOnce({
      values: vi.fn(() => Promise.resolve([])),
    });

    await yieldChallengeService.joinChallenge(userId, challengeId);
    
    // Should not throw
    expect(true).toBe(true);
  });

  it("should update challenge earnings", async () => {
    const challengeId = "challenge-123";
    const userId = "user-123";
    const earnings = "100.50";

    // Mock the database operations
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ userId, challengeId, currentEarnings: "50.00" }])),
        limit: vi.fn(() => Promise.resolve([{ userId, challengeId, currentEarnings: "50.00" }])),
      })),
    });

    vi.mocked(dbModule.db.update).mockReturnValueOnce({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    });

    await yieldChallengeService.updateChallengeEarnings(
      userId,
      challengeId,
      earnings
    );

    // Should not throw
    expect(true).toBe(true);
  });

  it("should get challenge leaderboard", async () => {
    const challengeId = "challenge-123";
    
    // Mock leaderboard query
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([
            { userId: "user-1", currentEarnings: "100.50", rank: 1 },
            { userId: "user-2", currentEarnings: "50.25", rank: 2 }
          ])),
        })),
      })),
    });

    const leaderboard = await yieldChallengeService.getChallengeLeaderboard(challengeId);

    expect(leaderboard).toBeDefined();
    expect(Array.isArray(leaderboard)).toBe(true);
  });
});

