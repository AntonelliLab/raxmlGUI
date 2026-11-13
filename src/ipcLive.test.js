// @ts-nocheck — Jest globals. checkJs has no test runner types.
const fs = require( 'fs' );
const path = require( 'path' );

const root = path.join( __dirname, '..' );

function walkJs( dir ) {
  const files = [];
  for ( const name of fs.readdirSync( dir ) ) {
    const full = path.join( dir, name );
    if ( fs.statSync( full ).isDirectory() ) {
      files.push( ...walkJs( full ) );
    } else if ( /\.(js|jsx|ts|tsx)$/.test( name ) && !name.endsWith( '.test.js' ) ) {
      files.push( full );
    }
  }
  return files;
}

it( 'every ipc export is used by the preload or a main handler', () => {
  const ipcPath = path.join( root, 'src', 'constants', 'ipc.js' );
  const exports = [ ...fs.readFileSync( ipcPath, 'utf8' ).matchAll(
    /^export const ([A-Z][A-Z0-9_]*) =/gm,
  ) ].map( ( match ) => match[1] );
  expect( exports.length ).toBeGreaterThan( 0 );

  const blob = [
    ...walkJs( path.join( root, 'src', 'preload' ) ),
    ...walkJs( path.join( root, 'src', 'main' ) ),
  ]
    .filter( ( file ) => file !== ipcPath )
    .map( ( file ) => fs.readFileSync( file, 'utf8' ) )
    .join( '\n' );

  const unused = exports.filter( ( name ) => !new RegExp( `\\b${name}\\b` ).test( blob ) );
  expect( unused ).toEqual( [] );
} );
