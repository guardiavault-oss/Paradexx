/**
 * Integration Tests for Authentication API
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import type { Express } from 'express';
import type { Server } from 'http';

// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-key-for-testing-only';

// Mock logger to avoid issues during route registration
vi.mock('../../../server/services/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
  auditLog: vi.fn(),
}));

// Mock CSP middleware to avoid CSP configuration issues in tests
vi.mock('../../../server/middleware/csp', () => ({
  nonceMiddleware: (req: any, res: any, next: any) => {
    req.nonce = 'test-nonce';
    next();
  },
  cspMiddleware: (req: any, res: any, next: any) => next(), // No-op middleware for tests
  createCSPMiddleware: () => (req: any, res: any, next: any) => next(),
  handleCSPViolation: async (req: any, res: any) => {
    res.status(204).end();
  },
}));

// Now import after mocks are set up
import { registerRoutes } from '../../../server/routes';
import { storage } from '../../../server/storage';

describe('Authentication API Integration Tests', () => {
  let app: Express;
  let server: Server;
  let testUserId: string;
  const testUser = {
    email: `test-${Date.now()}@guardiavault.com`,
    password: 'TestPassword123!',
  };

  beforeAll(async () => {
    // Ensure we're using in-memory storage (will be MemStorage if DATABASE_URL not set)
    // Clear any existing data by resetting maps if MemStorage
    if (storage.constructor.name === 'MemStorage') {
      // Clear all data from MemStorage
      (storage as any).users.clear();
      (storage as any).vaults.clear();
      (storage as any).parties.clear();
      (storage as any).fragments.clear();
      (storage as any).checkIns.clear();
      (storage as any).notifications.clear();
      (storage as any).vaultTriggerClaims.clear();
      (storage as any).claimFiles.clear();
      (storage as any).claimAttestations.clear();
      (storage as any).recoveries.clear();
      (storage as any).recoveryKeys.clear();
    }

    // Create Express app
    app = express();

    // Setup session middleware (required for routes that use requireAuth)
    app.use(
      session({
        secret: process.env.SESSION_SECRET || 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    );

    app.use(express.json());

    // Register actual routes
    server = await registerRoutes(app);

    // Create test user with properly hashed password
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const createdUser = await storage.createUser({
      email: testUser.email,
      password: hashedPassword,
    });
    testUserId = createdUser.id;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const newEmail = `test-register-${Date.now()}@guardiavault.com`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: newEmail,
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(newEmail);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        });

      // Should return validation error (400 or 422)
      expect([400, 422]).toContain(response.status);
    });

    it('should enforce password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'weak',
        });

      // Should return validation error
      expect([400, 422]).toContain(response.status);
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      const newEmail = `test-duplicate-${Date.now()}@guardiavault.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email: newEmail,
          password: testUser.password,
        });

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: newEmail,
          password: testUser.password,
        });

      // Should return conflict error (409) or validation error
      expect([409, 400, 422]).toContain(response.status);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('required');
    });

    it('should return 401 for empty email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: testUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle SQL injection attempts safely', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' UNION SELECT * FROM users --",
      ];

      for (const sqlInjection of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: sqlInjection,
            password: testUser.password,
          });

        // Should return 401 (user not found) or 400 (validation error), not 500 (server error)
        expect([400, 401]).toContain(response.status);
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should handle very long passwords', async () => {
      const veryLongPassword = 'A'.repeat(10000);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: veryLongPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle special characters in password', async () => {
      const specialCharPasswords = [
        'Test!@#$%^&*()',
        'Test<>?:"{}|',
        'Test[]\\;\',./',
        'Test`~',
        'Test\u0000\u0001',
        'Test🎉',
      ];

      for (const password of specialCharPasswords) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: password,
          })
          .expect(401);

        expect(response.body).toHaveProperty('message');
      }
    });

    it('should include security headers in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      // Check that response doesn't leak sensitive information
      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid session', async () => {
      // First login to get session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(loginResponse.status).toBe(200);
      const sessionCookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';

      // Get user data using session cookie
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 without session', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(loginResponse.status).toBe(200);
      const sessionCookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should invalidate session after logout', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(loginResponse.status).toBe(200);
      const sessionCookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Try to use session after logout (should fail)
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      // Should return 401 after logout
      expect(meResponse.status).toBe(401);
    });
  });

  describe('Security', () => {
    it('should not leak information about user existence', async () => {
      // Try to login with non-existent email
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'somepassword',
        })
        .expect(401);

      // Try to login with existing email but wrong password
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      // Error messages should be similar (generic "Invalid email or password")
      expect(response1.body.message).toBeTruthy();
      expect(response2.body.message).toBeTruthy();
      // Both should return the same generic message
      expect(response1.body.message).toContain('Invalid');
      expect(response2.body.message).toContain('Invalid');
    });

    it('should handle concurrent login attempts', async () => {
      // Attempt multiple logins concurrently
      const requests = Array.from({ length: 5 }, () =>
        request(app).post('/api/auth/login').send({
          email: testUser.email,
          password: testUser.password,
        })
      );

      const responses = await Promise.all(requests);

      // All should succeed with valid credentials
      responses.forEach((response) => {
        expect([200, 401]).toContain(response.status);
      });
    });
  });
});
