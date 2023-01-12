import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: "dist",
  clean: true,
  format: ["esm", "cjs"],
  minify: true,
  treeshake: true,
  dts: true,
  target: ["es2017"],
})