import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for API Contract Testing
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/contract/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
