// @ts-nocheck — Jest globals. checkJs has no test runner types.
const fs = require( 'fs' );
const path = require( 'path' );

const root = path.join( __dirname, '..' );

function bridgeMethods( source ) {
  const start = source.indexOf( "exposeInMainWorld( 'rendererBridge'," );
  const block = source.slice( start );
  return [ ...block.matchAll( /^\s{2}([A-Za-z][A-Za-z0-9]*)\(/gm ) ].map( ( match ) => match[1] );
}

it( 'the packaging note names every rendererBridge method', () => {
  const preload = fs.readFileSync( path.join( root, 'src', 'preload', 'index.js' ), 'utf8' );
  const note = fs.readFileSync(
    path.join( root, 'docs', 'research', 'electron-vite-packaging.md' ),
    'utf8',
  );
  const missing = bridgeMethods( preload )
    .filter( ( name ) => !note.includes( `rendererBridge.${name}` ) );
  expect( missing ).toEqual( [] );
} );
