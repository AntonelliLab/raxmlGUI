// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Run from './Run';

// The final alignment reads its run's alignments; build a real run with
// sequences set directly, as writeConcatenatedAlignment.test.js does.
function makeRun( alignments ) {
  const run = new Run( {}, 7 );
  // outputNameAvailable is a promisedComputed that only settles inside a reaction (outside one each read calls the bridge); pin it.
  run.outputNameAvailable = { get: () => ( { outputNameUnused: 'out' } ) };
  window.rendererBridge = { parseAlignment: () => new Promise( () => {} ) };
  run.addAlignments( alignments.map( ( { path } ) => ( { path } ) ) );
  runInAction( () => {
    run.outputDir = '/out';
    alignments.forEach( ( spec, i ) => {
      const a = run.alignments[i];
      a.sequences = spec.sequences;
      a.length = spec.length;
      a.dataType = spec.dataType || 'nucleotide';
      a.hasInvariantSites = !!spec.hasInvariantSites;
    } );
  } );
  return run;
}

const A = {
  path: '/data/a.fasta',
  length: 2,
  sequences: [
    { taxon: 'Homo', code: 'AT' },
    { taxon: 'Mus', code: 'GC' },
  ],
};
const B = {
  path: '/data/b.fasta',
  length: 3,
  dataType: 'protein',
  sequences: [
    { taxon: 'Mus', code: 'AAA' },
    { taxon: 'Rat', code: 'CCC' },
  ],
};

function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

describe( 'FinalAlignment computeds', () => {
  it( 'uses the single alignment file as is', () => {
    const { finalAlignment: f } = makeRun( [A] );
    expect( f.numAlignments ).toBe( 1 );
    expect( f.filename ).toBe( 'a.fasta' );
    expect( f.dir ).toBe( '/data' );
    expect( f.path ).toBe( '/data/a.fasta' );
    expect( f.length ).toBe( 2 );
    expect( f.dataType ).toBe( 'nucleotide' );
    expect( f.partitionFilePath ).toBe( '' );
  } );

  it( 'names a concatenated file in the output dir', () => {
    const run = makeRun( [A, B] );
    const f = run.finalAlignment;
    expect( f.numAlignments ).toBe( 2 );
    expect( f.filename ).toBe( `RAxML_${run.outputNameSafe}_concat.txt` );
    expect( f.dir ).toBe( '/out' );
    expect( f.path ).toBe( `/out/${f.filename}` );
    expect( f.length ).toBe( 5 );
    expect( f.partitionFilePath ).toBe(
      `/out/RAxML_${run.outputNameSafe}_concat.part.txt`,
    );
    expect( f.partitionFileContent ).toBe( f.partition.text );
    expect( f.partitionFileContent ).not.toBe( '' );
  } );

  it( 'reports no model flag without alignments, else the first one', () => {
    expect( makeRun( [] ).finalAlignment.modelFlagName ).toBe( 'none' );
    const run = makeRun( [A, B] );
    expect( run.finalAlignment.modelFlagName ).toBe(
      run.alignments[0].modelFlagName,
    );
  } );

  it( 'combines data types and invariant sites over alignments', () => {
    const run = makeRun( [A, B] );
    expect( run.finalAlignment.dataType ).toBe( 'mixed' );
    expect( run.finalAlignment.hasInvariantSites ).toBe( false );
    runInAction( () => {
      run.alignments[1].hasInvariantSites = true;
    } );
    expect( run.finalAlignment.hasInvariantSites ).toBe( true );
  } );
} );

