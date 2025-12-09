import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./server/tests/setup.ts"],
    include: [
      "server/**/*.test.ts",
      "tests/**/*.test.ts",
      "tests/**/*.spec.ts",
    ],
    exclude: [
      "node_modules",
      "dist",
      "build",
      "client/**/*.test.tsx",
      "client/**/*.spec.tsx",
      "tests/frontend/**/*.test.tsx",
      "tests/frontend/**/*.spec.tsx",
      "tests/e2e/**/*.spec.ts",
      "tests/e2e/**/*.test.ts",
      "**/migrations/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/migrations/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
