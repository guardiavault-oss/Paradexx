import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/**/*.test.ts'],
    testTimeout: 15000, // 15 seconds timeout for smoke tests
    hookTimeout: 15000,
    teardownTimeout: 15000,
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
