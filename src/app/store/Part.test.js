// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Alignment from './Alignment';
import Run from './Run';
import {
  CODON_NONE,
  CODON_SPECIFIC,
  CODON_THIRD,
  CodonModels,
} from './PartOptions';

// The alignment subscribes to bridge events and parses its file on creation.
beforeEach( () => {
  window.rendererBridge = {
    parseAlignment: () => new Promise( () => {} ),
    onModelSelectionSuccess: () => () => {},
    onModelSelectionFailure: () => () => {},
    onRunStdout: () => () => {},
    onRunStderr: () => () => {},
  };
} );

// The run defaults to raxml-ng, whose partition type is the model command; classic raxml uses the data type.
function makeAlignment( { dataType = 'dna', length = 100, ng = false } = {} ) {
  const run = new Run( {}, 1 );
  const alignment = new Alignment( run, '/data/a.fasta' );
  runInAction( () => {
    if ( !ng ) {
      run.binary.value = run.binary.options
        .map( ( o ) => o.value )
        .find( ( v ) => /raxml/i.test( v ) && !v.includes( 'raxml-ng' ) );
    }
    alignment.dataType = dataType;
    alignment.length = length;
  } );
  return alignment;
}

// Records every value an autorun sees, so a test can prove it re-ran.
function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

const part = ( alignment, values ) => {
  const { partition } = alignment;
  runInAction( () => {
    Object.entries( values ).forEach( ( [key, value] ) => {
      partition.partToAdd[key].value = value;
    } );
  } );
  return partition.partToAdd;
};

describe( 'Part', () => {
  it( 'starts from the alignment: default part covers all sites', () => {
    const { partition } = makeAlignment();
    expect( partition.defaultPartition.values ).toEqual( {
      type: 'DNA',
      aaType: 'BLOSUM62',
      name: 'part_1',
      start: 1,
      end: 100,
      codon: CODON_NONE,
    } );
    expect( partition.partToAdd.end.value ).toBe( 1 );
  } );

  it( 'typePadded pads the final type to twelve characters', () => {
    const alignment = makeAlignment();
    const { typePadded } = alignment.partition.partToAdd;
    expect( typePadded ).toBe( 'DNA,        ' );
    expect( typePadded ).toHaveLength( 12 );
  } );

  it( 'a reaction sees typePadded change with the alignment data type', () => {
    const alignment = makeAlignment();
    const { seen, stop } = track( () => alignment.partition.partToAdd.typePadded );
    runInAction( () => {
      alignment.dataType = 'binary';
    } );
    expect( seen ).toEqual( ['DNA,        ', 'BIN,        '] );
    stop();
  } );

  it( 'typePadded uses the model command under raxml-ng', () => {
    const alignment = makeAlignment( { ng: true } );
    const { seen, stop } = track( () => alignment.partition.partToAdd.typePadded );
    runInAction( () => {
      alignment.ngInvariantSites.value = true;
    } );
    expect( seen[0] ).toBe( ',           ' );
    expect( seen ).toHaveLength( 2 );
    expect( seen[1] ).toBe( `${alignment.ngSubstitutionModelCmd},`.padEnd( 12 ) );
    stop();
  } );

  it( 'transform without codons writes one row', () => {
    const p = part( makeAlignment(), { name: 'g', start: 3, end: 9 } );
    expect( p.transform() ).toBe( 'DNA,        g = 3-9' );
    expect( p.transform( 10, 'x_' ) ).toBe( 'DNA,        x_g = 13-19' );
  } );

  it( 'transform with codon specific writes three rows', () => {
    const p = part( makeAlignment(), {
      name: 'g',
      start: 1,
      end: 9,
      codon: CODON_SPECIFIC,
    } );
    expect( p.transform() ).toBe(
      [
        'DNA,        g_codon1 = 1-9\\3',
        'DNA,        g_codon2 = 2-9\\3',
        'DNA,        g_codon3 = 3-9\\3',
      ].join( '\n' ),
    );
    expect( p.transform( 100, 'p_' ).split( '\n' )[1] ).toBe(
      'DNA,        p_g_codon2 = 102-109\\3',
    );
  } );

  it( 'transform with third codon writes the first two codons and the third', () => {
    const p = part( makeAlignment(), {
      name: 'g',
      start: 1,
      end: 9,
      codon: CODON_THIRD,
    } );
    expect( p.transform() ).toBe(
      [
        'DNA,        g_codon1and2 = 1-9\\3, 2-9\\3',
        'DNA,        g_codon3 = 3-9\\3',
      ].join( '\n' ),
    );
  } );

  it( 'transform throws on an unknown codon model', () => {
    const p = part( makeAlignment(), { codon: 'Bogus' } );
    expect( () => p.transform() ).toThrow( 'Codon type Bogus not recognized.' );
  } );

  it( 'text is the transform and a reaction sees it change', () => {
    const alignment = makeAlignment();
    const p = alignment.partition.partToAdd;
    const { seen, stop } = track( () => p.text );
    expect( p.text ).toBe( p.transform() );
    runInAction( () => {
      p.name.value = 'other';
    } );
    expect( seen ).toEqual( ['DNA,        part_1 = 1-1', 'DNA,        other = 1-1'] );
    stop();
  } );

  it( 'parse accepts a row and returns nothing', () => {
    const p = makeAlignment().partition.partToAdd;
    expect( p.parse( 'DNA, g = 1-9' ) ).toBeUndefined();
  } );

  it( 'values collects every option value and tracks changes', () => {
    const p = makeAlignment().partition.partToAdd;
    const { seen, stop } = track( () => p.values.start );
    runInAction( () => {
      p.start.value = 4;
    } );
    expect( seen ).toEqual( [1, 4] );
    expect( p.values ).toEqual( {
      type: 'DNA',
      aaType: 'BLOSUM62',
      name: 'part_1',
      start: 4,
      end: 1,
      codon: CODON_NONE,
    } );
    stop();
  } );

  it( 'clone copies the values into an independent part', () => {
    const p = part( makeAlignment(), { name: 'g', start: 2, end: 8 } );
    const copy = p.clone();
    expect( copy ).not.toBe( p );
    expect( copy.values ).toEqual( p.values );
    expect( copy.partition ).toBe( p.partition );
    runInAction( () => {
      p.name.value = 'changed';
    } );
    expect( copy.name.value ).toBe( 'g' );
  } );
} );

