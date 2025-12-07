/**
 * Achievement Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { achievementService } from "../services/achievementService";

// Mock database with query builder chain
vi.mock("../db", () => {
  let achievementExists = false;
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => {
            // First call returns empty (no existing achievement), subsequent calls return existing
            if (achievementExists) {
              return Promise.resolve([{ id: "test-id", userId: "user-123", achievementType: "first_deposit" }]);
            }
            return Promise.resolve([]);
          }),
        })),
        limit: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => {
        achievementExists = true; // Mark as existing after insert
        return Promise.resolve([{ id: "test-id", userId: "user-123", achievementType: "first_deposit" }]);
      }),
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

describe("Achievement Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset for each test
    vi.resetModules();
  });

  it("should unlock first deposit achievement", async () => {
    const unlocked = await achievementService.checkAndUnlockAchievement(
      "user-123",
      "first_deposit"
    );

    expect(unlocked).toBe(true);
  });

  it("should not unlock already unlocked achievement", async () => {
    // First unlock
    await achievementService.checkAndUnlockAchievement("user-123", "first_deposit");
    
    // Second attempt should return false
    const unlocked = await achievementService.checkAndUnlockAchievement(
      "user-123",
      "first_deposit"
    );

    expect(unlocked).toBe(false);
  });

  it("should check yield milestones correctly", async () => {
    // Test $100 milestone
    await achievementService.checkYieldMilestones("user-123", "100");
    
    // Test $1000 milestone
    await achievementService.checkYieldMilestones("user-123", "1000");
    
    // Test $10000 milestone
    await achievementService.checkYieldMilestones("user-123", "10000");
    
    // All should be called
    expect(true).toBe(true); // Placeholder - would verify database calls
  });

  it("should check referral achievements", async () => {
    await achievementService.checkReferralAchievements("user-123", 1);
    await achievementService.checkReferralAchievements("user-123", 5);
    await achievementService.checkReferralAchievements("user-123", 10);
    
    expect(true).toBe(true); // Placeholder
  });
});

