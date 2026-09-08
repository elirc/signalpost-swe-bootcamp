import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.containers.test.ts"],
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
