import { expect, it } from 'vitest';

import { astralArgs } from './astral';

it( 'astralArgs quotes paths on Windows', () => {
  const run = { astralTree: { path: 'C:\\in\\genes.tre' }, outputDir: 'C:\\out', outputNameSafe: 'run1' };
  expect( astralArgs( run, { windows: true } ) ).toEqual( [
    ['-i', '"C:\\in\\genes.tre"', '-o', '"C:\\out\\ASTRAL_run1.tre"'],
  ] );
} );

it( 'astralArgs leaves paths bare off Windows', () => {
  const run = { astralTree: { path: '/in/genes.tre' }, outputDir: '/out', outputNameSafe: 'run1' };
  expect( astralArgs( run, { windows: false } ) ).toEqual( [
    ['-i', '/in/genes.tre', '-o', '/out/ASTRAL_run1.tre'],
  ] );
} );
