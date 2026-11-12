// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { parseAlignment } from './parseAlignment';

function tools( parse, extra = {} ) {
  return {
    readFormat: async () => 'fasta',
    convert: async () => {
      throw new Error( 'convert should not run' );
    },
    parse,
    write: async () => {
      throw new Error( 'write should not run' );
    },
    ...extra,
  };
}

it( 'parseAlignment resolves the alignment and no change when the file stays as it is', async () => {
  const alignment = {
    sequences: [ { taxon: 'Homo', code: 'ACGT' } ],
    fileFormat: 'fasta',
    numSequences: 1,
    length: 4,
    dataType: 'dna',
  };
  let parsedPath;
  const parsed = await parseAlignment( 'align-1', '/data/primates.fasta', tools( async ( filePath ) => {
    parsedPath = filePath;
    return alignment;
  } ) );

  expect( parsedPath ).toBe( '/data/primates.fasta' );
  expect( parsed ).toEqual( { alignment, change: null } );
} );

it( 'parseAlignment reports the converted file when the format is not fasta or phylip', async () => {
  const alignment = {
    sequences: [ { taxon: 'Homo', code: 'ACGT' } ],
    fileFormat: 'fasta',
  };
  let parsedPath;
  const parsed = await parseAlignment( 'align-1', '/data/primates.nex', {
    readFormat: async () => 'nexus',
    convert: async () => '/data/primates.fas',
    parse: async ( filePath ) => {
      parsedPath = filePath;
      return alignment;
    },
    write: async () => {
      throw new Error( 'write should not run' );
    },
  } );

  expect( parsedPath ).toBe( '/data/primates.fas' );
  expect( parsed ).toEqual( {
    alignment,
    change: {
      newFilePath: '/data/primates.fas',
      format: 'nexus',
      converted: true,
      modified: undefined,
      modificationMessages: [],
    },
  } );
} );

it( 'parseAlignment reports the written file when it renames a taxon', async () => {
  const alignment = {
    sequences: [ { taxon: 'A B', code: 'AAAA' } ],
    fileFormat: 'fasta',
  };
  let written;
  const parsed = await parseAlignment( 'align-1', '/data/primates.fasta', tools( async () => alignment, {
    write: async ( filePath, writtenAlignment ) => {
      written = { filePath, taxon: writtenAlignment.sequences[0].taxon };
    },
  } ) );

  expect( written ).toEqual( {
    filePath: '/data/primates_modified.fasta',
    taxon: 'A_B',
  } );
  expect( parsed.change ).toEqual( {
    newFilePath: '/data/primates_modified.fasta',
    format: 'fasta',
    converted: undefined,
    modified: true,
    modificationMessages: [
      'Illegal characters in sequence name = taxon \'A B\' found.',
    ],
  } );
} );

it( 'parseAlignment numbers a repeated taxon name', async () => {
  const alignment = {
    sequences: [
      { taxon: 'Homo', code: 'AAAA' },
      { taxon: 'Homo', code: 'CCCC' },
    ],
  };
  const parsed = await parseAlignment( 'align-1', '/data/primates.fasta', tools( async () => alignment, {
    write: async () => {},
  } ) );

  expect( alignment.sequences.map( ( sequence ) => sequence.taxon ) ).toEqual( [
    'Homo',
    'Homo_1',
  ] );
  expect( parsed.change.modificationMessages ).toEqual( [
    'Identical sequence names: 1 and 2 = Homo',
  ] );
} );

it( 'parseAlignment shortens a taxon name past 256 characters', async () => {
  const taxon = 'A'.repeat( 257 );
  const alignment = {
    sequences: [ { taxon, code: 'AAAA' } ],
  };
  const parsed = await parseAlignment( 'align-1', '/data/primates.fasta', tools( async () => alignment, {
    write: async () => {},
  } ) );

  expect( alignment.sequences[0].taxon ).toBe( 'A'.repeat( 253 ) );
  expect( parsed.change.modificationMessages ).toEqual( [
    `Taxon name is too long: '${taxon}'.`,
  ] );
} );

it( 'parseAlignment rejects when the file cannot be parsed', async () => {
  await expect( parseAlignment( 'align-1', '/data/notes.txt', tools( async () => {
    throw new Error( 'unrecognized format' );
  } ) ) ).rejects.toThrow( 'unrecognized format' );
} );

it( 'parseAlignment still parses when the format check fails', async () => {
  const alignment = { sequences: [ { taxon: 'Homo', code: 'ACGT' } ] };
  const parsed = await parseAlignment( 'align-1', '/data/primates.fasta', tools( async () => alignment, {
    readFormat: async () => {
      throw new Error( 'readal missing' );
    },
  } ) );

  expect( parsed ).toEqual( { alignment, change: null } );
} );
