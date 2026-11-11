// @ts-nocheck — electron-builder's pack matcher has no types.
import path from 'path';

const { getConfig } = require( 'app-builder-lib/out/util/config' );
const { getMainFileMatchers, getNodeModuleFileMatcher } = require( 'app-builder-lib/out/fileMatcher' );
const { scripts } = require( '../package.json' );

const root = path.join( __dirname, '..' );
const fileStat = { isDirectory: () => false };

function included( filter, relativePath ) {
  return filter( path.join( root, relativePath ), fileStat );
}

async function packFilters() {
  const config = await getConfig( root, null, null );
  const macroExpander = ( pattern ) => pattern;
  const info = {
    isPrepackedAppAsar: false,
    config,
    projectDir: root,
    buildResourcesDir: 'build',
    debugLogger: { isEnabled: false },
  };
  const destination = path.join( root, 'unused-dest' );
  const main = getMainFileMatchers(
    root,
    destination,
    macroExpander,
    {},
    { info },
    path.join( root, 'dist' ),
    false,
  );
  const modules = getNodeModuleFileMatcher( root, destination, macroExpander, {}, info );
  return {
    config,
    main: main[ 0 ].createFilter(),
    modules: modules.createFilter(),
  };
}

it( 'packs the built shell and the production dependencies', async () => {
  const { config, main, modules } = await packFilters();
  const patterns = config.files.flatMap( ( set ) => set.filter );

  expect( patterns.every( ( pattern ) => pattern.startsWith( '!' ) ) ).toBe( true );
  expect( included( main, 'out/main/index.js' ) ).toBe( true );
  expect( included( main, 'README.md' ) ).toBe( true );
  expect( included( main, 'src/main/index.js' ) ).toBe( false );
  expect( included( main, 'e2e/raxmlHPC.spec.js' ) ).toBe( false );
  expect( included( main, 'docs/_config.yml' ) ).toBe( false );
  expect( included( main, 'electron.vite.config.js' ) ).toBe( false );
  expect( included( modules, 'node_modules/electron-log/package.json' ) ).toBe( true );

  expect( config.afterSign ).toBe( './scripts/notarize.js' );
  expect( config.publish ).toEqual( { provider: 'github' } );
  expect( config.extraMetadata ).toBeUndefined();
  expect( config.extraResources ).toEqual( [ { filter: [ 'assets/' ] } ] );
  expect( config.mac.extraResources ).toEqual( [
    {
      from: 'static/bin/Mac',
      to: 'static/bin',
    },
    {
      from: 'static/example-files/fasta',
      to: 'static/example-files',
      filter: [ '*.txt' ],
    },
  ] );
  expect( config.win.extraResources ).toEqual( [
    {
      from: 'static/bin/Windows',
      to: 'static/bin',
    },
  ] );
  expect( config.linux.extraResources ).toEqual( [
    {
      from: 'static/bin/Linux',
      to: 'static/bin',
    },
  ] );
} );

it( 'pack scripts build the shell, then run electron-builder', () => {
  expect( scripts.build ).toBe( 'electron-vite build' );

  const packScripts = {
    'build-mac': 'electron-build',
    'build-win': 'electron-build-win',
    'build-linux': 'electron-build-linux',
    'build-all': 'electron-build-all',
    'publish-all': 'electron-build-publish-all',
    'dist-pack': 'electron-pack',
    'dist-pack-win': 'electron-pack-win',
  };
  Object.keys( packScripts ).forEach( ( name ) => {
    expect( scripts[ name ] ).toBe( `run-s build ${ packScripts[ name ] }` );
  } );

  expect( scripts[ 'electron-build' ] ).toBe( 'electron-builder' );
  expect( scripts[ 'electron-build-win' ] ).toBe( 'electron-builder -w' );
  expect( scripts[ 'electron-build-linux' ] ).toBe( 'electron-builder -l' );
  expect( scripts[ 'electron-build-all' ] ).toBe( 'electron-builder -mwl' );
  expect( scripts[ 'electron-build-publish-all' ] ).toBe( 'electron-builder -mwl -p always' );
  expect( scripts[ 'electron-pack' ] ).toBe( 'electron-builder --dir -c.compression=store -c.mac.identity=null' );
  expect( scripts[ 'electron-pack-win' ] ).toBe( 'electron-builder -w --dir -c.compression=store' );
} );
