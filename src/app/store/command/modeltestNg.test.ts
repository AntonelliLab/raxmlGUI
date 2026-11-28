import { expect, it } from 'vitest';

import { modeltestNgArgs } from './modeltestNg';

it( 'modeltestNgArgs quotes paths on Windows', () => {
  const run = {
    dataType: 'protein',
    finalAlignment: { path: 'C:\\in\\aln.phy' },
    outputDir: 'C:\\out',
    outputNameSafe: 'run1',
    numThreads: { value: 4 },
  };
  expect( modeltestNgArgs( run, { windows: true } ) ).toEqual( [
    ['-d', 'aa', '-i', '"C:\\in\\aln.phy"', '-o', '"C:\\out\\RAxML_GUI_ModelTest_run1"', '--force', '-p', 4],
  ] );
} );

it( 'modeltestNgArgs leaves paths bare off Windows', () => {
  const run = {
    dataType: 'nucleotide',
    finalAlignment: { path: '/in/aln.phy' },
    outputDir: '/out',
    outputNameSafe: 'run1',
    numThreads: { value: 2 },
  };
  expect( modeltestNgArgs( run, { windows: false } ) ).toEqual( [
    ['-d', 'nt', '-i', '/in/aln.phy', '-o', '/out/RAxML_GUI_ModelTest_run1', '--force', '-p', 2],
  ] );
} );
