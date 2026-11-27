import { expect, it } from 'vitest';

import { raxmlNgArgs } from './raxmlNg';

const base = {
  analysis: { value: 'SC' },
  havePartitionFile: false,
  partitionFile: '',
  ngSubstitutionModelCmd: 'GTR+G',
  numThreads: { notAvailable: false, value: 2 },
  seedParsimony: 123,
  outGroup: { cmdValue: '' },
  numRuns: { value: 1 },
  numRepetitionsNg: { value: 100 },
  alignments: { length: 1 },
  tree: { filePath: '' },
  multifurcatingConstraint: { isSet: false, filePath: '' },
};

it( 'raxmlNgArgs quotes paths on Windows', () => {
  const run = {
    ...base,
    finalAlignment: {
      path: 'C:\\in\\aln.phy',
      partitionFilePath: 'C:\\in\\aln.part',
      partition: { isDefault: true },
    },
    outputDir: 'C:\\out',
    outputNameSafe: 'run1',
    backboneConstraint: { isSet: true, filePath: 'C:\\in\\backbone.tre' },
  };
  expect( raxmlNgArgs( run, { windows: true } ) ).toEqual( [[
    '--check',
    '--model',
    'GTR+G',
    '--prefix',
    '"C:\\out\\run1"',
    '--msa',
    '"C:\\in\\aln.phy"',
    '--tree-constraint',
    '"C:\\in\\backbone.tre"',
  ]] );
} );

it( 'raxmlNgArgs leaves paths bare off Windows', () => {
  const run = {
    ...base,
    finalAlignment: {
      path: '/in/aln.phy',
      partitionFilePath: '/in/aln.part',
      partition: { isDefault: false },
    },
    outputDir: '/out',
    outputNameSafe: 'run1',
    backboneConstraint: { isSet: false, filePath: '' },
  };
  expect( raxmlNgArgs( run, { windows: false } ) ).toEqual( [
    ['--check', '--model', '/in/aln.part', '--prefix', '/out/run1', '--msa', '/in/aln.phy'],
  ] );
} );
