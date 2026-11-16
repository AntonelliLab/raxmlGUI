// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

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

const checkOutput = jest.fn( async ( { outputName } ) => ( {
  ok: true,
  outputNameUnused: outputName,
  resultFilenames: [],
} ) );

const flush = () => new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

// Runs `read` in an autorun and returns every value it saw, newest last.
function watch( read ) {
  const seen = [];
  const dispose = autorun( () => seen.push( read() ) );
  return { seen, dispose };
}

let run;

beforeEach( () => {
  checkOutput.mockClear();
  window.rendererBridge = { parseAlignment: stayParsed, checkOutput };
  run = new Run( {}, 7 );
} );

describe( 'output name and directory', () => {
  it( 'setOutputName replaces spaces and trims the name', () => {
    run.setOutputName( '  my run ' );
    expect( run.outputName ).toBe( '_my_run_' );
  } );

  it( 'a new output name reaches the output check and the safe name', async () => {
    const { seen, dispose } = watch( () => run.outputNameSafe );
    await flush();
    run.setOutputName( 'primates' );
    await flush();
    dispose();

    expect( checkOutput ).toHaveBeenLastCalledWith( {
      outputDir: '',
      outputName: 'primates',
    } );
    expect( seen[seen.length - 1] ).toBe( 'primates' );
  } );

  it( 'setOutputDir sets the directory and moves the settings file path', () => {
    const { seen, dispose } = watch( () => run.settingsFilePath );
    run.setOutputDir( '/out' );
    dispose();

    expect( run.outputDir ).toBe( '/out' );
    expect( seen[seen.length - 1] ).toContain( '/out' );
    expect( seen[seen.length - 1] ).toContain( 'RAxML_GUI_Settings_' );
  } );

  it( 'openOutputDir opens the output directory', async () => {
    const openPath = jest.fn( async () => {} );
    window.rendererBridge = { checkOutput, openPath };
    run.setOutputDir( '/out' );

    await run.openOutputDir();

    expect( openPath ).toHaveBeenCalledWith( '/out' );
  } );
} );

describe( 'random seed', () => {
  it( 'setRandomSeed accepts a number and the seeds follow', () => {
    const { seen, dispose } = watch( () => run.seedBootstrap );
    run.setRandomSeed( '12345' );
    dispose();

    expect( run.randomSeed ).toBe( 12345 );
    expect( run.seedParsimony ).toBe( 12345 );
    expect( run.seedRapidBootstrap ).toBe( 12345 );
    expect( seen[seen.length - 1] ).toBe( 12345 );
  } );

  it.each( [ '0', 'abc', '1000000', '2000000' ] )(
    'setRandomSeed ignores %s',
    ( value ) => {
      run.setRandomSeed( '42' );
      run.setRandomSeed( value );
      expect( run.randomSeed ).toBe( 42 );
    },
  );
} );

describe( 'alignments', () => {
  it( 'addAlignments adds the paths and names the run after the first', () => {
    const { seen, dispose } = watch( () => run.haveAlignments );
    run.addAlignments( [
      { path: '/data/primates.fasta' },
      { path: '/data/cats.phy' },
    ] );
    dispose();

    expect( run.alignments ).toHaveLength( 2 );
    expect( run.alignments[0].path ).toBe( '/data/primates.fasta' );
    expect( run.outputName ).toBe( run.alignments[0].name );
    expect( run.outputDir ).toBe( run.alignments[0].dir );
    expect( seen ).toEqual( [ false, true ] );
  } );

  it( 'addAlignments keeps an output directory that is already set', () => {
    run.setOutputDir( '/elsewhere' );
    run.addAlignments( [{ path: '/data/primates.fasta' }] );
    expect( run.outputDir ).toBe( '/elsewhere' );
  } );

  it( 'a loaded alignment lets the partition file load, a second one blocks it', () => {
    const { seen, dispose } = watch( () => run.canLoadPartitionFile );
    run.addAlignments( [{ path: '/data/primates.fasta' }] );
    run.addAlignments( [{ path: '/data/cats.phy' }] );
    dispose();

    expect( seen ).toEqual( [ false, true, false ] );
  } );

  it( 'removeAlignment removes it and keeps the partition while others remain', async () => {
    window.rendererBridge = {
      parseAlignment: stayParsed,
      checkOutput,
      readFile: async () => 'DNA, g = 1-10\n',
    };
    run.addAlignments( [
      { path: '/data/primates.fasta' },
      { path: '/data/cats.phy' },
    ] );
    await run.addPartitionFiles( [{ path: '/data/g.part' }] );

    run.removeAlignment( run.alignments[0] );

    expect( run.alignments.map( ( a ) => a.path ) ).toEqual( [ '/data/cats.phy' ] );
    expect( run.partitionFile ).toBe( '/data/g.part' );
  } );

  it( 'removing the last alignment resets the partition file', async () => {
    window.rendererBridge = {
      parseAlignment: stayParsed,
      checkOutput,
      readFile: async () => 'DNA, g = 1-10\n',
    };
    run.addAlignments( [{ path: '/data/primates.fasta' }] );
    await run.addPartitionFiles( [{ path: '/data/g.part' }] );
    const { seen, dispose } = watch( () => run.haveAlignments );

    run.removeAlignment( run.alignments[0] );
    dispose();

    expect( seen ).toEqual( [ true, false ] );
    expect( run.partitionFile ).toBe( '' );
    expect( run.partitionFileContent ).toBe( '' );
  } );

  it( 'removeAlignment ignores an alignment the run does not hold', () => {
    run.addAlignments( [{ path: '/data/primates.fasta' }] );
    const other = new Run( {}, 8 );
    other.addAlignments( [{ path: '/data/other.fasta' }] );

    run.removeAlignment( other.alignments[0] );

    expect( run.alignments ).toHaveLength( 1 );
  } );

  it( 'showPartition marks that alignment as shown, hidePartition clears it', () => {
    run.addAlignments( [{ path: '/data/primates.fasta' }] );
    const [ alignment ] = run.alignments;
    const { seen, dispose } = watch( () => alignment.showPartition );

    run.showPartition( alignment );
    expect( run.showPartitionFor ).toBe( alignment );
    run.hidePartition();
    dispose();

    expect( run.showPartitionFor ).toBeNull();
    expect( seen ).toEqual( [ false, true, false ] );
  } );
} );

