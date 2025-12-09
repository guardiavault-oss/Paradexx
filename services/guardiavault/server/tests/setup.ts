/**
 * Test Setup
 * Configure test environment
 */

import { beforeAll, afterAll, vi } from "vitest";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET = "test-secret";
process.env.JWT_SECRET = "test-jwt-secret";

// Mock external services
vi.mock("../services/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
  auditLog: vi.fn(),
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
  requestLogger: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock("../services/errorTracking", () => ({
  captureException: vi.fn(),
  initSentry: vi.fn(),
}));

beforeAll(() => {
  // Setup test database if needed
});

afterAll(() => {
  // Cleanup
});

