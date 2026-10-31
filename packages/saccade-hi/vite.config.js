import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const core = fileURLToPath(new URL('../saccade-keyboards/src/core/index.js', import.meta.url));

export default defineConfig({
  build: {
    lib: { entry: { index: 'src/index.js' }, formats: ['es'] },
    sourcemap: true,
    rollupOptions: {
      // The engine is a peer dependency and must never be bundled.
      external: [/^@coldsofttech\/saccade-keyboards($|\/)/],
      output: { entryFileNames: '[name].js' },
    },
  },
  resolve: {
    // Tests run against the engine source, so they need no build of it first.
    alias: { '@coldsofttech/saccade-keyboards/core': core },
  },
  test: { environment: 'node' },
});
