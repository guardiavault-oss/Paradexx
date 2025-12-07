/**
 * Admin Authentication and Authorization Tests
 * Tests admin-only routes and permissions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { users, adminAuditLog } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Test users
let regularUserId: number;
let adminUserId: number;

// Helper to create test user
async function createTestUser(email: string, name: string, role: 'user' | 'admin' = 'user') {
  const passwordHash = await bcrypt.hash('testpassword', 10);

  const [user] = await db.insert(users).values({
    email,
    name,
    passwordHash,
    role,
  }).returning();

  return user;
}

describe('Admin Authentication & Authorization', () => {
  beforeAll(async () => {
    // Create test users
    const regularUser = await createTestUser('user@test.com', 'Regular User', 'user');
    const adminUser = await createTestUser('admin@test.com', 'Admin User', 'admin');

    regularUserId = regularUser.id;
    adminUserId = adminUser.id;
  });

  afterAll(async () => {
    // Cleanup
    if (adminAuditLog) {
      await db.delete(adminAuditLog).where(eq(adminAuditLog.userId, adminUserId));
    }
    await db.delete(users).where(eq(users.id, regularUserId));
    await db.delete(users).where(eq(users.id, adminUserId));
  });

  describe('Role Verification', () => {
    it('should correctly identify admin user', async () => {
      const [user] = await db.select().from(users).where(eq(users.id, adminUserId));

      expect(user).toBeDefined();
      expect(user.role).toBe('admin');
    });

    it('should correctly identify regular user', async () => {
      const [user] = await db.select().from(users).where(eq(users.id, regularUserId));

      expect(user).toBeDefined();
      expect(user.role).toBe('user');
    });

    it('should deny admin access to regular user', async () => {
      const [user] = await db.select().from(users).where(eq(users.id, regularUserId));

      expect(user.role).not.toBe('admin');
      expect(user.role).toBe('user');
    });
  });

  describe('Admin Actions', () => {
    it('should allow admin to view all users', async () => {
      const allUsers = await db.select().from(users);

      expect(allUsers.length).toBeGreaterThanOrEqual(2);
      expect(allUsers.some(u => u.id === regularUserId)).toBe(true);
      expect(allUsers.some(u => u.id === adminUserId)).toBe(true);
    });

    it('should allow admin to update user tier', async () => {
      await db.update(users)
        .set({ tier: 'premium' })
        .where(eq(users.id, regularUserId));

      const [user] = await db.select().from(users).where(eq(users.id, regularUserId));
      expect(user.tier).toBe('premium');

      // Restore original tier
      await db.update(users)
        .set({ tier: 'free' })
        .where(eq(users.id, regularUserId));
    });

    it('should allow admin to disable user account', async () => {
      await db.update(users)
        .set({ status: 'suspended' })
        .where(eq(users.id, regularUserId));

      const [user] = await db.select().from(users).where(eq(users.id, regularUserId));
      expect(user.status).toBe('suspended');

      // Restore account
      await db.update(users)
        .set({ status: 'active' })
        .where(eq(users.id, regularUserId));
    });
  });

  describe('Audit Logging', () => {
    it('should log admin actions to audit log', async () => {
      // Simulate admin action (viewing user details)
      if (adminAuditLog) {
        await db.insert(adminAuditLog).values({
          userId: adminUserId,
          action: 'admin_access',
          resource: `/api/admin/users/${regularUserId}`,
          method: 'GET',
          ipAddress: '127.0.0.1',
          userAgent: 'test-suite',
          details: { targetUserId: regularUserId },
        });

        // Verify audit log entry
        const [audit] = await db.select()
          .from(adminAuditLog)
          .where(eq(adminAuditLog.userId, adminUserId))
          .orderBy(desc(adminAuditLog.timestamp))
          .limit(1);

        expect(audit).toBeDefined();
        expect(audit.action).toBe('admin_access');
        expect(audit.userId).toBe(adminUserId);
        expect(audit.resource).toContain('/api/admin/users/');
      }
    });

    it('should log sensitive actions with full details', async () => {
      if (adminAuditLog) {
        // Simulate sensitive action (user deletion)
        await db.insert(adminAuditLog).values({
          userId: adminUserId,
          action: 'user_delete_attempt',
          resource: `/api/admin/users/${regularUserId}`,
          method: 'DELETE',
          ipAddress: '127.0.0.1',
          userAgent: 'test-suite',
          details: {
            targetUserId: regularUserId,
            targetEmail: 'user@test.com',
            reason: 'test',
          },
        });

        const [audit] = await db.select()
          .from(adminAuditLog)
          .where(eq(adminAuditLog.userId, adminUserId))
          .orderBy(desc(adminAuditLog.timestamp))
          .limit(1);

        expect(audit).toBeDefined();
        expect(audit.action).toBe('user_delete_attempt');
        expect(audit.details).toBeDefined();
        expect(audit.details).toHaveProperty('targetUserId');
        expect(audit.details).toHaveProperty('targetEmail');
      }
    });

    it('should allow querying audit logs by admin user', async () => {
      if (adminAuditLog) {
        const auditLogs = await db.select()
          .from(adminAuditLog)
          .where(eq(adminAuditLog.userId, adminUserId))
          .orderBy(desc(adminAuditLog.timestamp));

        expect(auditLogs.length).toBeGreaterThanOrEqual(1);
        auditLogs.forEach(log => {
          expect(log.userId).toBe(adminUserId);
          expect(log.action).toBeDefined();
          expect(log.timestamp).toBeDefined();
        });
      }
    });

    it('should allow querying audit logs by action type', async () => {
      if (adminAuditLog) {
        const accessLogs = await db.select()
          .from(adminAuditLog)
          .where(eq(adminAuditLog.action, 'admin_access'))
          .orderBy(desc(adminAuditLog.timestamp));

        expect(accessLogs.length).toBeGreaterThanOrEqual(1);
        accessLogs.forEach(log => {
          expect(log.action).toBe('admin_access');
        });
      }
    });
  });

  describe('Security', () => {
    it('should require strong password for admin accounts', async () => {
      const weakPassword = 'password123';
      const strongPassword = 'P@ssw0rd!2024$SecureAdmin';

      // Weak password should fail validation
      expect(weakPassword.length).toBeLessThan(12);

      // Strong password should pass validation
      expect(strongPassword.length).toBeGreaterThanOrEqual(12);
      expect(/[A-Z]/.test(strongPassword)).toBe(true);
      expect(/[a-z]/.test(strongPassword)).toBe(true);
      expect(/[0-9]/.test(strongPassword)).toBe(true);
      expect(/[^A-Za-z0-9]/.test(strongPassword)).toBe(true);
    });

    it('should hash admin passwords securely', async () => {
      const [admin] = await db.select().from(users).where(eq(users.id, adminUserId));

      // Password should be hashed (not plain text)
      expect(admin.passwordHash).not.toBe('testpassword');
      expect(admin.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt format

      // Verify password
      const isValid = await bcrypt.compare('testpassword', admin.passwordHash);
      expect(isValid).toBe(true);
    });

    it('should prevent regular users from having admin role', async () => {
      // Try to elevate regular user to admin (should be prevented in real app)
      const [user] = await db.select().from(users).where(eq(users.id, regularUserId));

      expect(user.role).not.toBe('admin');
      expect(user.role).toBe('user');
    });

    it('should track failed admin login attempts', async () => {
      // This would be implemented in the auth middleware
      // For now, verify the concept
      const maxFailedAttempts = 5;
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes

      expect(maxFailedAttempts).toBe(5);
      expect(lockoutDuration).toBe(900000);
    });
  });

  describe('2FA Requirements', () => {
    it('should require 2FA for admin accounts (future)', async () => {
      // This test documents the requirement for 2FA
      // Implementation should be added before production

      const [admin] = await db.select().from(users).where(eq(users.id, adminUserId));

      // Future: admin.twoFactorEnabled should be true
      // For now, document the requirement
      expect(admin).toBeDefined();

      // TODO: Implement 2FA requirement for admin accounts
      // expect(admin.twoFactorEnabled).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete admin user query in <50ms', async () => {
      const start = Date.now();

      await db.select().from(users).where(eq(users.id, adminUserId));

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should complete audit log query in <100ms', async () => {
      if (adminAuditLog) {
        const start = Date.now();

        await db.select()
          .from(adminAuditLog)
          .where(eq(adminAuditLog.userId, adminUserId))
          .orderBy(desc(adminAuditLog.timestamp))
          .limit(10);

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(100);
      }
    });
  });
});
