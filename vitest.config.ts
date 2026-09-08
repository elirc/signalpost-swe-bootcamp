import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/**/*.containers.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 1,
  },
});
