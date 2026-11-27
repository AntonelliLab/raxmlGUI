import { expect, it } from 'vitest';
import typecheckAlignment from './typecheckAlignment';

const alignment = ( ...codes: string[] ) => ( {
  sequences: codes.map( ( code, i ) => ( { taxon: `t${i}`, code } ) ),
  length: codes[0].length,
  numSequences: codes.length,
  fileFormat: 'FASTA',
} );

it( 'typecheckAlignment sets the data type, invariant sites and completion', () => {
  expect( typecheckAlignment( alignment( 'ACGT', 'ACGA' ) ) ).toMatchObject( {
    dataType: 'nucleotide',
    hasInvariantSites: true,
    typecheckingComplete: true,
  } );
} );

it( 'typecheckAlignment throws when no sequence has a data type', () => {
  expect( () => typecheckAlignment( alignment( 'TT-T', '----' ) ) ).toThrow(
    'cannot determine data type of any of the 2 sequences',
  );
} );
