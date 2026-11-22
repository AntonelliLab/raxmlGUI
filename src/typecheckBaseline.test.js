// @ts-nocheck — the test is not typed yet.
import { expect, it } from 'vitest';

const { freshLines, unusedLines, typeScriptLines } = require( '../scripts/typecheck-baseline' );

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

it( 'keeps the noImplicitAny diagnostics of .ts and .tsx files and their continuations', () => {
  expect( typeScriptLines( [
    'src/a.js(1,1): error TS7006: Parameter implicitly has an any type.',
    '  js continuation',
    'src/b.ts(2,1): error TS7016: Could not find a declaration file.',
    '  ts continuation',
    'src/c.tsx(3,1): error TS7006: Parameter implicitly has an any type.',
  ] ) ).toEqual( [
    'src/b.ts(2,1): error TS7016: Could not find a declaration file.',
    '  ts continuation',
    'src/c.tsx(3,1): error TS7006: Parameter implicitly has an any type.',
  ] );
  expect( typeScriptLines( ['src/a.js(1,1): error TS7006: x'] ) ).toEqual( [] );
} );

it( 'passes on an empty baseline when tsc reports nothing', () => {
  expect( freshLines( [], [] ) ).toEqual( [] );
  expect( unusedLines( [], [] ) ).toEqual( [] );
} );

it( 'exits non-zero when a .ts file has an implicit any, even if the first pass is clean', () => {
  const fs = require( 'fs' );
  const path = require( 'path' );
  const { spawnSync } = require( 'child_process' );
  const file = path.join( __dirname, 'implicitAnyProbe.ts' );
  fs.writeFileSync( file, 'export function probe( x ) { return x; }\n' );
  try {
    const result = spawnSync( process.execPath, [
      path.join( __dirname, '..', 'scripts', 'typecheck-baseline.js' ),
    ], { encoding: 'utf8' } );
    expect( result.status ).toBe( 1 );
    expect( result.stderr ).toContain( 'src/implicitAnyProbe.ts' );
  } finally {
    fs.unlinkSync( file );
  }
}, 60000 );
