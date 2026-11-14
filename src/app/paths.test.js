// @ts-nocheck — Jest globals. checkJs has no test runner types.
import {
  base, basename, dir, join, name, quote,
} from './paths';
import InputFile from './store/InputFile';

it( 'joins, names, and quotes a path', () => {
  expect( join( '/data', 'primates.fasta' ) ).toBe( '/data/primates.fasta' );
  expect( join( '/examples', 'fasta', 'nucleotide.txt' ) ).toBe( '/examples/fasta/nucleotide.txt' );
  expect( join( '/data/', 'out.tre' ) ).toBe( '/data/out.tre' );
  expect( join( 'C:\\data', 'out.tre' ) ).toBe( 'C:\\data\\out.tre' );
  expect( join( '\\\\server\\share', 'out.tre' ) ).toBe( '\\\\server\\share\\out.tre' );

  expect( name( '/data/primates.aln.fasta' ) ).toBe( 'primates.aln' );
  expect( base( '/data/primates.fasta' ) ).toBe( 'primates.fasta' );
  expect( basename( '/data/primates.fasta' ) ).toBe( 'primates.fasta' );
  expect( dir( '/data/primates.fasta' ) ).toBe( '/data' );
  expect( dir( '/primates.fasta' ) ).toBe( '/' );
  expect( dir( 'primates.fasta' ) ).toBe( '' );
  expect( name( 'C:\\data\\primates.fasta' ) ).toBe( 'primates' );
  expect( dir( 'C:\\data\\primates.fasta' ) ).toBe( 'C:\\data' );
  expect( dir( 'C:\\primates.fasta' ) ).toBe( 'C:\\' );
  expect( dir( '\\\\server\\share\\primates.fasta' ) ).toBe( '\\\\server\\share\\' );
  expect( join( 'C:\\', 'out.tre' ) ).toBe( 'C:\\out.tre' );

  expect( quote( '/data', { windows: false } ) ).toBe( '/data' );
  expect( quote( 'C:\\My Data', { windows: true } ) ).toBe( '"C:\\My Data"' );
} );

it( 'an input file reports the plain name, base, and directory', () => {
  const file = new InputFile( { id: 7 }, '/data/primates.fasta' );
  expect( file.name ).toBe( 'primates' );
  expect( file.base ).toBe( 'primates.fasta' );
  expect( file.filename ).toBe( 'primates.fasta' );
  expect( file.dir ).toBe( '/data' );
} );
