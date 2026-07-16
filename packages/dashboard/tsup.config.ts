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
  // The styling seam (OPS-1280): ship the token sheet as a static asset next to
  // the bundle so instances `import "@validation-os/dashboard/styles.css"`. It's
  // plain CSS with no build step, so copy it verbatim after the JS build (which
  // runs with clean:true, wiping dist first).
  onSuccess: "cp src/styles.css dist/styles.css",
});
