// @ts-nocheck — Jest globals. checkJs has no test runner types.
const { freshLines } = require( '../scripts/typecheck-baseline' );

it( 'reports a diagnostic line that the baseline does not list', () => {
  const known = ['src/a.js(1,1): error TS1: known'];
  expect( freshLines( known, known ) ).toEqual( [] );
  expect( freshLines( [
    'src/a.js(1,1): error TS1: known',
    'src/b.js(2,1): error TS2: new',
  ], known ) ).toEqual( ['src/b.js(2,1): error TS2: new'] );
} );

it( 'treats the same diagnostic at another line as known', () => {
  const known = ['src/a.js(1,1): error TS1: known'];
  expect( freshLines( ['src/a.js(9,4): error TS1: known'], known ) ).toEqual( [] );
} );
