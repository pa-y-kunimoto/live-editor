import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['**/*.{test,spec}.{js,ts}'],
  },
  resolve: {
    alias: {
      '~': new URL('./', import.meta.url).pathname,
      '@': new URL('./', import.meta.url).pathname,
      // Resolve workspace packages to source for testing
      '@live-editor/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@live-editor/code-block': resolve(__dirname, '../../packages/code-block/src/index.ts'),
      '@live-editor/list': resolve(__dirname, '../../packages/list/src/index.ts'),
      '@live-editor/table': resolve(__dirname, '../../packages/table/src/index.ts'),
      '@live-editor/quote': resolve(__dirname, '../../packages/quote/src/index.ts'),
      '@live-editor/link': resolve(__dirname, '../../packages/link/src/index.ts'),
      '@live-editor/history': resolve(__dirname, '../../packages/history/src/index.ts'),
      '@live-editor/document': resolve(__dirname, '../../packages/document/src/index.ts'),
    },
  },
});
