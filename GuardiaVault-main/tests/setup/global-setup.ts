/**
 * Global Test Setup
 * Runs before all tests
 */

export default async function globalSetup() {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test";
  
  // Suppress console warnings in tests
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Filter out known test warnings
    if (
      args[0]?.includes?.("React Router") ||
      args[0]?.includes?.("Warning:")
    ) {
      return;
    }
    originalWarn(...args);
  };
}

