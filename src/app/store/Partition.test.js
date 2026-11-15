// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Alignment from './Alignment';
import RunList from './RunList';
import { runEvents } from './StoreBase';

// The run and alignment subscribe to bridge events; a no-op bridge is enough here.
function stubBridge() {
  const bridge = { cancelRun: jest.fn(), getVersion: () => Promise.resolve( '2.0.0' ) };
  for ( const name of Object.values( runEvents ) ) {
    bridge[name] = () => () => {};
  }
  window.rendererBridge = bridge;
}

// Records every value an autorun sees, so a test can prove it re-ran.
function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

let run;

// Adds an alignment to the run the way loading a file would, minus the file.
function addAlignment( { dataType = 'nucleotide', length = 100 } = {} ) {
  const alignment = new Alignment( run, `/data/aln${run.alignments.length}.fasta` );
  runInAction( () => {
    alignment.dataType = dataType;
    alignment.length = length;
    run.alignments.push( alignment );
  } );
  return alignment;
}

// Sets the end of the part to add, then adds it.
function addPartEndingAt( partition, end ) {
  runInAction( () => {
    partition.partToAdd.end.value = end;
  } );
  partition.addPart();
}

beforeEach( () => {
  stubBridge();
  run = new RunList().activeRun;
  runInAction( () => {
    run.binary.value = 'raxmlHPC';
  } );
} );

