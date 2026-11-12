import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', seed: 'src/seed/seed.ts' },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  sourcemap: true,
  clean: true,
  // Bundle the shared workspace package (TypeScript source) into the server output.
  noExternal: ['@cms/shared'],
});
