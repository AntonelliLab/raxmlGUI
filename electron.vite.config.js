import { resolve } from 'node:path';
import { sentryVitePlugin } from '@sentry/bundler-plugins/vite';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

// Dev still builds main, so this gates on electron-vite's command. Leave build.sourcemap unset: this plugin turns hidden maps on and deletes them. An explicit true or "hidden" leaves .map files in out/, which the pack includes. The upload also needs SENTRY_PROJECT in the environment.
function sourceMapUpload( command ) {
  if ( command !== 'build' || !process.env.SENTRY_ORG || !process.env.SENTRY_AUTH_TOKEN ) {
    return [];
  }
  return sentryVitePlugin( {
    release: {
      name: `raxmlGUI@${version}`,
    },
  } );
}

export default defineConfig( ( { command } ) => ( {
  main: {
    // electron-webpack injected this path. The main process still reads the repo's static files through it.
    define: {
      __static: JSON.stringify( resolve( __dirname, 'static' ) ),
    },
    plugins: sourceMapUpload( command ),
  },
  preload: {
    build: {
      externalizeDeps: false,
    },
  },
  renderer: {
    root: '.',
    publicDir: false,
    resolve: {
      // Default entry also loads filenamify-path, which needs Node's path.
      alias: {
        filenamify: resolve( __dirname, 'node_modules/filenamify/filenamify.js' ),
      },
    },
    optimizeDeps: {
      // The page keeps JSX in .js files. The dep scanner parses those only when .js is jsx.
      rolldownOptions: {
        moduleTypes: {
          '.js': 'jsx',
        },
      },
    },
    plugins: [
      // plugin-react 5: its babel option compiles legacy MobX decorators. 6 dropped babel.
      // JSX in .js is compiled here too: Vite's oxc parser does not treat .js as JSX.
      react( {
        babel: {
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
          ],
        },
      } ),
      ...sourceMapUpload( command ),
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve( __dirname, 'index.html' ),
        },
      },
    },
  },
} ) );
