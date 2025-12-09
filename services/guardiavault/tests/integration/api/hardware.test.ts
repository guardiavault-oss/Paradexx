/**
 * Integration Tests for Hardware Device Ping API
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
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
  cspMiddleware: (req: any, res: any, next: any) => next(),
  createCSPMiddleware: () => (req: any, res: any, next: any) => next(),
  handleCSPViolation: async (req: any, res: any) => {
    res.status(204).end();
  },
}));

// Mock email service
vi.mock('../../../server/services/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Now import after mocks are set up
import { registerRoutes } from '../../../server/routes';
import { storage } from '../../../server/storage';
import { db } from '../../../server/db';
import { hardwareDevices, hardwarePingLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hardwareDeviceService } from '../../../server/services/hardwareDeviceService';

describe('Hardware Device API Integration Tests', () => {
  let app: Express;
  let server: Server;
  let testUserId: string;
  let testUserEmail: string;
  let testPassword: string;
  let sessionCookie: string;
  
  // Generate RSA key pair for testing
  let privateKey: crypto.KeyObject;
  let publicKeyPem: string;
  let deviceId: string;

  beforeAll(async () => {
    // Clear hardware devices data
    if (storage.constructor.name === 'MemStorage') {
      // Clear all data from MemStorage
      (storage as any).users.clear();
      (storage as any).vaults.clear();
      (storage as any).parties.clear();
      (storage as any).fragments.clear();
      (storage as any).checkIns.clear();
      (storage as any).notifications.clear();
    }

    // Create Express app
    app = express();

    // Setup session middleware
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

    // Create test user
    testUserEmail = `test-hardware-${Date.now()}@guardiavault.com`;
    testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const createdUser = await storage.createUser({
      email: testUserEmail,
      password: hashedPassword,
    });
    testUserId = createdUser.id;

    // Login to get session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword,
      });

    expect(loginResponse.status).toBe(200);
    sessionCookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';

    // Generate RSA key pair for hardware device
    const { publicKey, privateKey: privKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    privateKey = crypto.createPrivateKey(privKey);
    publicKeyPem = publicKey;
    deviceId = `test-device-${Date.now()}`;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await db.delete(hardwarePingLogs).where(eq(hardwarePingLogs.userId, testUserId));
      await db.delete(hardwareDevices).where(eq(hardwareDevices.userId, testUserId));
    } catch (error) {
      // Ignore cleanup errors
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Device Registration', () => {
    it('should register a new hardware device with valid signature', async () => {
      // Create registration signature
      const timestamp = Date.now();
      const registrationData = `GuardiaVault Device Registration\nDevice ID: ${deviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(registrationData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const response = await request(app)
        .post('/api/hardware/register')
        .set('Cookie', sessionCookie)
        .send({
          deviceId,
          deviceName: 'Test Hardware Device',
          publicKey: publicKeyPem,
          signature,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deviceId).toBe(deviceId);
    });

    it('should reject registration with invalid signature', async () => {
      const newDeviceId = `test-device-invalid-${Date.now()}`;
      
      const response = await request(app)
        .post('/api/hardware/register')
        .set('Cookie', sessionCookie)
        .send({
          deviceId: newDeviceId,
          deviceName: 'Invalid Device',
          publicKey: publicKeyPem,
          signature: 'invalid-signature',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('signature');
    });

    it('should reject registration with invalid public key format', async () => {
      const newDeviceId = `test-device-invalid-key-${Date.now()}`;
      
      const response = await request(app)
        .post('/api/hardware/register')
        .set('Cookie', sessionCookie)
        .send({
          deviceId: newDeviceId,
          deviceName: 'Invalid Key Device',
          publicKey: 'not-a-valid-pem-key',
          signature: 'some-signature',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('public key');
    });

    it('should require authentication for device registration', async () => {
      const response = await request(app)
        .post('/api/hardware/register')
        .send({
          deviceId: 'test-device',
          publicKey: publicKeyPem,
          signature: 'signature',
        })
        .expect(401);
    });
  });

  describe('Hardware Ping', () => {
    beforeEach(async () => {
      // Ensure device is registered before ping tests
      const timestamp = Date.now();
      const registrationData = `GuardiaVault Device Registration\nDevice ID: ${deviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(registrationData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      await request(app)
        .post('/api/hardware/register')
        .set('Cookie', sessionCookie)
        .send({
          deviceId,
          deviceName: 'Test Hardware Device',
          publicKey: publicKeyPem,
          signature,
        });
    });

    it('should accept valid hardware ping', async () => {
      // Create ping signature
      const timestamp = Date.now();
      const pingData = `GuardiaVault Hardware Ping\nDevice ID: ${deviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(pingData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const response = await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId,
          timestamp,
          signature,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successful');
      expect(response.body.lastPing).toBeDefined();
    });

    it('should reject ping with invalid signature', async () => {
      const timestamp = Date.now();

      const response = await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId,
          timestamp,
          signature: 'invalid-signature',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('signature');
    });

    it('should reject ping from unregistered device', async () => {
      const timestamp = Date.now();
      const pingData = `GuardiaVault Hardware Ping\nDevice ID: unregistered-device\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(pingData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const response = await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId: 'unregistered-device',
          timestamp,
          signature,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should reject ping with stale timestamp', async () => {
      // Create ping with timestamp 10 minutes ago
      const timestamp = Date.now() - 10 * 60 * 1000;
      const pingData = `GuardiaVault Hardware Ping\nDevice ID: ${deviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(pingData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const response = await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId,
          timestamp,
          signature,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('timestamp');
    });

    it('should reject ping with future timestamp', async () => {
      // Create ping with timestamp 10 minutes in the future
      const timestamp = Date.now() + 10 * 60 * 1000;
      const pingData = `GuardiaVault Hardware Ping\nDevice ID: ${deviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(pingData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const response = await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId,
          timestamp,
          signature,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('timestamp');
    });

    it('should require all required fields', async () => {
      const response = await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId,
          // Missing timestamp and signature
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should log ping attempts', async () => {
      const timestamp = Date.now();
      const pingData = `GuardiaVault Hardware Ping\nDevice ID: ${deviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(pingData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId,
          timestamp,
          signature,
        })
        .expect(200);

      // Check that ping was logged
      const logs = await db
        .select()
        .from(hardwarePingLogs)
        .where(eq(hardwarePingLogs.deviceId, deviceId))
        .orderBy(hardwarePingLogs.timestamp);

      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.signatureValid).toBe(true);
    });
  });

  describe('Device Management', () => {
    it('should get user devices', async () => {
      const response = await request(app)
        .get('/api/hardware/devices')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.devices)).toBe(true);
      expect(response.body.devices.length).toBeGreaterThan(0);
      
      const device = response.body.devices.find((d: any) => d.deviceId === deviceId);
      expect(device).toBeDefined();
      expect(device.status).toBe('active');
    });

    it('should require authentication to get devices', async () => {
      const response = await request(app)
        .get('/api/hardware/devices')
        .expect(401);
    });

    it('should delete a device', async () => {
      // Register a new device for deletion
      const deleteDeviceId = `test-device-delete-${Date.now()}`;
      const timestamp = Date.now();
      const registrationData = `GuardiaVault Device Registration\nDevice ID: ${deleteDeviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(registrationData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      await request(app)
        .post('/api/hardware/register')
        .set('Cookie', sessionCookie)
        .send({
          deviceId: deleteDeviceId,
          deviceName: 'Device to Delete',
          publicKey: publicKeyPem,
          signature,
        })
        .expect(200);

      // Delete the device
      const response = await request(app)
        .delete(`/api/hardware/devices/${deleteDeviceId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify device is deleted
      const devicesResponse = await request(app)
        .get('/api/hardware/devices')
        .set('Cookie', sessionCookie)
        .expect(200);

      const device = devicesResponse.body.devices.find((d: any) => d.deviceId === deleteDeviceId);
      expect(device).toBeUndefined();
    });

    it('should prevent deleting other users devices', async () => {
      // Create a second user and device
      const secondUserEmail = `test-hardware-2-${Date.now()}@guardiavault.com`;
      const hashedPassword2 = await bcrypt.hash('TestPassword123!', 10);
      const secondUser = await storage.createUser({
        email: secondUserEmail,
        password: hashedPassword2,
      });

      // Login as second user
      const loginResponse2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: secondUserEmail,
          password: 'TestPassword123!',
        });

      const sessionCookie2 = loginResponse2.headers['set-cookie']?.[0]?.split(';')[0] || '';

      // Register device for second user
      const secondDeviceId = `test-device-user2-${Date.now()}`;
      const timestamp = Date.now();
      const registrationData = `GuardiaVault Device Registration\nDevice ID: ${secondDeviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(registrationData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      await request(app)
        .post('/api/hardware/register')
        .set('Cookie', sessionCookie2)
        .send({
          deviceId: secondDeviceId,
          publicKey: publicKeyPem,
          signature,
        })
        .expect(200);

      // Try to delete second user's device as first user
      const response = await request(app)
        .delete(`/api/hardware/devices/${secondDeviceId}`)
        .set('Cookie', sessionCookie)
        .expect(404);

      expect(response.body.success).toBe(false);

      // Cleanup - delete second user's device
      await request(app)
        .delete(`/api/hardware/devices/${secondDeviceId}`)
        .set('Cookie', sessionCookie2)
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle SQL injection attempts in device ID', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE hardware_devices; --",
        "' OR '1'='1",
        "admin'--",
      ];

      for (const maliciousId of sqlInjectionAttempts) {
        const timestamp = Date.now();
        const pingData = `GuardiaVault Hardware Ping\nDevice ID: ${maliciousId}\nTimestamp: ${timestamp}`;
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(pingData);
        sign.end();
        const signature = sign.sign(privateKey, 'base64');

        const response = await request(app)
          .post('/api/hardware/ping')
          .send({
            deviceId: maliciousId,
            timestamp,
            signature,
          });

        // Should return 401 (device not found) or 400 (validation error), not 500
        expect([400, 401]).toContain(response.status);
      }
    });

    it('should handle very long device IDs', async () => {
      const longDeviceId = 'A'.repeat(10000);
      
      const response = await request(app)
        .post('/api/hardware/ping')
        .send({
          deviceId: longDeviceId,
          timestamp: Date.now(),
          signature: 'signature',
        });

      expect([400, 401]).toContain(response.status);
    });

    it('should handle special characters in device ID', async () => {
      const specialCharDeviceId = 'device!@#$%^&*()';
      
      // Try to register with special characters
      const timestamp = Date.now();
      const registrationData = `GuardiaVault Device Registration\nDevice ID: ${specialCharDeviceId}\nTimestamp: ${timestamp}`;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(registrationData);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const response = await request(app)
        .post('/api/hardware/register')
        .set('Cookie', sessionCookie)
        .send({
          deviceId: specialCharDeviceId,
          publicKey: publicKeyPem,
          signature,
        });

      // Should either accept or reject with validation error, not crash
      expect([200, 400]).toContain(response.status);
    });
  });
});