describe( 'ASTRAL tree', () => {
  it( 'addAstralFiles sets the tree, the name and the directory once', () => {
    const { seen, dispose } = watch( () => run.hasAstralTree );
    run.addAstralFiles( { path: '/data/trees.tre' } );
    run.addAstralFiles( { path: '/data/second.tre' } );
    dispose();

    expect( run.astralTree.path ).toBe( '/data/trees.tre' );
    expect( run.outputName ).toBe( run.astralTree.name );
    expect( run.outputDir ).toBe( run.astralTree.dir );
    expect( seen ).toEqual( [ false, true ] );
  } );

  it( 'removeAstralTree clears the tree', () => {
    run.addAstralFiles( { path: '/data/trees.tre' } );
    const { seen, dispose } = watch( () => run.hasAstralTree );

    run.removeAstralTree();
    dispose();

    expect( run.astralTree ).toBeNull();
    expect( seen ).toEqual( [ true, false ] );
  } );
} );

describe( 'partition file', () => {
  it( 'loadPartitionFile shows the path and content after the read resolves', async () => {
    let finishRead;
    const readFile = jest.fn(
      () => new Promise( ( resolve ) => { finishRead = resolve; } ),
    );
    window.rendererBridge = {
      checkOutput,
      selectPartitionFile: async () => '/data/genes.part',
      readFile,
    };
    const { seen, dispose } = watch( () => `${run.partitionFile}|${run.partitionFileContent}` );

    const loading = run.loadPartitionFile();
    await flush();
    expect( readFile ).toHaveBeenCalledWith( '/data/genes.part' );
    expect( run.partitionFile ).toBe( '' );
    expect( run.partitionFileContent ).toBe( '' );

    finishRead( 'DNA, gene = 1-100\n' );
    await loading;
    dispose();

    expect( run.partitionFile ).toBe( '/data/genes.part' );
    expect( run.partitionFileContent ).toBe( 'DNA, gene = 1-100\n' );
    expect( seen[seen.length - 1] ).toBe( '/data/genes.part|DNA, gene = 1-100\n' );
  } );

  it( 'a loaded partition file moves its computeds and blocks the alignment picker', async () => {
    window.rendererBridge = { checkOutput, readFile: async () => 'x' };
    const name = watch( () => run.partitionFileName );
    const have = watch( () => run.havePartitionFile );
    const canLoad = watch( () => run.canLoadAlignment );

    await run.addPartitionFiles( [{ path: '/data/genes.part' }] );
    name.dispose();
    have.dispose();
    canLoad.dispose();

    expect( name.seen[name.seen.length - 1] ).toBe( 'genes.part' );
    expect( have.seen ).toEqual( [ false, true ] );
    expect( canLoad.seen ).toEqual( [ true, false ] );
  } );

  it( 'addPartitionFiles with no files changes nothing', async () => {
    window.rendererBridge = { checkOutput, readFile: jest.fn() };
    await run.addPartitionFiles( [] );
    expect( run.partitionFile ).toBe( '' );
    expect( window.rendererBridge.readFile ).not.toHaveBeenCalled();
  } );

  it( 'removePartitionFile clears the path and the content', async () => {
    window.rendererBridge = { checkOutput, readFile: async () => 'x' };
    await run.addPartitionFiles( [{ path: '/data/genes.part' }] );
    const { seen, dispose } = watch( () => run.havePartitionFile );

    run.removePartitionFile();
    dispose();

    expect( run.partitionFile ).toBe( '' );
    expect( run.partitionFileContent ).toBe( '' );
    expect( seen ).toEqual( [ true, false ] );
  } );
} );

describe( 'tree files', () => {
  it.each( [ 'tree', 'backboneConstraint', 'multifurcatingConstraint' ] )(
    'addTreeFiles sets the %s file',
    ( type ) => {
      const { seen, dispose } = watch( () => run[type].haveFile );
      run.addTreeFiles( type, [{ path: '/data/t.nwk' }] );
      dispose();

      expect( run[type].filePath ).toBe( '/data/t.nwk' );
      expect( run[type].filename ).toBe( 't.nwk' );
      expect( seen ).toEqual( [ false, true ] );
    },
  );

  it( 'addTreeFiles ignores an unknown type and an empty list', () => {
    run.addTreeFiles( 'other', [{ path: '/data/t.nwk' }] );
    run.addTreeFiles( 'tree', [] );

    expect( run.tree.filePath ).toBe( '' );
    expect( run.backboneConstraint.filePath ).toBe( '' );
    expect( run.multifurcatingConstraint.filePath ).toBe( '' );
  } );
} );

describe( 'state set directly', () => {
  it( 'setting the alignments inside runInAction moves numSites', () => {
    const { seen, dispose } = watch( () => run.numSites );
    runInAction( () => {
      run.alignments = [ 3, 4 ];
    } );
    dispose();

    expect( seen ).toEqual( [ 0, 7 ] );
  } );
} );
