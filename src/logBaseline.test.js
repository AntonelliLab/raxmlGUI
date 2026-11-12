// @ts-nocheck — Jest globals. checkJs has no test runner types.
const { missingLines } = require( '../scripts/log-baseline' );

it( 'reports a log line the source no longer has', () => {
  const known = ['src/a.js: console.debug( ipc.FILE_OPEN, fullPath );'];
  expect( missingLines( known, known ) ).toEqual( [] );
  expect( missingLines( [], known ) ).toEqual( known );
} );

it( 'keeps a repeated call until every copy is gone', () => {
  const call = 'src/a.js: console.log( stdout, stderr );';
  expect( missingLines( [call], [call, call] ) ).toEqual( [call] );
  expect( missingLines( [call, call], [call, call] ) ).toEqual( [] );
} );
