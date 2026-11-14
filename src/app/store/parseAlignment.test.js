// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

const alignment = {
  sequences: [
    { taxon: 'Homo', code: 'ACGT' },
    { taxon: 'Mus', code: 'ACGA' },
  ],
  fileFormat: 'fasta',
  numSequences: 2,
  length: 4,
  dataType: 'dna',
  hasInvariantSites: true,
  typecheckingComplete: true,
};

function add( parseAlignment ) {
  const run = new Run( {}, 7 );
  let pending;
  window.rendererBridge = {
    parseAlignment: ( ...args ) => {
      pending = parseAlignment( ...args );
      return pending;
    },
  };
  run.addAlignments( [ { path: '/data/primates.fasta' } ] );
  return { run, pending };
}

it( 'the alignment load keeps the path when parsing changes nothing', async () => {
  const parseAlignment = jest.fn( async () => ( { alignment, change: null } ) );
  const { run, pending } = add( parseAlignment );
  await pending;

  expect( parseAlignment ).toHaveBeenCalledWith(
    '7_/data/primates.fasta',
    '/data/primates.fasta',
  );
  const loaded = run.alignments[0];
  expect( loaded.path ).toBe( '/data/primates.fasta' );
  expect( loaded.sequences ).toEqual( alignment.sequences );
  expect( loaded.fileFormat ).toBe( 'fasta' );
  expect( loaded.numSequences ).toBe( 2 );
  expect( loaded.length ).toBe( 4 );
  expect( loaded.dataType ).toBe( 'dna' );
  expect( loaded.hasInvariantSites ).toBe( true );
  expect( loaded.typecheckingComplete ).toBe( true );
  expect( loaded.parsingComplete ).toBe( true );
  expect( loaded.loading ).toBe( false );
  expect( loaded.showModifiedDialog ).toBe( false );
  expect( loaded.showModifiedSnack ).toBe( false );
} );

it( 'the alignment load shows a modification', async () => {
  const { run, pending } = add( async () => ( {
    alignment,
    change: {
      newFilePath: '/data/primates_modified.fas',
      format: 'nexus',
      converted: true,
      modified: true,
      modificationMessages: [
        'Illegal characters in sequence name = taxon \'A B\' found.',
      ],
    },
  } ) );
  await pending;

  const loaded = run.alignments[0];
  expect( loaded.path ).toBe( '/data/primates_modified.fas' );
  expect( loaded.convertedFrom ).toBe( 'nexus' );
  expect( loaded.converted ).toBe( true );
  expect( loaded.modified ).toBe( true );
  expect( loaded.showModifiedDialog ).toBe( true );
  expect( loaded.modificationMessages ).toEqual( [
    'Illegal characters in sequence name = taxon \'A B\' found.',
  ] );
} );

it( 'the alignment load shows a conversion with no messages', async () => {
  const { run, pending } = add( async () => ( {
    alignment,
    change: {
      newFilePath: '/data/primates.fas',
      format: 'nexus',
      converted: true,
      modified: undefined,
      modificationMessages: [],
    },
  } ) );
  await pending;

  const loaded = run.alignments[0];
  expect( loaded.path ).toBe( '/data/primates.fas' );
  expect( loaded.showModifiedSnack ).toBe( true );
  expect( loaded.showModifiedDialog ).toBe( false );
} );

it( 'a failed parse removes the alignment', async () => {
  const { run, pending } = add( async () => {
    throw new Error( 'unrecognized format' );
  } );
  await pending.catch( () => {} );

  expect( run.alignments ).toEqual( [] );
  expect( run.error.message ).toBe( 'unrecognized format' );
} );
