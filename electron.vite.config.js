import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { sentryVitePlugin } from '@sentry/bundler-plugins/vite';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

const nodeBuiltins = builtinModules.filter( ( name ) => !name.startsWith( '_' ) );
const nodePackages = [
  'electron',
  'electron-store',
  'electron-better-ipc',
  '@sentry/electron',
  '@sentry/electron/renderer',
  '@sentry/electron/main',
  'cpus',
  'parse-filepath',
  'filenamify',
  'clean-stack',
];
const nodeExternals = [
  ...nodePackages,
  ...nodeBuiltins,
  ...nodeBuiltins.map( ( name ) => (
    name.startsWith( 'node:' )
      ? name
      : `node:${name}`
  ) ),
];

// electron-vite serves the page as browser ESM. require() keeps Node, which the page still uses.
function rendererNodeBabel( externals ) {
  const external = new Set( externals );
  return ( { types: t } ) => ( {
    name: 'renderer-node',
    visitor: {
      ImportDeclaration( path ) {
        if ( path.node.importKind === 'type' || !external.has( path.node.source.value ) ) {
          return;
        }
        const specs = path.node.specifiers.filter( ( spec ) => spec.importKind !== 'type' );
        const req = t.callExpression(
          t.memberExpression( t.identifier( 'globalThis' ), t.identifier( 'require' ) ),
          [t.stringLiteral( path.node.source.value )],
        );
        const namespace = specs.find( ( spec ) => spec.type === 'ImportNamespaceSpecifier' );
        const named = specs.filter( ( spec ) => spec.type === 'ImportSpecifier' );
        const defaults = specs.filter( ( spec ) => spec.type === 'ImportDefaultSpecifier' );
        if ( namespace ) {
          path.replaceWith( t.variableDeclaration( 'const', [
            t.variableDeclarator( namespace.local, req ),
          ] ) );
          return;
        }
        const pattern = () => t.objectPattern( named.map( ( spec ) => {
          const imported = spec.imported.type === 'Identifier'
            ? spec.imported.name
            : spec.imported.value;
          const shorthand = imported === spec.local.name;
          return t.objectProperty(
            t.identifier( imported ),
            t.identifier( spec.local.name ),
            false,
            shorthand,
          );
        } ) );
        if ( defaults.length && named.length ) {
          path.replaceWithMultiple( [
            t.variableDeclaration( 'const', [
              t.variableDeclarator( defaults[0].local, req ),
            ] ),
            t.variableDeclaration( 'const', [
              t.variableDeclarator( pattern(), t.identifier( defaults[0].local.name ) ),
            ] ),
          ] );
          return;
        }
        if ( defaults.length ) {
          path.replaceWith( t.variableDeclaration( 'const', [
            t.variableDeclarator( defaults[0].local, req ),
          ] ) );
          return;
        }
        path.replaceWith( t.variableDeclaration( 'const', [
          t.variableDeclarator( pattern(), req ),
        ] ) );
      },
    },
  } );
}

// The menu no longer imports the store. The shared helper still dynamic-imports it, and only on the page.
function leaveDecoratedStoreOutOfMain() {
  return {
    name: 'leave-decorated-store-out-of-main',
    enforce: 'pre',
    resolveId( source ) {
      if ( source.replaceAll( '\\', '/' ).includes( '/app/store' ) ) {
        return { id: source, external: true };
      }
      return null;
    },
  };
}

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
    plugins: [leaveDecoratedStoreOutOfMain(), ...sourceMapUpload( command )],
  },
  preload: {},
  renderer: {
    root: '.',
    publicDir: false,
    optimizeDeps: {
      // The page keeps JSX in .js files. The dep scanner parses those only when .js is jsx.
      rolldownOptions: {
        moduleTypes: {
          '.js': 'jsx',
        },
      },
      exclude: nodePackages,
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
            rendererNodeBabel( nodeExternals ),
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
