import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
    // Node is the default; DOM/component tests opt into jsdom per-file with a
    // `// @vitest-environment jsdom` docblock, so pure view-model tests stay fast.
    // The Firestore emulator contract test opts in via RUN_EMULATOR_TESTS=1
    // (it needs a running emulator, which needs a Java runtime).
    environment: "node",
  },
});
