import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@live-editor/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
