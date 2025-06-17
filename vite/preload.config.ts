import { defineConfig } from 'vite';
import { getAbsolutePath } from './utils/get-absolute-path.js';

export default defineConfig({
  root: getAbsolutePath('src', 'preload'),
  base: './',
  build: {
    emptyOutDir: false,
    target: 'es2022',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
    outDir: getAbsolutePath('dist/preload'),
    rollupOptions: {
      external: ['electron'],
      input: {
        index: getAbsolutePath('src', 'preload', 'index.ts'),
      },
      output: [
        {
          entryFileNames: '[name].cjs',
          format: 'cjs',
        },
      ],
    },
  },
});
