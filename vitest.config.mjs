import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const here = ( file ) => resolve( import.meta.dirname, file );

export default defineConfig( {
  resolve: {
    alias: {
      // Same alias as the renderer in electron.vite.config.js.
      filenamify: here( 'node_modules/filenamify/filenamify.js' ),
      electron: here( 'src/test/electron.js' ),
      '@sentry/electron/renderer': here( 'src/test/sentry.js' ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    clearMocks: false,
    include: [ 'src/**/*.test.{js,jsx,ts,tsx}', 'e2e/helpers/**/*.test.js' ],
    // Order matters: the bridge is installed before the page store loads, then the MobX check wraps each test.
    setupFiles: [ './src/test/setup.js', './src/test/mobxActionWarning.js' ],
  },
} );