describe( 'part options', () => {
  it( 'PartType.finalValue follows the alignment partition type', () => {
    const alignment = makeAlignment();
    const { type } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => type.finalValue );
    runInAction( () => {
      alignment.dataType = 'multistate';
    } );
    expect( seen ).toEqual( ['DNA', 'MULTI'] );
    stop();
  } );

  it( 'PartType.finalValue is the amino acid model for protein', () => {
    const alignment = makeAlignment( { dataType: 'protein' } );
    const { type, aaType } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => type.finalValue );
    runInAction( () => {
      aaType.value = 'WAG';
    } );
    expect( seen ).toEqual( ['BLOSUM62', 'WAG'] );
    stop();
  } );

  it( 'PartType.finalValue is the own value for a mixed alignment', () => {
    const alignment = makeAlignment( { dataType: 'mixed' } );
    const { type } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => type.finalValue );
    runInAction( () => {
      type.value = 'BIN';
    } );
    expect( seen ).toEqual( [expect.anything(), 'BIN'] );
    expect( type.finalValue ).toBe( 'BIN' );
    stop();
  } );

  it( 'PartType.finalValue is the amino acid model when the part itself is protein', () => {
    const alignment = makeAlignment( { dataType: 'mixed' } );
    const { type } = alignment.partition.partToAdd;
    runInAction( () => {
      type.value = 'protein';
    } );
    expect( type.finalValue ).toBe( 'BLOSUM62' );
  } );

  it( 'PartType.options and notAvailable follow the alignment data type', () => {
    const alignment = makeAlignment();
    const { type } = alignment.partition.partToAdd;
    const seen = track( () => [type.options.map( ( o ) => o.value ), type.notAvailable] );
    expect( seen.seen[0] ).toEqual( [['dna'], true] );
    runInAction( () => {
      alignment.dataType = 'mixed';
    } );
    expect( seen.seen[1] ).toEqual( [['DNA', 'BIN', 'MULTI', 'protein'], false] );
    runInAction( () => {
      alignment.dataType = '';
    } );
    expect( type.options.map( ( o ) => o.title ) ).toEqual( [
      'DNA',
      'BIN',
      'MULTI',
      'protein',
    ] );
    expect( type.notAvailable ).toBe( true );
    seen.stop();
  } );

  it( 'PartType accepts only strings', () => {
    const { type } = makeAlignment().partition.partToAdd;
    type.setValue( 5 );
    expect( type.value ).toBe( '5' );
    type.setValue( {} );
    expect( type.value ).toBe( '5' );
  } );

  it( 'PartAAType offers the amino acid matrices and is available for protein only', () => {
    const alignment = makeAlignment();
    const { aaType } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => aaType.notAvailable );
    expect( aaType.options.length ).toBeGreaterThan( 1 );
    expect( aaType.options[0] ).toEqual( {
      value: aaType.options[0].title,
      title: aaType.options[0].value,
    } );
    expect( aaType.options.map( ( o ) => o.value ) ).toContain( 'WAG' );
    runInAction( () => {
      alignment.dataType = 'protein';
    } );
    expect( seen ).toEqual( [true, false] );
    stop();
  } );

  it( 'PartName is always available and keeps its value as a string', () => {
    const { name } = makeAlignment().partition.partToAdd;
    expect( name.notAvailable ).toBe( false );
    name.setValue( 'gene' );
    expect( name.value ).toBe( 'gene' );
  } );

  it( 'PartStart is always available, disabled and stores invalid input as given', () => {
    const { start } = makeAlignment().partition.partToAdd;
    expect( start.notAvailable ).toBe( false );
    expect( start.disabled ).toBe( true );
    start.setValue( '7' );
    expect( start.value ).toBe( 7 );
    start.setValue( 'abc' );
    expect( start.value ).toBe( 'abc' );
  } );

  it( 'PartEnd.min follows the start and the codon model', () => {
    const alignment = makeAlignment();
    const { start, end, codon } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => end.min );
    runInAction( () => {
      start.value = 5;
    } );
    runInAction( () => {
      codon.value = CODON_SPECIFIC;
    } );
    expect( seen ).toEqual( [1, 5, 7] );
    stop();
  } );

  it( 'PartEnd.max follows the alignment length', () => {
    const alignment = makeAlignment();
    const { end } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => end.max );
    runInAction( () => {
      alignment.length = 250;
    } );
    expect( seen ).toEqual( [100, 250] );
    expect( end.notAvailable ).toBe( false );
    stop();
  } );

  it( 'PartEnd reports an error outside [min, max] and a reaction sees it', () => {
    const alignment = makeAlignment();
    const { end } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => end.haveError );
    end.setValue( 50 );
    expect( end.haveError ).toBe( false );
    expect( end.errorMessage ).toBe( '' );
    end.setValue( 101 );
    expect( end.haveError ).toBe( true );
    expect( end.errorMessage ).toBe( 'Must be in interval [1, 100]' );
    runInAction( () => {
      alignment.length = 200;
    } );
    expect( end.haveError ).toBe( false );
    expect( seen ).toEqual( [false, true, false] );
    stop();
  } );

  it( 'PartCodon offers the codon models and is available for a DNA part to add only', () => {
    const alignment = makeAlignment();
    const { codon, type } = alignment.partition.partToAdd;
    const { seen, stop } = track( () => codon.notAvailable );
    expect( codon.options.map( ( o ) => o.value ) ).toEqual( CodonModels );
    expect( seen ).toEqual( [false] );
    runInAction( () => {
      type.value = 'BIN';
    } );
    expect( seen ).toEqual( [false, true] );
    stop();
  } );
} );