describe( 'Partition', () => {
  it( 'starts as the default partition covering the alignment', () => {
    const { partition } = addAlignment( { length: 100 } );
    expect( partition.parts ).toEqual( [] );
    expect( partition.isDefault ).toBe( true );
    expect( partition.isMixed ).toBe( false );
    expect( partition.maxEndValue ).toBe( 100 );
    expect( partition.currentEndValue ).toBe( 100 );
    expect( partition.isComplete ).toBe( true );
    expect( partition.nonDefaultPartitionComplete ).toBe( false );
    expect( partition.progress ).toBe( 100 );
    expect( partition.text ).toBe( 'DNA,        part_1 = 1-100' );
  } );

  it( 'the default partition follows the alignment length and data type', () => {
    const alignment = new Alignment( run, '/data/a.fasta' );
    const { partition } = alignment;
    const { seen, stop } = track( () => partition.text );
    runInAction( () => {
      alignment.dataType = 'nucleotide';
      alignment.length = 250;
    } );
    expect( partition.defaultPartition.end.value ).toBe( 250 );
    expect( partition.defaultPartition.type.value ).toBe( 'DNA' );
    expect( partition.partToAdd.type.value ).toBe( 'DNA' );
    expect( partition.text ).toBe( 'DNA,        part_1 = 1-250' );
    runInAction( () => {
      alignment.dataType = 'binary';
    } );
    expect( partition.defaultPartition.type.value ).toBe( 'BIN' );
    expect( partition.partToAdd.type.value ).toBe( 'BIN' );
    expect( seen[seen.length - 1] ).toBe( 'BIN,        part_1 = 1-250' );
    stop();
  } );

  it( 'a protein alignment takes the amino acid matrix as the model', () => {
    const alignment = new Alignment( run, '/data/a.fasta' );
    const { partition } = alignment;
    runInAction( () => {
      alignment.dataType = 'protein';
      alignment.aaMatrixName = 'WAG';
      alignment.length = 30;
    } );
    expect( partition.defaultPartition.type.value ).toBe( 'protein' );
    expect( partition.defaultPartition.aaType.value ).toBe( 'WAG' );
    expect( partition.partToAdd.aaType.value ).toBe( 'WAG' );
    expect( partition.text ).toBe( 'WAG,        part_1 = 1-30' );
  } );

  it( 'a mixed alignment keeps the default partition end', () => {
    const alignment = new Alignment( run, '/data/a.fasta' );
    const before = alignment.partition.defaultPartition.end.value;
    runInAction( () => {
      alignment.dataType = 'mixed';
      alignment.length = 80;
    } );
    expect( alignment.partition.isMixed ).toBe( true );
    expect( alignment.partition.defaultPartition.end.value ).toBe( before );
  } );

  it( 'adding a part appends it and prepares the next start and a fresh name', () => {
    const { partition } = addAlignment( { length: 100 } );
    const { seen, stop } = track( () => partition.parts.length );
    addPartEndingAt( partition, 40 );
    expect( partition.parts.map( ( p ) => p.values ) ).toEqual( [
      { type: 'DNA', aaType: 'BLOSUM62', name: 'part_1', start: 1, end: 40, codon: 'None' },
    ] );
    expect( partition.partToAdd.start.value ).toBe( 41 );
    expect( partition.partToAdd.end.value ).toBe( 41 );
    expect( partition.partToAdd.name.value ).toBe( 'part_2' );
    expect( partition.partToAdd.codon.value ).toBe( 'None' );
    expect( seen ).toEqual( [0, 1] );
    stop();
  } );

  it( 'adding a part to a name without digits appends _1', () => {
    const { partition } = addAlignment( { length: 100 } );
    runInAction( () => {
      partition.partToAdd.name.value = 'gene';
    } );
    addPartEndingAt( partition, 10 );
    expect( partition.partToAdd.name.value ).toBe( 'gene_1' );
  } );

  it( 'adding the last part completes the partition', () => {
    const { partition } = addAlignment( { length: 100 } );
    addPartEndingAt( partition, 60 );
    const { seen, stop } = track( () => partition.addPartDisabled );
    addPartEndingAt( partition, 100 );
    expect( partition.isDefault ).toBe( false );
    expect( partition.currentEndValue ).toBe( 100 );
    expect( partition.isComplete ).toBe( true );
    expect( partition.nonDefaultPartitionComplete ).toBe( true );
    expect( partition.progress ).toBe( 100 );
    expect( partition.addPartDisabled ).toBe( true );
    expect( seen ).toEqual( [false, true] );
    stop();
  } );

  it( 'progress, currentEndValue and text follow the parts', () => {
    const { partition } = addAlignment( { length: 100 } );
    const { seen, stop } = track( () => [
      partition.currentEndValue,
      partition.progress,
      partition.isDefault,
    ] );
    addPartEndingAt( partition, 25 );
    expect( partition.isComplete ).toBe( false );
    expect( partition.nonDefaultPartitionComplete ).toBe( false );
    expect( partition.text ).toBe( 'DNA,        part_1 = 1-25' );
    expect( seen ).toEqual( [
      [100, 100, true],
      [25, 25, false],
    ] );
    addPartEndingAt( partition, 100 );
    expect( partition.text ).toBe(
      'DNA,        part_1 = 1-25\nDNA,        part_2 = 26-100',
    );
    stop();
  } );

  it( 'a codon specific part expands to one row per codon', () => {
    const { partition } = addAlignment( { length: 99 } );
    runInAction( () => {
      partition.partToAdd.codon.value = 'Codon specific';
    } );
    addPartEndingAt( partition, 99 );
    expect( partition.text ).toBe(
      [
        'DNA,        part_1_codon1 = 1-99\\3',
        'DNA,        part_1_codon2 = 2-99\\3',
        'DNA,        part_1_codon3 = 3-99\\3',
      ].join( '\n' ),
    );
    expect( partition.partToAdd.codon.value ).toBe( 'None' );
  } );

  it( 'transform applies the offset and prefix to the default and added parts', () => {
    const { partition } = addAlignment( { length: 100 } );
    expect( partition.transform( 10, 'x_' ) ).toBe( 'DNA,        x_part_1 = 11-110' );
    addPartEndingAt( partition, 30 );
    expect( partition.transform( 10, 'x_' ) ).toBe( 'DNA,        x_part_1 = 11-40' );
    expect( partition.transform() ).toBe( 'DNA,        part_1 = 1-30' );
  } );

  it( 'haveError, errorMessage and addPartDisabled follow the end of the part to add', () => {
    const { partition } = addAlignment( { length: 100 } );
    const { seen, stop } = track( () => [
      partition.haveError,
      partition.errorMessage,
      partition.addPartDisabled,
    ] );
    expect( seen[0] ).toEqual( [false, '', false] );
    runInAction( () => {
      partition.partToAdd.end.value = 500;
    } );
    expect( partition.haveError ).toBe( true );
    expect( partition.errorMessage ).toBe(
      'End position error: Must be in interval [1, 100]',
    );
    expect( partition.addPartDisabled ).toBe( true );
    runInAction( () => {
      partition.partToAdd.end.value = 50;
    } );
    expect( seen[seen.length - 1] ).toEqual( [false, '', false] );
    stop();
  } );

  it( 'a reaction sees parts set directly', () => {
    const { partition } = addAlignment( { length: 100 } );
    const { seen, stop } = track( () => [partition.isDefault, partition.text] );
    runInAction( () => {
      partition.parts.push( partition.partToAdd.clone() );
    } );
    expect( seen.map( ( s ) => s[0] ) ).toEqual( [true, false] );
    expect( seen[1][1] ).toBe( 'DNA,        part_1 = 1-1' );
    stop();
  } );

  it( 'maxEndValue and isComplete follow the alignment length', () => {
    const alignment = addAlignment( { length: 100 } );
    const { partition } = alignment;
    addPartEndingAt( partition, 100 );
    const { seen, stop } = track( () => [partition.maxEndValue, partition.isComplete] );
    runInAction( () => {
      alignment.length = 120;
    } );
    expect( seen ).toEqual( [
      [100, true],
      [120, false],
    ] );
    stop();
  } );

  it( 'reset removes the parts and restores the part to add', () => {
    const { partition } = addAlignment( { length: 100 } );
    addPartEndingAt( partition, 30 );
    const { seen, stop } = track( () => partition.isDefault );
    partition.reset();
    expect( partition.parts ).toEqual( [] );
    expect( partition.partToAdd.name.value ).toBe( 'part_1' );
    expect( partition.partToAdd.start.value ).toBe( 1 );
    expect( partition.partToAdd.end.value ).toBe( 1 );
    expect( seen ).toEqual( [false, true] );
    stop();
  } );

  it( 'reset leaves the part to add alone when there are no parts', () => {
    const { partition } = addAlignment( { length: 100 } );
    runInAction( () => {
      partition.partToAdd.name.value = 'keep';
    } );
    partition.reset();
    expect( partition.partToAdd.name.value ).toBe( 'keep' );
  } );
} );

