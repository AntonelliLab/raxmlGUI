// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

const stayParsed = async () => ( {
  alignment: {
    sequences: [],
    fileFormat: 'fasta',
    numSequences: 0,
    length: 0,
    dataType: 'dna',
    hasInvariantSites: false,
    typecheckingComplete: true,
  },
  change: null,
} );


it( 'the alignment picker adds the chosen alignments', async () => {
  const run = new Run( {}, 7 );
  const selectAlignment = jest.fn( async () => [
    { path: '/data/primates.fasta', name: 'primates.fasta' },
    { path: '/data/cats.phy', name: 'cats.phy' },
  ] );
  window.rendererBridge = { selectAlignment, parseAlignment: stayParsed };

  await run.loadAlignmentFiles();

  expect( selectAlignment ).toHaveBeenCalledWith( 7 );
  expect( run.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/data/primates.fasta',
    '/data/cats.phy',
  ] );
} );

it( 'cancel leaves the alignments unchanged', async () => {
  const run = new Run( {}, 7 );
  window.rendererBridge = { parseAlignment: stayParsed };
  run.addAlignments( [{ path: '/data/already.fasta', name: 'already.fasta' }] );
  window.rendererBridge = {
    parseAlignment: stayParsed,
    selectAlignment: jest.fn( async () => null ),
  };

  await run.loadAlignmentFiles();

  expect( window.rendererBridge.selectAlignment ).toHaveBeenCalledWith( 7 );
  expect( run.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/data/already.fasta',
  ] );
} );

it( 'a dialog failure fails the alignment choice', async () => {
  const run = new Run( {}, 7 );
  window.rendererBridge = { parseAlignment: stayParsed };
  run.addAlignments( [{ path: '/data/already.fasta', name: 'already.fasta' }] );
  window.rendererBridge = {
    parseAlignment: stayParsed,
    selectAlignment: async () => {
      throw new Error( 'dialog failed' );
    },
  };

  await expect( run.loadAlignmentFiles() ).rejects.toThrow( 'dialog failed' );
  expect( run.alignments.map( ( alignment ) => alignment.path ) ).toEqual( [
    '/data/already.fasta',
  ] );
} );
