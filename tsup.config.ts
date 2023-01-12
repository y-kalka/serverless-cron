import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	outDir: 'dist',
	clean: true,
	format: ['esm', 'cjs'],
	minify: true,
	treeshake: true,
	dts: true,
	target: ['node14', 'node16', 'node18'],
});