describe( 'FinalPartition', () => {
  it( 'is empty, default and complete without alignments', () => {
    const finalPartition = run.finalAlignment.partition;
    expect( finalPartition.text ).toBe( '' );
    expect( finalPartition.isDefault ).toBe( true );
    expect( finalPartition.isComplete ).toBe( true );
  } );

  it( 'text offsets and prefixes each alignment partition', () => {
    const finalPartition = run.finalAlignment.partition;
    const { seen, stop } = track( () => finalPartition.text );
    addAlignment( { dataType: 'nucleotide', length: 100 } );
    addAlignment( { dataType: 'binary', length: 50 } );
    expect( finalPartition.text ).toBe(
      'DNA,        0_part_1 = 1-100\nBIN,        1_part_1 = 101-150',
    );
    expect( seen[0] ).toBe( '' );
    expect( seen[seen.length - 1] ).toBe( finalPartition.text );
    stop();
  } );

  it( 'text follows the added parts of an alignment', () => {
    const finalPartition = run.finalAlignment.partition;
    const first = addAlignment( { length: 100 } );
    addAlignment( { length: 50 } );
    addPartEndingAt( first.partition, 40 );
    addPartEndingAt( first.partition, 100 );
    expect( finalPartition.text ).toBe(
      [
        'DNA,        0_part_1 = 1-40',
        'DNA,        0_part_2 = 41-100',
        'DNA,        1_part_1 = 101-150',
      ].join( '\n' ),
    );
  } );

  it( 'isDefault is true for one default alignment and false otherwise', () => {
    const finalPartition = run.finalAlignment.partition;
    const { seen, stop } = track( () => finalPartition.isDefault );
    const first = addAlignment( { length: 100 } );
    expect( finalPartition.isDefault ).toBe( true );
    addPartEndingAt( first.partition, 40 );
    expect( finalPartition.isDefault ).toBe( false );
    first.partition.reset();
    expect( finalPartition.isDefault ).toBe( true );
    addAlignment( { length: 10 } );
    expect( finalPartition.isDefault ).toBe( false );
    expect( seen ).toEqual( [true, false, true, false] );
    stop();
  } );

  it( 'isComplete requires every alignment partition to be complete', () => {
    const finalPartition = run.finalAlignment.partition;
    const first = addAlignment( { length: 100 } );
    const second = addAlignment( { length: 100 } );
    const { seen, stop } = track( () => finalPartition.isComplete );
    addPartEndingAt( second.partition, 40 );
    expect( finalPartition.isComplete ).toBe( false );
    addPartEndingAt( second.partition, 100 );
    expect( finalPartition.isComplete ).toBe( true );
    expect( first.partition.isComplete ).toBe( true );
    expect( seen ).toEqual( [true, false, true] );
    stop();
  } );
} );
