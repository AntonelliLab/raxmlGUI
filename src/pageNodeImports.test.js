// @ts-nocheck — Jest globals. checkJs has no test runner types.
const fs = require( 'fs' );
const path = require( 'path' );

const appRoot = path.join( __dirname, 'app' );
const forbidden = [
  /from\s+['"]electron['"]/,
  /from\s+['"]electron-better-ipc['"]/,
  /from\s+['"]fs['"]/,
  /from\s+['"]os['"]/,
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:os['"]/,
];

function walk( dir ) {
  const out = [];
  for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
    const full = path.join( dir, entry.name );
    if ( entry.isDirectory() ) {
      out.push( ...walk( full ) );
    } else if ( /\.(js|jsx|ts|tsx)$/.test( entry.name ) && !entry.name.endsWith( '.test.js' ) ) {
      out.push( full );
    }
  }
  return out;
}

it( 'the page does not import electron, electron-better-ipc, fs, or os', () => {
  const hits = [];
  for ( const file of walk( appRoot ) ) {
    const text = fs.readFileSync( file, 'utf8' );
    for ( const pattern of forbidden ) {
      if ( pattern.test( text ) ) {
        hits.push( `${path.relative( appRoot, file )}: ${pattern}` );
      }
    }
  }
  expect( hits ).toEqual( [] );
} );

it( 'the page can still import the user-fix error type and the alignment typecheck', () => {
  const alignment = fs.readFileSync( path.join( appRoot, 'store', 'Alignment.js' ), 'utf8' );
  const run = fs.readFileSync( path.join( appRoot, 'store', 'Run.js' ), 'utf8' );
  expect( alignment ).toMatch( /from ['"]\.\.\/\.\.\/common\/typecheckAlignment['"]/ );
  expect( alignment ).toMatch( /from ['"]\.\.\/\.\.\/common\/errors['"]/ );
  expect( run ).toMatch( /from ['"]\.\.\/\.\.\/common\/errors['"]/ );
  expect( fs.readFileSync( path.join( __dirname, 'app', 'index.js' ), 'utf8' ) )
    .not.toMatch( /from ['"]\.\.\/common\/utils['"]/ );
} );
