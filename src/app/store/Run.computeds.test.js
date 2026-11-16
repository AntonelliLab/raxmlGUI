// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Run from './Run';
import { analysisOptions, binaries } from './RunOptions';
import { runEvents } from './StoreBase';

const modeltestName = binaries.find( ( b ) => b.type === 'modeltest' ).name;

let checkOutput;
let stops = [];

// The run subscribes to bridge events in its constructor; the stub accepts and ignores them.
beforeEach( () => {
  stops = [];
  checkOutput = jest.fn( async ( { outputName } ) => ( {
    ok: true,
    outputNameUnused: outputName,
    resultFilenames: [],
  } ) );
  const bridge = { checkOutput, getVersion: () => Promise.resolve( '2.0.0' ) };
  for ( const name of Object.values( runEvents ) ) {
    bridge[name] = () => () => {};
  }
  window.rendererBridge = bridge;
} );

afterEach( () => stops.forEach( ( stop ) => stop() ) );

const nucleotide = ( over = {} ) => ( {
  name: 'a.fasta',
  path: '/in/a.fasta',
  filename: 'a.fasta',
  dir: '/in',
  taxons: ['t1', 't2', 't3'],
  length: 10,
  dataType: 'nucleotide',
  modified: false,
  converted: false,
  showModifiedSnack: false,
  showModifiedDialog: false,
  modeltestLoading: false,
  modificationMessages: [],
  ngSubstitutionModelCmd: 'GTR+G',
  partition: { isDefault: true, isComplete: true },
  ...over,
} );

function makeRun( { alignments = [nucleotide()], binary = 'raxmlHPC', outputDir = '/out' } = {} ) {
  const run = new Run( null, 1 );
  runInAction( () => {
    run.binary.value = binary;
    run.outputDir = outputDir;
    run.alignments = alignments;
  } );
  // analysis is a computed that builds its option; keep it observed so a set value sticks.
  stops.push( autorun( () => run.analysis ) );
  return run;
}

// outputNameAvailable only settles inside a reaction, so reads that touch it go through here.
function read( fn ) {
  let value;
  autorun( () => {
    value = fn();
  } )();
  return value;
}

