import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    // The Firestore emulator contract test opts in via RUN_EMULATOR_TESTS=1
    // (it needs a running emulator, which needs a Java runtime).
    environment: "node",
  },
});
