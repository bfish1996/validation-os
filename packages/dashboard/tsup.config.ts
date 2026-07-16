import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  external: ["react", "react-dom"],
  // These are React client components; preserve the directive esbuild strips.
  banner: { js: '"use client";' },
});