describe( 'Partition', () => {
  const add = ( partition, values ) => {
    runInAction( () => {
      Object.entries( values ).forEach( ( [key, value] ) => {
        partition.partToAdd[key].value = value;
      } );
    } );
    partition.addPart();
  };

  it( 'is the default partition until a part is added', () => {
    const alignment = makeAlignment();
    const { partition } = alignment;
    expect( partition.isDefault ).toBe( true );
    expect( partition.isMixed ).toBe( false );
    expect( partition.maxEndValue ).toBe( 100 );
    expect( partition.currentEndValue ).toBe( 100 );
    expect( partition.isComplete ).toBe( true );
    expect( partition.nonDefaultPartitionComplete ).toBe( false );
    expect( partition.progress ).toBe( 100 );
    expect( partition.text ).toBe( 'DNA,        part_1 = 1-100' );
    expect( partition.transform( 5, 'x_' ) ).toBe( 'DNA,        x_part_1 = 6-105' );
  } );

  it( 'isMixed follows the alignment data type', () => {
    const alignment = makeAlignment();
    const { seen, stop } = track( () => alignment.partition.isMixed );
    runInAction( () => {
      alignment.dataType = 'mixed';
    } );
    expect( seen ).toEqual( [false, true] );
    stop();
  } );

  it( 'addPart appends a copy and moves partToAdd past it', () => {
    const { partition } = makeAlignment();
    const { seen, stop } = track( () => [partition.isDefault, partition.currentEndValue] );
    add( partition, { end: 40, codon: CODON_SPECIFIC } );
    expect( partition.parts ).toHaveLength( 1 );
    expect( partition.parts[0].values ).toMatchObject( {
      name: 'part_1',
      start: 1,
      end: 40,
      codon: CODON_SPECIFIC,
    } );
    expect( partition.isDefault ).toBe( false );
    expect( partition.currentEndValue ).toBe( 40 );
    expect( partition.progress ).toBe( 40 );
    expect( partition.isComplete ).toBe( false );
    expect( partition.nonDefaultPartitionComplete ).toBe( false );
    expect( partition.partToAdd.codon.value ).toBe( CODON_NONE );
    expect( partition.partToAdd.start.value ).toBe( 41 );
    expect( partition.partToAdd.end.value ).toBe( 41 );
    expect( partition.partToAdd.name.value ).toBe( 'part_2' );
    expect( seen ).toEqual( [[true, 100], [false, 40]] );
    stop();
  } );

  it( 'addPart appends _1 to a name without a trailing number', () => {
    const { partition } = makeAlignment();
    add( partition, { name: 'gene', end: 10 } );
    expect( partition.partToAdd.name.value ).toBe( 'gene_1' );
  } );

  it( 'addPart completing the alignment leaves partToAdd and disables adding', () => {
    const { partition } = makeAlignment();
    const { seen, stop } = track( () => partition.addPartDisabled );
    add( partition, { end: 60 } );
    add( partition, { end: 100 } );
    expect( partition.isComplete ).toBe( true );
    expect( partition.nonDefaultPartitionComplete ).toBe( true );
    expect( partition.progress ).toBe( 100 );
    expect( partition.addPartDisabled ).toBe( true );
    expect( partition.partToAdd.name.value ).toBe( 'part_2' );
    expect( partition.partToAdd.start.value ).toBe( 61 );
    expect( seen ).toEqual( [false, true] );
    stop();
  } );

  it( 'text and transform join the rows of all parts', () => {
    const { partition } = makeAlignment();
    add( partition, { end: 40 } );
    add( partition, { end: 100 } );
    const expected = 'DNA,        part_1 = 1-40\nDNA,        part_2 = 41-100';
    expect( partition.text ).toBe( expected );
    expect( partition.transform() ).toBe( expected );
    expect( partition.transform( 10, 'a_' ) ).toBe(
      'DNA,        a_part_1 = 11-50\nDNA,        a_part_2 = 51-110',
    );
  } );

  it( 'haveError and errorMessage report the end position of the part to add', () => {
    const { partition } = makeAlignment();
    const { seen, stop } = track( () => partition.errorMessage );
    partition.partToAdd.end.setValue( 500 );
    expect( partition.haveError ).toBe( true );
    expect( partition.addPartDisabled ).toBe( true );
    expect( partition.errorMessage ).toBe(
      'End position error: Must be in interval [1, 100]',
    );
    partition.partToAdd.end.setValue( 20 );
    expect( partition.haveError ).toBe( false );
    expect( seen ).toEqual( [
      '',
      'End position error: Must be in interval [1, 100]',
      '',
    ] );
    stop();
  } );

  it( 'reset drops the parts and restores partToAdd', () => {
    const { partition } = makeAlignment();
    add( partition, { end: 40 } );
    partition.reset();
    expect( partition.parts ).toHaveLength( 0 );
    expect( partition.isDefault ).toBe( true );
    expect( partition.partToAdd.name.value ).toBe( 'part_1' );
    expect( partition.partToAdd.start.value ).toBe( 1 );
    expect( partition.partToAdd.end.value ).toBe( 1 );
  } );

  it( 'reset without parts changes nothing', () => {
    const { partition } = makeAlignment();
    runInAction( () => {
      partition.partToAdd.name.value = 'keep';
    } );
    partition.reset();
    expect( partition.partToAdd.name.value ).toBe( 'keep' );
  } );

  it( 'the default part end follows the alignment length once', () => {
    const alignment = makeAlignment( { length: 0 } );
    const { partition } = alignment;
    runInAction( () => {
      alignment.length = 80;
    } );
    expect( partition.defaultPartition.end.value ).toBe( 80 );
    runInAction( () => {
      alignment.length = 90;
    } );
    expect( partition.defaultPartition.end.value ).toBe( 80 );
  } );

  it( 'the default part end stays put for a mixed alignment', () => {
    const alignment = makeAlignment( { dataType: 'mixed', length: 0 } );
    runInAction( () => {
      alignment.length = 80;
    } );
    expect( alignment.partition.defaultPartition.end.value ).toBe( 0 );
  } );

  it( 'the part types follow the alignment data type and matrix', () => {
    const alignment = makeAlignment();
    const { partition } = alignment;
    runInAction( () => {
      alignment.dataType = 'binary';
    } );
    expect( partition.partToAdd.type.value ).toBe( 'BIN' );
    expect( partition.defaultPartition.type.value ).toBe( 'BIN' );
    runInAction( () => {
      alignment.dataType = 'protein';
      alignment.aaMatrixName = 'WAG';
    } );
    expect( partition.partToAdd.type.value ).toBe( 'protein' );
    expect( partition.defaultPartition.type.value ).toBe( 'protein' );
    expect( partition.defaultPartition.aaType.value ).toBe( 'WAG' );
    expect( partition.partToAdd.aaType.value ).toBe( 'WAG' );
  } );
} );
