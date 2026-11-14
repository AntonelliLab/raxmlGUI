// @ts-nocheck — Jest globals. checkJs has no test runner types.
const { freshLines, unusedLines } = require( '../scripts/typecheck-baseline' );

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

it( 'reports a src/ baseline line whose diagnostic is gone', () => {
  const known = [
    'src/a.js(1,1): error TS1: known',
    'src/gone.js(2,1): error TS2: gone',
    '  Overload 1 of 4, leftover continuation',
  ];
  expect( unusedLines( known, ['src/a.js(9,4): error TS1: known'] ) ).toEqual( [
    'src/gone.js(2,1): error TS2: gone',
    '  Overload 1 of 4, leftover continuation',
  ] );
} );

it( 'does not let one file\'s continuation shelter another file\'s', () => {
  const known = [
    'src/a.js(1,1): error TS1: known',
    '  Overload 1 of 4, same text',
  ];
  const actual = [
    'src/b.js(2,1): error TS1: known',
    '  Overload 1 of 4, same text',
  ];
  expect( freshLines( actual, known ) ).toEqual( actual );
} );
