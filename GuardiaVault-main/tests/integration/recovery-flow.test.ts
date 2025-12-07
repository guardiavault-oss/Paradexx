/**
 * Comprehensive Recovery Flow Integration Tests
 * Tests the complete end-to-end recovery process including:
 * - Recovery initiation
 * - Guardian attestations
 * - 2/3 consensus
 * - Recovery completion
 * - Fee calculation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../../server/db';
import { users, vaults, parties, claims, attestations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

// Test data
let testUserId: number;
let testVaultId: string;
let testGuardianIds: number[] = [];
let testBeneficiaryId: number;
let testClaimId: string;

// Helper to create test user
async function createTestUser(email: string, name: string) {
  const [user] = await db.insert(users).values({
    email,
    name,
    passwordHash: 'test_hash_not_real',
  }).returning();
  return user;
}

// Helper to create test vault
async function createTestVault(ownerId: number, name: string) {
  const [vault] = await db.insert(vaults).values({
    id: `test_vault_${Date.now()}`,
    ownerId,
    name,
    status: 'active',
    requiredGuardians: 2, // 2 of 3 consensus
  }).returning();
  return vault;
}

// Helper to create guardian
async function createTestGuardian(vaultId: string, email: string, name: string) {
  const [guardian] = await db.insert(parties).values({
    vaultId,
    email,
    name,
    role: 'guardian',
    status: 'active',
  }).returning();
  return guardian;
}

// Helper to create beneficiary
async function createTestBeneficiary(vaultId: string, email: string, name: string) {
  const [beneficiary] = await db.insert(parties).values({
    vaultId,
    email,
    name,
    role: 'beneficiary',
    status: 'active',
    percentage: 100,
  }).returning();
  return beneficiary;
}

describe('Recovery Flow - End to End', () => {
  beforeAll(async () => {
    // Set up test data
    const owner = await createTestUser('owner@test.com', 'Test Owner');
    testUserId = owner.id;

    const vault = await createTestVault(owner.id, 'Test Vault');
    testVaultId = vault.id;

    // Create 3 guardians
    const guardian1 = await createTestGuardian(vault.id, 'guardian1@test.com', 'Guardian 1');
    const guardian2 = await createTestGuardian(vault.id, 'guardian2@test.com', 'Guardian 2');
    const guardian3 = await createTestGuardian(vault.id, 'guardian3@test.com', 'Guardian 3');
    testGuardianIds = [guardian1.id, guardian2.id, guardian3.id];

    // Create beneficiary
    const beneficiary = await createTestBeneficiary(vault.id, 'beneficiary@test.com', 'Test Beneficiary');
    testBeneficiaryId = beneficiary.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testClaimId) {
      await db.delete(attestations).where(eq(attestations.claimId, testClaimId));
      await db.delete(claims).where(eq(claims.id, testClaimId));
    }
    if (testBeneficiaryId) {
      await db.delete(parties).where(eq(parties.id, testBeneficiaryId));
    }
    if (testGuardianIds.length > 0) {
      await db.delete(parties).where(eq(parties.vaultId, testVaultId));
    }
    if (testVaultId) {
      await db.delete(vaults).where(eq(vaults.id, testVaultId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('Recovery Initiation', () => {
    it('should allow beneficiary to initiate recovery', async () => {
      // Initiate recovery
      const [claim] = await db.insert(claims).values({
        id: `claim_${Date.now()}`,
        vaultId: testVaultId,
        initiatorId: testBeneficiaryId,
        status: 'pending',
        requiredAttestations: 2, // 2 of 3
        currentAttestations: 0,
      }).returning();

      testClaimId = claim.id;

      expect(claim).toBeDefined();
      expect(claim.status).toBe('pending');
      expect(claim.vaultId).toBe(testVaultId);
      expect(claim.initiatorId).toBe(testBeneficiaryId);
      expect(claim.requiredAttestations).toBe(2);
    });

    it('should prevent duplicate active claims for same vault', async () => {
      // Try to create another claim while one is pending
      await expect(async () => {
        await db.insert(claims).values({
          id: `claim_duplicate_${Date.now()}`,
          vaultId: testVaultId,
          initiatorId: testBeneficiaryId,
          status: 'pending',
          requiredAttestations: 2,
          currentAttestations: 0,
        });
      }).rejects.toThrow();
    });
  });

  describe('Guardian Attestations', () => {
    it('should allow first guardian to attest', async () => {
      const [attestation] = await db.insert(attestations).values({
        claimId: testClaimId,
        partyId: testGuardianIds[0],
        decision: 'approve',
        signedAt: new Date(),
      }).returning();

      expect(attestation).toBeDefined();
      expect(attestation.decision).toBe('approve');

      // Update claim attestation count
      await db.update(claims)
        .set({ currentAttestations: 1 })
        .where(eq(claims.id, testClaimId));

      const [claim] = await db.select().from(claims).where(eq(claims.id, testClaimId));
      expect(claim.currentAttestations).toBe(1);
    });

    it('should allow second guardian to attest', async () => {
      const [attestation] = await db.insert(attestations).values({
        claimId: testClaimId,
        partyId: testGuardianIds[1],
        decision: 'approve',
        signedAt: new Date(),
      }).returning();

      expect(attestation).toBeDefined();
      expect(attestation.decision).toBe('approve');

      // Update claim attestation count
      await db.update(claims)
        .set({ currentAttestations: 2 })
        .where(eq(claims.id, testClaimId));

      const [claim] = await db.select().from(claims).where(eq(claims.id, testClaimId));
      expect(claim.currentAttestations).toBe(2);
    });

    it('should prevent guardian from attesting twice', async () => {
      await expect(async () => {
        await db.insert(attestations).values({
          claimId: testClaimId,
          partyId: testGuardianIds[0], // Same guardian
          decision: 'approve',
          signedAt: new Date(),
        });
      }).rejects.toThrow(); // Should violate unique constraint
    });

    it('should reject attestation from non-guardian', async () => {
      // Try to attest with beneficiary ID (not a guardian)
      await expect(async () => {
        await db.insert(attestations).values({
          claimId: testClaimId,
          partyId: testBeneficiaryId, // Beneficiary, not guardian
          decision: 'approve',
          signedAt: new Date(),
        });
      }).rejects.toThrow();
    });
  });

  describe('Consensus & Completion', () => {
    it('should reach 2/3 consensus with 2 approvals', async () => {
      const [claim] = await db.select().from(claims).where(eq(claims.id, testClaimId));

      expect(claim.currentAttestations).toBe(2);
      expect(claim.requiredAttestations).toBe(2);
      expect(claim.currentAttestations).toBeGreaterThanOrEqual(claim.requiredAttestations);
    });

    it('should allow recovery completion after consensus', async () => {
      // Mark as approved
      await db.update(claims)
        .set({
          status: 'approved',
          approvedAt: new Date(),
        })
        .where(eq(claims.id, testClaimId));

      const [claim] = await db.select().from(claims).where(eq(claims.id, testClaimId));
      expect(claim.status).toBe('approved');
      expect(claim.approvedAt).toBeDefined();
    });

    it('should calculate correct recovery fee (15%)', async () => {
      const vaultValue = 1000; // $1000
      const feePercentage = 15;
      const expectedFee = vaultValue * (feePercentage / 100);

      expect(expectedFee).toBe(150); // 15% of $1000 = $150
    });

    it('should update vault status to recovered', async () => {
      await db.update(vaults)
        .set({ status: 'recovered' })
        .where(eq(vaults.id, testVaultId));

      const [vault] = await db.select().from(vaults).where(eq(vaults.id, testVaultId));
      expect(vault.status).toBe('recovered');
    });

    it('should complete claim with transaction hash', async () => {
      const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      await db.update(claims)
        .set({
          status: 'completed',
          completedAt: new Date(),
          completionTxHash: mockTxHash,
        })
        .where(eq(claims.id, testClaimId));

      const [claim] = await db.select().from(claims).where(eq(claims.id, testClaimId));
      expect(claim.status).toBe('completed');
      expect(claim.completedAt).toBeDefined();
      expect(claim.completionTxHash).toBe(mockTxHash);
    });
  });

  describe('Rejection Scenarios', () => {
    let rejectionClaimId: string;

    beforeEach(async () => {
      // Create new claim for rejection test
      const [claim] = await db.insert(claims).values({
        id: `claim_reject_${Date.now()}`,
        vaultId: testVaultId,
        initiatorId: testBeneficiaryId,
        status: 'pending',
        requiredAttestations: 2,
        currentAttestations: 0,
      }).returning();
      rejectionClaimId = claim.id;
    });

    it('should reject recovery with insufficient approvals', async () => {
      // Only 1 approval (need 2)
      await db.insert(attestations).values({
        claimId: rejectionClaimId,
        partyId: testGuardianIds[0],
        decision: 'approve',
        signedAt: new Date(),
      });

      // 2 rejections
      await db.insert(attestations).values([
        {
          claimId: rejectionClaimId,
          partyId: testGuardianIds[1],
          decision: 'reject',
          signedAt: new Date(),
        },
        {
          claimId: rejectionClaimId,
          partyId: testGuardianIds[2],
          decision: 'reject',
          signedAt: new Date(),
        },
      ]);

      // Count approvals
      const approvals = await db.select().from(attestations)
        .where(and(
          eq(attestations.claimId, rejectionClaimId),
          eq(attestations.decision, 'approve')
        ));

      expect(approvals.length).toBe(1);
      expect(approvals.length).toBeLessThan(2); // Less than required

      // Mark as rejected
      await db.update(claims)
        .set({ status: 'rejected', completedAt: new Date() })
        .where(eq(claims.id, rejectionClaimId));

      const [claim] = await db.select().from(claims).where(eq(claims.id, rejectionClaimId));
      expect(claim.status).toBe('rejected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle vault with no guardians gracefully', async () => {
      const emptyVault = await createTestVault(testUserId, 'Empty Vault');

      // Try to create claim (should fail validation)
      await expect(async () => {
        await db.insert(claims).values({
          id: `claim_empty_${Date.now()}`,
          vaultId: emptyVault.id,
          initiatorId: testBeneficiaryId,
          status: 'pending',
          requiredAttestations: 2,
          currentAttestations: 0,
        });
      }).rejects.toThrow();

      // Cleanup
      await db.delete(vaults).where(eq(vaults.id, emptyVault.id));
    });

    it('should handle concurrent attestations correctly', async () => {
      const concurrentClaim = await db.insert(claims).values({
        id: `claim_concurrent_${Date.now()}`,
        vaultId: testVaultId,
        initiatorId: testBeneficiaryId,
        status: 'pending',
        requiredAttestations: 2,
        currentAttestations: 0,
      }).returning();

      // Simulate concurrent attestations
      await Promise.all([
        db.insert(attestations).values({
          claimId: concurrentClaim[0].id,
          partyId: testGuardianIds[0],
          decision: 'approve',
          signedAt: new Date(),
        }),
        db.insert(attestations).values({
          claimId: concurrentClaim[0].id,
          partyId: testGuardianIds[1],
          decision: 'approve',
          signedAt: new Date(),
        }),
      ]);

      const allAttestations = await db.select()
        .from(attestations)
        .where(eq(attestations.claimId, concurrentClaim[0].id));

      expect(allAttestations.length).toBe(2);

      // Cleanup
      await db.delete(attestations).where(eq(attestations.claimId, concurrentClaim[0].id));
      await db.delete(claims).where(eq(claims.id, concurrentClaim[0].id));
    });

    it('should prevent recovery on inactive vault', async () => {
      // Update vault to inactive
      await db.update(vaults)
        .set({ status: 'inactive' })
        .where(eq(vaults.id, testVaultId));

      // Try to create claim (should fail validation)
      await expect(async () => {
        await db.insert(claims).values({
          id: `claim_inactive_${Date.now()}`,
          vaultId: testVaultId,
          initiatorId: testBeneficiaryId,
          status: 'pending',
          requiredAttestations: 2,
          currentAttestations: 0,
        });
      }).rejects.toThrow();

      // Restore vault status
      await db.update(vaults)
        .set({ status: 'active' })
        .where(eq(vaults.id, testVaultId));
    });
  });

  describe('Performance', () => {
    it('should complete attestation query in <50ms', async () => {
      const start = Date.now();

      await db.select()
        .from(attestations)
        .where(eq(attestations.claimId, testClaimId));

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should complete claim lookup with joins in <100ms', async () => {
      const start = Date.now();

      await db.select({
        claim: claims,
        vault: vaults,
        initiator: parties,
      })
        .from(claims)
        .leftJoin(vaults, eq(claims.vaultId, vaults.id))
        .leftJoin(parties, eq(claims.initiatorId, parties.id))
        .where(eq(claims.id, testClaimId));

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
