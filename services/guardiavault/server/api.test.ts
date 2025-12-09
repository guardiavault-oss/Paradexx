/**
 * API Endpoint Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { registerRoutes } from './routes';

describe('API Endpoints', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    // Mock environment
    process.env.NODE_ENV = 'test';
    process.env.SESSION_SECRET = 'test-secret';
    
    app = express();
    
    // Setup session middleware (required for routes that use requireAuth)
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    );
    
    app.use(express.json());
    
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Health Endpoints', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('GET /ready should check dependencies', async () => {
      const response = await request(app).get('/ready');
      
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('Security Endpoints', () => {
    it('GET /api/security/risk-events requires authentication', async () => {
      const response = await request(app).get('/api/security/risk-events');
      
      expect(response.status).toBe(401);
    });

    it('POST /api/security/biometrics requires authentication', async () => {
      const response = await request(app)
        .post('/api/security/biometrics')
        .send({ dataType: 'typing_pattern', signature: 'test' });
      
      expect(response.status).toBe(401);
    });
  });

  describe('Legacy Messages Endpoints', () => {
    it('GET /api/vaults/:vaultId/legacy-messages requires authentication', async () => {
      const response = await request(app).get('/api/vaults/test-vault/legacy-messages');
      
      expect(response.status).toBe(401);
    });

    it('POST /api/vaults/:vaultId/legacy-messages requires authentication', async () => {
      const response = await request(app)
        .post('/api/vaults/test-vault/legacy-messages')
        .send({ type: 'letter', title: 'Test' });
      
      expect(response.status).toBe(401);
    });
  });
});

