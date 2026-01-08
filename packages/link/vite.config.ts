import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LiveEditorLink',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@live-editor/core', 'vue'],
      output: {
        globals: {
          '@live-editor/core': 'LiveEditorCore',
          vue: 'Vue',
        },
      },
    },
  },
});
