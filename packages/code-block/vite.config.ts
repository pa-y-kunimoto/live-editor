import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LiveEditorCodeBlock',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@live-editor/core', 'highlight.js', 'highlight.js/lib/core'],
      output: {
        globals: {
          '@live-editor/core': 'LiveEditorCore',
        },
      },
    },
  },
});
