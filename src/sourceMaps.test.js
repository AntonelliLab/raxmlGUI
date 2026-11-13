// @ts-nocheck — Jest globals. checkJs has no test runner types.
const { spawnSync } = require( 'child_process' );
const path = require( 'path' );
const { version } = require( '../package.json' );

const root = path.join( __dirname, '..' );
const configFile = path.join( root, 'electron.vite.config.js' );
const release = `raxmlGUI@${version}`;

function shellBuild( command, env ) {
  const childEnv = { ...process.env };
  [ 'SENTRY_ORG', 'SENTRY_AUTH_TOKEN', 'SENTRY_PROJECT', 'SENTRY_RELEASE', 'SENTRY_URL' ].forEach( ( key ) => {
    delete childEnv[ key ];
  } );
  Object.assign( childEnv, env );
  const script = [
    "import { loadConfigFromFile } from 'electron-vite';",
    `const loaded = await loadConfigFromFile({ command: ${JSON.stringify( command )}, mode: 'production' }, ${JSON.stringify( configFile )}, ${JSON.stringify( root )});`,
    'const list = (plugins) => (plugins || []).flat().filter(Boolean);',
    'const releaseSnippet = async (plugins) => {',
    "  const plugin = list(plugins).find((item) => item.name === 'sentry-vite-plugin');",
    '  if (!plugin) return null;',
    "  const rendered = await plugin.renderChunk('var app = 1;\\n', { fileName: 'index.js', facadeModuleId: null });",
    '  return rendered && rendered.code;',
    '};',
    'console.log("SOURCE_MAPS " + JSON.stringify({',
    '  main: list(loaded.config.main.plugins).map((item) => item.name),',
    '  preload: list(loaded.config.preload && loaded.config.preload.plugins).map((item) => item.name),',
    '  renderer: list(loaded.config.renderer.plugins).map((item) => item.name),',
    '  mainRelease: await releaseSnippet(loaded.config.main.plugins),',
    '  rendererRelease: await releaseSnippet(loaded.config.renderer.plugins),',
    '}));',
  ].join( '\n' );
  const result = spawnSync( process.execPath, [ '--input-type=module', '-e', script ], {
    cwd: root,
    env: childEnv,
    encoding: 'utf8',
  } );
  if ( result.status !== 0 ) {
    throw new Error( result.stderr || result.stdout );
  }
  const line = result.stdout.split( '\n' ).find( ( item ) => item.startsWith( 'SOURCE_MAPS ' ) );
  return JSON.parse( line.slice( 'SOURCE_MAPS '.length ) );
}

const credentials = { SENTRY_ORG: 'antonelli-lab', SENTRY_AUTH_TOKEN: 'token' };

function expectNoSourceMapPlugin( plugins ) {
  expect( plugins.main ).not.toContain( 'sentry-vite-plugin' );
  expect( plugins.renderer ).not.toContain( 'sentry-vite-plugin' );
  expect( plugins.preload ).not.toContain( 'sentry-vite-plugin' );
}

it( 'uploads main and page source maps for raxmlGUI@version on a production build', () => {
  const plugins = shellBuild( 'build', credentials );

  expect( plugins.main ).toContain( 'sentry-vite-plugin' );
  expect( plugins.renderer ).toContain( 'sentry-vite-plugin' );
  expect( plugins.preload ).not.toContain( 'sentry-vite-plugin' );
  expect( plugins.mainRelease ).toContain( `SENTRY_RELEASE={id:"${release}"}` );
  expect( plugins.rendererRelease ).toContain( `SENTRY_RELEASE={id:"${release}"}` );
} );

it( 'skips the source map upload without both Sentry credentials', () => {
  [ {}, { SENTRY_ORG: 'antonelli-lab' }, { SENTRY_AUTH_TOKEN: 'token' } ].forEach( ( env ) => {
    expectNoSourceMapPlugin( shellBuild( 'build', env ) );
  } );
} );

it( 'skips the source map upload in dev', () => {
  expectNoSourceMapPlugin( shellBuild( 'serve', credentials ) );
} );
