/**
 * Referral Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { referralService } from "../services/referralService";
import * as dbModule from "../db";

// Mock database with query builder chain
const createMockSelect = () => {
  const mockSelect = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve([])),
      })),
      limit: vi.fn(() => Promise.resolve([])),
    })),
  }));
  return mockSelect;
};

const createMockInsert = () => {
  return vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{ id: "test-id", code: "TEST123", userId: "user-123", stripeCouponId: null, createdAt: new Date() }])),
    })),
  }));
};

const createMockUpdate = () => {
  return vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([])),
    })),
  }));
};

vi.mock("../db", () => {
  const mockDb = {
    select: createMockSelect(),
    insert: createMockInsert(),
    update: createMockUpdate(),
  };
  return {
    db: mockDb,
  };
});

vi.mock("../services/storage", () => ({
  storage: {
    getUser: vi.fn(() => Promise.resolve({ id: "user-123", email: "test@example.com" })),
  },
}));

vi.mock("stripe", () => {
  return {
    default: vi.fn(() => ({
      coupons: {
        create: vi.fn(() => Promise.resolve({ id: "coupon_test_123" })),
      },
    })),
  };
});

describe("Referral Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mocks to default behavior
    vi.mocked(dbModule.db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
        limit: vi.fn(() => Promise.resolve([])),
      })),
    });
    
    vi.mocked(dbModule.db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: "test-id", code: "TEST123", userId: "user-123", stripeCouponId: null, createdAt: new Date() }])),
      })),
    });
  });

  it("should generate unique referral code", async () => {
    // Mock: check for existing code (should be empty)
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])), // No existing code
        })),
      })),
    });
    
    const referralCode = await referralService.generateReferralCode("user-123");

    expect(referralCode).toBeDefined();
    expect(referralCode.code).toBeDefined();
    expect(referralCode.code.length).toBeGreaterThan(0);
    expect(referralCode.code).toMatch(/^[A-Z0-9]+$/); // Alphanumeric
  });

  it("should validate referral code format", async () => {
    // Mock: check for existing code (should be empty)
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])), // No existing code
        })),
      })),
    });
    
    const referralCode = await referralService.generateReferralCode("user-123");

    // Should be 8-12 characters, alphanumeric
    expect(referralCode.code.length).toBeGreaterThanOrEqual(8);
    expect(referralCode.code.length).toBeLessThanOrEqual(12);
  });

  it("should track referral usage", async () => {
    // Mock: generateReferralCode - check for existing (empty)
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])), // No existing code
        })),
      })),
    });
    
    const referralCode = await referralService.generateReferralCode("user-123");
    
    // Mock processReferral: find code, check existing referral, then insert
    vi.mocked(dbModule.db.select)
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: "code-123", code: referralCode.code, userId: "user-123", totalReferrals: 0 }])),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])), // No existing referral
          })),
        })),
      });
    
    vi.mocked(dbModule.db.insert).mockReturnValueOnce({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: "ref-new", referrerId: "user-123", referredId: "user-456", status: "pending", referralCodeId: "code-123" }])),
      })),
    });
    
    const referral = await referralService.processReferral(referralCode.code, "user-456");

    expect(referral).toBeDefined();
    expect(referral.referrerId).toBe("user-123");
    expect(referral.referredId).toBe("user-456");
  });

  it("should prevent self-referral", async () => {
    // Mock: generateReferralCode
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])), // No existing code
        })),
      })),
    });
    
    const referralCode = await referralService.generateReferralCode("user-123");
    
    // Mock processReferral: find code with same userId (should trigger self-referral error)
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{ id: "code-123", code: referralCode.code, userId: "user-123", totalReferrals: 0 }])),
        })),
      })),
    });
    
    await expect(
      referralService.processReferral(referralCode.code, "user-123")
    ).rejects.toThrow("Cannot use your own referral code");
  });

  it("should calculate referral stats", async () => {
    // Mock: getUserReferralStats - return referrals array
    vi.mocked(dbModule.db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([
          { id: "ref-1", referrerId: "user-123", referredId: "user-456", status: "completed" },
          { id: "ref-2", referrerId: "user-123", referredId: "user-789", status: "pending" }
        ])),
      })),
    });
    
    const stats = await referralService.getUserReferralStats("user-123");

    expect(stats).toBeDefined();
    expect(stats.totalReferrals).toBeGreaterThanOrEqual(0);
    expect(stats.completedReferrals).toBeGreaterThanOrEqual(0);
    expect(stats.pendingRewards).toBeGreaterThanOrEqual(0);
  });
});

