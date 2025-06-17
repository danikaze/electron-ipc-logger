import { defineConfig } from 'vite';
import { getAbsolutePath } from './utils/get-absolute-path.js';
import { getNiceScopedName } from './utils/get-nice-scoped-name.js';

export default defineConfig(({ command }) => {
  const mode =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return {
    root: getAbsolutePath('src', 'ui'),
    base: './',
    build: {
      emptyOutDir: false,
      target: 'es2022',
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      outDir: getAbsolutePath('dist', 'ui'),
      rollupOptions: {
        input: {
          index: getAbsolutePath('src', 'ui', 'index.html'),
        },
        output: [
          {
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name]-[hash][extname]',
            manualChunks(id) {
              if (id.includes('node_modules')) {
                return 'vendors';
              }
            },
          },
        ],
        onwarn: (warning, warn) => {
          // drop all the "use client" warnings from @headlessui
          // https://github.com/rollup/rollup/issues/4699
          if (
            warning.message.includes('@headlessui') &&
            warning.message.includes('"use client"')
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    css: {
      modules: {
        // use this instead to generate just hashed names in production (without paths/local names)
        // generateScopedName: env.command === 'build' ? getHashedScopedName() : getNiceScopedName(),
        generateScopedName: getNiceScopedName(),
      },
      preprocessorOptions: {
        scss: {
          // https://sass-lang.com/documentation/breaking-changes/legacy-js-api/
          api: 'modern',
        },
      },
    },
  };
});
