import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/test-utils.tsx", "./client/src/test/setup.ts"],
    include: [
      "client/src/**/*.test.tsx",
      "client/src/**/*.spec.tsx",
      "tests/frontend/**/*.test.tsx",
      "tests/frontend/**/*.spec.tsx",
    ],
    exclude: ["node_modules", "dist", "build"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.tsx",
        "**/*.spec.tsx",
        "client/src/main.tsx",
        "client/src/vite-env.d.ts",
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
