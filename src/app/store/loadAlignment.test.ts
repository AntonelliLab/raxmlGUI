import { expect, it, vi } from 'vitest';
import type { AlignmentParseResult } from '../../main/parseAlignment';
import { installBridge } from '../../test/setup';

import Run from './Run';

const stayParsed = async (): Promise<AlignmentParseResult> => ( {
  alignment: {
    sequences: [],
    fileFormat: 'fasta',
    numSequences: 0,
    length: 0,
    dataType: 'nucleotide',
    hasInvariantSites: false,
    typecheckingComplete: true,
  },
  change: null,
} );


it( 'the alignment picker adds the chosen alignments', async () => {
  const run = new Run( {} as Run['parent'], 7 );
  const selectAlignment = vi.fn( async () => [
    { path: '/data/primates.fasta', name: 'primates.fasta' },
    { path: '/data/cats.phy', name: 'cats.phy' },
  ] );
  installBridge( { selectAlignment, parseAlignment: stayParsed } );

  await run.loadAlignmentFiles();

  expect( selectAlignment ).toHaveBeenCalledWith( 7 );
  expect( run.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/data/primates.fasta',
    '/data/cats.phy',
  ] );
} );

it( 'cancel leaves the alignments unchanged', async () => {
  const run = new Run( {} as Run['parent'], 7 );
  installBridge( { parseAlignment: stayParsed } );
  run.addAlignments( [{ path: '/data/already.fasta' }] );
  installBridge( {
    parseAlignment: stayParsed,
    selectAlignment: vi.fn( async () => null ),
  } );

  await run.loadAlignmentFiles();

  expect( window.rendererBridge.selectAlignment ).toHaveBeenCalledWith( 7 );
  expect( run.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/data/already.fasta',
  ] );
} );

it( 'a dialog failure fails the alignment choice', async () => {
  const run = new Run( {} as Run['parent'], 7 );
  installBridge( { parseAlignment: stayParsed } );
  run.addAlignments( [{ path: '/data/already.fasta' }] );
  installBridge( {
    parseAlignment: stayParsed,
    selectAlignment: async () => {
      throw new Error( 'dialog failed' );
    },
  } );

  await expect( run.loadAlignmentFiles() ).rejects.toThrow( 'dialog failed' );
  expect( run.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/data/already.fasta',
  ] );
} );
