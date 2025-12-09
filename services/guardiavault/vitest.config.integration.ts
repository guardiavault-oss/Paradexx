import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup/global-setup.ts"],
    include: [
      "tests/integration/**/*.test.ts",
      "tests/integration/**/*.spec.ts",
    ],
    exclude: ["node_modules", "dist", "build"],
    testTimeout: 30000, // Integration tests may take longer
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
});