// outputNameAvailable is async and only computes while observed.
async function observeOutput( run ) {
  stops.push( autorun( () => run.outputNameAvailable.get() ) );
  await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

describe( 'Run binary computeds', () => {
  it( 'maps the binary to its flags', () => {
    const run = makeRun( { binary: 'raxml-ng' } );
    expect( [run.usesRaxmlNg, run.usesRaxml, run.usesModeltest, run.usesAstral] )
      .toEqual( [true, true, false, false] );
    expect( [run.inputIsAlignment, run.inputIsTree] ).toEqual( [true, false] );
    runInAction( () => {
      run.binary.value = 'raxmlHPC';
    } );
    expect( [run.usesRaxmlNg, run.usesRaxml] ).toEqual( [false, true] );
    runInAction( () => {
      run.binary.value = modeltestName;
    } );
    expect( [run.usesModeltestNg, run.usesModeltest, run.usesRaxml] )
      .toEqual( [true, true, false] );
    expect( run.inputIsAlignment ).toBe( true );
  } );

  it( 'analysis and analysisOption follow the binary family', () => {
    const run = makeRun( { binary: 'raxmlHPC' } );
    run.analysis.setValue( 'FT' );
    expect( run.analysisOption.title ).toBe( 'Fast tree search' );
    runInAction( () => {
      run.binary.value = 'raxml-ng';
    } );
    expect( run.analysisOption.value ).toBe( run.analysis.value );
    expect( run.analysisOption.title ).not.toBe( 'Fast tree search' );
  } );

  it( 'haveRandomSeed is true only for analyses that take a seed', () => {
    const run = makeRun( { binary: 'raxmlHPC' } );
    run.analysis.setValue( 'FT' );
    expect( run.haveRandomSeed ).toBe( true );
    run.analysis.setValue( 'SC' );
    expect( run.haveRandomSeed ).toBe( false );
  } );

  it( 'the three seeds mirror randomSeed', () => {
    const run = makeRun();
    run.setRandomSeed( 42 );
    expect( [run.seedParsimony, run.seedRapidBootstrap, run.seedBootstrap] )
      .toEqual( [42, 42, 42] );
  } );
} );

describe( 'Run alignment computeds', () => {
  it( 'haveAlignments, taxons and numSites follow the alignments', () => {
    const run = makeRun( { alignments: [] } );
    expect( run.haveAlignments ).toBe( false );
    expect( run.taxons ).toEqual( [] );
    runInAction( () => {
      run.alignments = [nucleotide()];
    } );
    expect( run.haveAlignments ).toBe( true );
    expect( run.taxons ).toEqual( ['t1', 't2', 't3'] );
    expect( run.dataType ).toBe( 'nucleotide' );
  } );

  it( 'hasAstralTree and canLoadAstralTree follow the tree', () => {
    const run = makeRun();
    expect( run.hasAstralTree ).toBe( false );
    expect( run.canLoadAstralTree ).toBe( false );
    runInAction( () => {
      run.astralTree = { path: '/in/t.tre' };
    } );
    expect( run.hasAstralTree ).toBe( true );
  } );

  it( 'canLoadAlignment is false once a partition file is loaded', () => {
    const run = makeRun();
    expect( run.canLoadAlignment ).toBe( true );
    runInAction( () => {
      run.partitionFile = '/in/parts.txt';
    } );
    expect( run.havePartitionFile ).toBe( true );
    expect( run.partitionFileName ).toBe( 'parts.txt' );
    expect( run.canLoadAlignment ).toBe( false );
    expect( run.canLoadPartitionFile ).toBe( false );
  } );

  it( 'canLoadPartitionFile needs exactly one alignment', () => {
    const one = makeRun();
    expect( one.canLoadPartitionFile ).toBe( true );
    const two = makeRun( { alignments: [nucleotide(), nucleotide()] } );
    expect( two.canLoadPartitionFile ).toBe( false );
  } );

  it( 'modified flags are true when any alignment is flagged', () => {
    const run = makeRun( {
      alignments: [
        nucleotide(),
        nucleotide( {
          name: 'b.fasta',
          modified: true,
          converted: true,
          convertedFrom: 'phylip',
          showModifiedSnack: true,
          showModifiedDialog: true,
          modificationMessages: ['fixed names'],
        } ),
      ],
    } );
    expect( run.modified ).toBe( true );
    expect( run.converted ).toBe( true );
    expect( run.convertedAlignmentFrom ).toBe( 'phylip' );
    expect( run.showModifiedSnack ).toBe( true );
    expect( run.showModifiedDialog ).toBe( true );
    expect( run.modificationMessages ).toEqual( [
      'a.fasta:\n', 'b.fasta:\n', 'fixed names\n',
    ] );
  } );

  it( 'modified flags are false without alignments', () => {
    const run = makeRun( { alignments: [] } );
    expect( [run.modified, run.converted, run.showModifiedSnack, run.showModifiedDialog] )
      .toEqual( [false, false, false, false] );
    expect( run.convertedAlignmentFrom ).toBe( null );
    expect( run.ngSubstitutionModelCmd ).toBe( '' );
  } );

  it( 'modelTestIsRunningOnAlignment and modelTestCanRun', () => {
    const run = makeRun( { alignments: [nucleotide( { modeltestLoading: true } )] } );
    expect( run.modelTestIsRunningOnAlignment ).toBe( true );
    expect( run.modelTestCanRun ).toBe( true );
    runInAction( () => {
      run.alignments[0].dataType = 'multistate';
      run.alignments[0].modeltestLoading = false;
    } );
    expect( run.modelTestIsRunningOnAlignment ).toBe( false );
    expect( run.modelTestCanRun ).toBe( false );
  } );

  it( 'ngSubstitutionModelCmd comes from the first alignment', () => {
    expect( makeRun().ngSubstitutionModelCmd ).toBe( 'GTR+G' );
  } );

  it( 'numSites is 0 without alignments', () => {
    expect( makeRun( { alignments: [] } ).numSites ).toBe( 0 );
  } );

  it( 'needAlignment is always true', () => {
    expect( makeRun().needAlignment ).toBe( true );
  } );
} );

describe( 'Run state computeds', () => {
  it( 'missing asks for a tree only for an analysis that needs one', () => {
    const run = makeRun( { binary: 'raxmlHPC' } );
    const needsTree = analysisOptions.find( ( o ) => o.params.includes( 'tree' ) );
    run.analysis.setValue( 'FT' );
    expect( run.missing ).toBe( '' );
    run.analysis.setValue( needsTree.value );
    expect( run.missing ).toBe( 'Missing tree, please load one.' );
    expect( run.ok ).toBe( false );
    expect( run.startDisabled ).toBe( true );
  } );

  it( 'ok is false while an error is set', () => {
    const run = makeRun();
    const { missing } = run;
    expect( run.ok ).toBe( !missing );
    runInAction( () => {
      run.error = 'boom';
    } );
    expect( run.ok ).toBe( false );
  } );

  it( 'startDisabled is true without alignments or tree', () => {
    expect( makeRun( { alignments: [] } ).startDisabled ).toBe( true );
  } );

  it( 'startDisabled is true while running or in error', () => {
    const run = makeRun();
    runInAction( () => {
      run.error = 'boom';
    } );
    expect( run.startDisabled ).toBe( true );
    runInAction( () => {
      run.error = null;
      run.running = true;
    } );
    expect( run.startDisabled ).toBe( true );
  } );

  it( 'startDisabled is true while an alignment runs model test', () => {
    const run = makeRun( { alignments: [nucleotide( { modeltestLoading: true } )] } );
    expect( run.startDisabled ).toBe( true );
  } );

  it( 'startDisabled is true when the partition is incomplete', () => {
    const run = makeRun( {
      alignments: [nucleotide( { partition: { isDefault: false, isComplete: false } } )],
    } );
    expect( run.startDisabled ).toBe( true );
  } );

  it( 'modeltest-ng cannot start on several alignments', () => {
    const run = makeRun( {
      binary: modeltestName,
      alignments: [nucleotide(), nucleotide()],
    } );
    expect( run.startDisabled ).toBe( true );
  } );
} );

describe( 'Run output computeds', () => {
  it( 'output name falls back to the placeholder and reports no notice', async () => {
    const run = makeRun();
    await observeOutput( run );
    expect( read( () => run.outputNameOk ) ).toBe( true );
    expect( read( () => run.outputNameSafe ) ).toBe( 'output' );
    expect( read( () => run.outputFilenameSafe ) ).toBe( 'output.tre' );
    expect( read( () => run.outputNameNotice ) ).toBe( '' );
    expect( checkOutput ).toHaveBeenCalledWith( { outputDir: '/out', outputName: 'output' } );
  } );

  it( 'a taken output name shows the notice with the unused name', async () => {
    checkOutput.mockResolvedValue( {
      ok: false,
      outputNameUnused: 'output_2',
      resultFilenames: ['a.tre'],
    } );
    const run = makeRun();
    await observeOutput( run );
    expect( read( () => run.outputNameOk ) ).toBe( false );
    expect( read( () => run.outputNameSafe ) ).toBe( 'output_2' );
    expect( read( () => run.outputFilenameSafe ) ).toBe( 'output_2.tre' );
    expect( read( () => run.outputNameNotice ) )
      .toBe( "Output with that id already exists. New run will use output id 'output_2'" );
    expect( read( () => run.resultFilenames ) ).toEqual( ['a.tre'] );
  } );

  it( 'haveResult needs result files from the current output directory', async () => {
    checkOutput.mockResolvedValue( { ok: false, outputNameUnused: 'x', resultFilenames: ['a.tre'] } );
    const run = makeRun();
    await observeOutput( run );
    runInAction( () => {
      run.resultDir = '/other';
    } );
    expect( read( () => run.haveResult ) ).toBe( false );
    runInAction( () => {
      run.resultDir = '/out';
    } );
    expect( read( () => run.haveResult ) ).toBe( true );
  } );

  it( 'the settings file path and content use the output name and args', async () => {
    const run = makeRun( { binary: 'raxmlHPC' } );
    run.analysis.setValue( 'FT' );
    await observeOutput( run );
    expect( read( () => run.settingsFilePath ) ).toBe( '/out/RAxML_GUI_Settings_output.txt' );
    const content = read( () => run.settingsFileContent );
    expect( content ).toContain( 'Analysis: Fast tree search' );
    expect( content ).toContain( 'Binary: raxmlHPC version 8.2.12' );
    expect( content ).toContain( 'Results saved to: /out' );
    expect( content ).toContain( `1.) ${read( () => run.args )[0].join( ' ' )}` );
  } );
} );

describe( 'Run command', () => {
  it( 'starts with the binary and carries the paths and output name', async () => {
    const run = makeRun( { binary: 'raxmlHPC' } );
    run.analysis.setValue( 'FT' );
    await observeOutput( run );
    const command = read( () => run.command );
    expect( command.startsWith( 'raxmlHPC ' ) ).toBe( true );
    expect( command ).toContain( '-f E' );
    expect( command ).toContain( '-n output.tre' );
    expect( command ).toContain( '-s /in/a.fasta' );
    expect( command ).toContain( '-w /out' );
  } );

  it( 'changing an option updates the command preview', async () => {
    const run = makeRun( { binary: 'raxmlHPC' } );
    run.analysis.setValue( 'FT' );
    await observeOutput( run );
    const seen = [];
    stops.push( autorun( () => seen.push( run.command ) ) );
    run.analysis.setValue( 'ML' );
    expect( seen[seen.length - 1] ).toContain( '-f d' );
    expect( seen[seen.length - 1] ).not.toBe( seen[0] );
    run.setRandomSeed( 7 );
    expect( seen[seen.length - 1] ).toContain( '-p 7' );
    runInAction( () => {
      run.outputDir = '/elsewhere';
    } );
    expect( seen[seen.length - 1] ).toContain( '-w /elsewhere' );
  } );

  it( 'multiple commands are joined with &&', async () => {
    const run = makeRun( { binary: 'raxmlHPC' } );
    run.analysis.setValue( 'FT' );
    run.branchLength.setValue( true );
    await observeOutput( run );
    const args = read( () => run.args );
    expect( args.length ).toBeGreaterThan( 1 );
    expect( read( () => run.command ).split( ' &&\\\n' ) ).toHaveLength( args.length );
  } );

  it( 'raxml-ng and modeltest-ng build their own command', async () => {
    const run = makeRun( { binary: 'raxml-ng' } );
    await observeOutput( run );
    expect( read( () => run.command ).startsWith( 'raxml-ng ' ) ).toBe( true );
    runInAction( () => {
      run.binary.value = modeltestName;
    } );
    const command = read( () => run.command );
    expect( command.startsWith( `${modeltestName} ` ) ).toBe( true );
    expect( command ).toContain( '-d nt' );
    expect( command ).toContain( '-i /in/a.fasta' );
  } );

  it( 'raxmlSubstitutionModelCmd adds X for estimated frequencies', () => {
    const run = makeRun();
    const before = run.raxmlSubstitutionModelCmd;
    runInAction( () => {
      run.estimatedFrequencies.value = true;
    } );
    expect( run.raxmlSubstitutionModelCmd ).toBe( `${before}X` );
  } );
} );