describe( 'FinalAlignment observables', () => {
  it( 'fillTaxonGapsWithEmptySeqeunces switches taxons between union and intersection', () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const { seen, stop } = track( () => [f.taxons, f.numSequences] );
    expect( seen[0] ).toEqual( [['Homo', 'Mus', 'Rat'], 3] );
    f.setFillTaxonGapsWithEmptySeqeunces( false );
    expect( seen[1] ).toEqual( [['Mus'], 1] );
    runInAction( () => {
      f.fillTaxonGapsWithEmptySeqeunces = true;
    } );
    expect( seen[2] ).toEqual( [['Homo', 'Mus', 'Rat'], 3] );
    stop();
  } );

  it( 'parsingComplete is seen by a reaction', () => {
    const f = makeRun( [A] ).finalAlignment;
    const { seen, stop } = track( () => f.parsingComplete );
    runInAction( () => {
      f.parsingComplete = false;
    } );
    expect( seen ).toEqual( [true, false] );
    stop();
  } );
} );

describe( 'FinalAlignment actions', () => {
  function stubBridge() {
    const bridge = {
      writeFile: jest.fn( async () => {} ),
      openPath: jest.fn( async () => {} ),
      showItemInFolder: jest.fn( async () => {} ),
    };
    window.rendererBridge = bridge;
    return bridge;
  }

  beforeEach( () => {
    jest.spyOn( console, 'log' ).mockImplementation( () => {} );
    jest.spyOn( console, 'error' ).mockImplementation( () => {} );
  } );
  afterEach( () => jest.restoreAllMocks() );

  it( 'writeConcatenatedAlignment fills gaps or drops taxons', async () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const bridge = stubBridge();
    f.setFillTaxonGapsWithEmptySeqeunces( false );
    await f.writeConcatenatedAlignment();
    expect( bridge.writeFile ).toHaveBeenCalledWith( f.path, '>Mus\nGCAAA' );
  } );

  it( 'writeConcatenatedAlignment rethrows a write failure', async () => {
    const f = makeRun( [A] ).finalAlignment;
    stubBridge().writeFile.mockRejectedValue( new Error( 'disk' ) );
    await expect( f.writeConcatenatedAlignment() ).rejects.toThrow( 'disk' );
  } );

  it( 'writePartition writes the partition text and rethrows failures', async () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const bridge = stubBridge();
    await f.writePartition();
    expect( bridge.writeFile ).toHaveBeenCalledWith(
      f.partitionFilePath,
      f.partitionFileContent,
    );
    bridge.writeFile.mockRejectedValue( new Error( 'nope' ) );
    await expect( f.writePartition() ).rejects.toThrow( 'nope' );
  } );

  it( 'writeConcatenatedAlignmentAndPartition writes both files', async () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const bridge = stubBridge();
    await f.writeConcatenatedAlignmentAndPartition();
    expect( bridge.writeFile.mock.calls.map( ( c ) => c[0] ) ).toEqual( [
      f.path,
      f.partitionFilePath,
    ] );
  } );

  it( 'openFile writes then opens the alignment', async () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const bridge = stubBridge();
    await f.openFile();
    expect( bridge.writeFile ).toHaveBeenCalledTimes( 1 );
    expect( bridge.openPath ).toHaveBeenCalledWith( f.path );
  } );

  it( 'openPartition writes both files then opens the partition', async () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const bridge = stubBridge();
    await f.openPartition();
    expect( bridge.writeFile ).toHaveBeenCalledTimes( 2 );
    expect( bridge.openPath ).toHaveBeenCalledWith( f.partitionFilePath );
  } );

  it( 'showFileInFolder writes then reveals the alignment', async () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const bridge = stubBridge();
    await f.showFileInFolder();
    expect( bridge.writeFile ).toHaveBeenCalledTimes( 1 );
    expect( bridge.showItemInFolder ).toHaveBeenCalledWith( f.path );
  } );

  it( 'openFolder writes both files then reveals the folder', async () => {
    const f = makeRun( [A, B] ).finalAlignment;
    const bridge = stubBridge();
    await f.openFolder();
    expect( bridge.writeFile ).toHaveBeenCalledTimes( 2 );
    expect( bridge.showItemInFolder ).toHaveBeenCalledWith( f.dir );
  } );
} );
