import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssModule from '../../scripts/vite-plugin-css-module.js';

export default defineConfig({
  plugins: [react(), cssModule()],
  build: {
    lib: {
      entry: {
        index: 'src/index.js',
        'core/index': 'src/core/index.js',
        'vanilla/index': 'src/vanilla/index.js',
        element: 'src/element.js',
      },
      formats: ['es'],
    },
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      // React is a peer dependency and must never be bundled.
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: 'style.css',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['../../vitest.setup.js'],
  },
});
