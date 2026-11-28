import { expect, it } from 'vitest';

import { raxmlArgs } from './raxml';

const base = {
  analysis: { value: 'PD' },
  outputNameSafe: 'run1',
  outputFilenameSafe: 'run1.tre',
  raxmlSubstitutionModelCmd: 'GTRGAMMA',
  numThreads: { notAvailable: false, value: 2 },
  seedParsimony: 123,
  seedRapidBootstrap: 456,
  seedBootstrap: 789,
  // Empty extra values are dropped from the command
  substitutionMatrix: { extraCmdValue: '' },
  substitutionAscertainment: { extraCmdValue: '' },
  multistateModel: { notAvailable: true, value: '' },
  disableCheckUndeterminedSequence: true,
  outGroup: { cmdValue: '' },
  branchLength: { value: false },
  sHlike: { value: false },
  numRuns: { value: 1 },
  numRepetitions: { value: 100 },
  backboneConstraint: { isSet: false, filePath: '' },
  multifurcatingConstraint: { isSet: false, filePath: '' },
};

it( 'raxmlArgs quotes paths on Windows', () => {
  const run = {
    ...base,
    havePartitionFile: true,
    partitionFile: 'C:\\in\\my.part',
    finalAlignment: {
      path: 'C:\\in\\aln.phy',
      partitionFilePath: 'C:\\in\\aln.part',
      partition: { isDefault: true },
    },
    outputDir: 'C:\\out',
    tree: { notAvailable: false, filePath: 'C:\\in\\start.tre' },
  };
  expect( raxmlArgs( run, { windows: true } ) ).toEqual( [[
    '-T',
    2,
    '-f',
    'x',
    '-p',
    123,
    '-m',
    'GTRGAMMA',
    '-O',
    '-t',
    '"C:\\in\\start.tre"',
    '-n',
    'run1.tre',
    '-s',
    '"C:\\in\\aln.phy"',
    '-w',
    '"C:\\out"',
    '-q',
    '"C:\\in\\my.part"',
  ]] );
} );

it( 'raxmlArgs leaves paths bare off Windows', () => {
  const run = {
    ...base,
    havePartitionFile: false,
    partitionFile: '',
    finalAlignment: {
      path: '/in/aln.phy',
      partitionFilePath: '/in/aln.part',
      partition: { isDefault: false },
    },
    outputDir: '/out',
    tree: { notAvailable: true, filePath: '' },
  };
  expect( raxmlArgs( run, { windows: false } ) ).toEqual( [[
    '-T',
    2,
    '-f',
    'x',
    '-p',
    123,
    '-m',
    'GTRGAMMA',
    '-O',
    '-n',
    'run1.tre',
    '-s',
    '/in/aln.phy',
    '-w',
    '/out',
    '-q',
    '/in/aln.part',
  ]] );
} );
