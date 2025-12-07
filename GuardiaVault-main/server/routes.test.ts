import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import session from 'express-session';
import { registerRoutes } from './routes';

// Mock storage
vi.mock('./storage', () => ({
  storage: {
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getVault: vi.fn(),
    createVault: vi.fn(),
  },
}));

describe('API Routes', () => {
  let app: Express;

  beforeEach(async () => {
    app = express();
    
    // Setup session middleware
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    );
    
    app.use(express.json());
    
    await registerRoutes(app);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const { storage } = await import('./storage');
      
      vi.mocked(storage.createUser).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { storage } = await import('./storage');
      const bcrypt = await import('bcrypt');
      
      const hashedPassword = await bcrypt.default.hash('password123', 10);
      
      vi.mocked(storage.getUserByEmail).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        createdAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const { storage } = await import('./storage');
      
      vi.mocked(storage.getUserByEmail).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vaults', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/vaults')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    // Note: Testing authenticated routes requires setting up session
    // This is a simplified example - full implementation would mock session
  });
});

