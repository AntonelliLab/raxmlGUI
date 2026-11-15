// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Run from './Run';
import { binaries, MAX_NUM_CPUS } from './RunOptions';

const threaded = binaries.find( ( b ) => /PTHREADS/.test( b.name ) );
const plain = binaries.find( ( b ) => b.type === 'raxml' && !/PTHREADS|-ng/.test( b.name ) );

// Run.analysis is a computed that builds a new option on each evaluation, so an
// unobserved run forgets a set analysis value. A kept-alive reaction models the page.
const stops = [];
afterEach( () => stops.splice( 0 ).forEach( ( stop ) => stop() ) );

// The initial binary is raxml-ng on some hosts; most tests start from classic RAxML.
const newRun = () => {
  const run = new Run( null, 1 );
  stops.push( autorun( () => run.analysis ) );
  runInAction( () => {
    run.binary.value = plain.name;
  } );
  return run;
};

// Records every value an autorun sees, so a test can prove it re-ran.
function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

const set = ( option, value ) => runInAction( () => {
  option.value = value;
} );

const setAnalysis = ( run, value ) => set( run.analysis, value );

const addAlignment = ( run, dataType ) => runInAction( () => {
  run.alignments.push( { dataType, taxons: ['a', 'b'], partition: { isDefault: true } } );
} );

describe( 'Binary', () => {
  it( 'defaults to the initial binary and offers every binary', () => {
    const run = new Run( null, 1 );
    expect( run.binary.value ).toBe( binaries.find( ( b ) => b.initial ).name );
    expect( run.binary.options.map( ( o ) => o.value ) ).toEqual(
      binaries.map( ( b ) => b.name ),
    );
  } );

  it( 'derives version and type from the chosen binary and updates reactions', () => {
    const run = newRun();
    const modeltest = binaries.find( ( b ) => b.type === 'modeltest' );
    const { seen, stop } = track( () => [run.binary.version, run.binary.type] );
    set( run.binary, modeltest.name );
    stop();
    expect( seen ).toEqual( [
      [plain.version, plain.type],
      [modeltest.version, modeltest.type],
    ] );
  } );

  it( 'a reaction on the run command updates when the binary changes', () => {
    const run = newRun();
    set( run.binary, plain.name );
    const { seen, stop } = track( () => run.command );
    set( run.binary, threaded.name );
    stop();
    expect( seen[0].startsWith( plain.name ) ).toBe( true );
    expect( seen[1].startsWith( threaded.name ) ).toBe( true );
  } );
} );

describe( 'NumThreads', () => {
  it( 'offers one to the number of cpus', () => {
    const run = newRun();
    expect( run.numThreads.options.map( ( o ) => o.value ) ).toEqual(
      Array.from( { length: MAX_NUM_CPUS }, ( _, i ) => i + 1 ),
    );
  } );

  it( 'is available with a PTHREADS binary and not otherwise', () => {
    const run = newRun();
    const { seen, stop } = track( () => run.numThreads.notAvailable );
    set( run.binary, threaded.name );
    set( run.binary, plain.name );
    stop();
    expect( seen ).toEqual( [...seen.slice( 0, 1 ), false, true] );
  } );

  it( 'is available with modeltest-ng', () => {
    const run = newRun();
    set( run.binary, 'modeltest-ng' );
    expect( run.numThreads.notAvailable ).toBe( false );
  } );

  it( 'a reaction on the run command updates when the thread count changes', () => {
    const run = newRun();
    set( run.binary, threaded.name );
    setAnalysis( run, 'FT' );
    const { seen, stop } = track( () => run.command );
    set( run.numThreads, 4 );
    stop();
    expect( seen[0] ).toContain( '-T 2 ' );
    expect( seen[1] ).toContain( '-T 4 ' );
  } );
} );

describe( 'Analysis and RaxmlNgAnalysis', () => {
  it( 'uses the RAxML analysis list by default', () => {
    const run = newRun();
    expect( run.usesRaxmlNg ).toBe( false );
    expect( run.analysis.value ).toBe( 'ML+rBS' );
    expect( run.analysis.options.map( ( o ) => o.value ) ).toEqual(
      ['FT', 'ML', 'ML+rBS', 'ML+tBS', 'BS+con', 'AS', 'PD', 'RBS'],
    );
    expect( run.analysisOption.title ).toBe( 'ML + rapid bootstrap' );
  } );

  it( 'uses the RAxML-NG analysis list with a raxml-ng binary', () => {
    const run = newRun();
    set( run.binary, 'raxml-ng' );
    expect( run.analysis.value ).toBe( 'ML+TBE+con' );
    expect( run.analysis.options.map( ( o ) => o.value ) ).toEqual(
      ['SC', 'CC', 'TI', 'ML+tBS+con', 'ML+TBE+con', 'AS'],
    );
    expect( run.analysisOption.title ).toBe(
      'ML + transfer bootstrap expectation + consensus',
    );
  } );

  it( 'a reaction on analysisOption updates when the analysis value changes', () => {
    const run = newRun();
    const { seen, stop } = track( () => run.analysisOption.title );
    setAnalysis( run, 'FT' );
    stop();
    expect( seen ).toEqual( ['ML + rapid bootstrap', 'Fast tree search'] );
  } );

  it( 'a reaction on analysisOption updates when the RAxML-NG analysis value changes', () => {
    const run = newRun();
    set( run.binary, 'raxml-ng' );
    const { seen, stop } = track( () => run.analysisOption.title );
    setAnalysis( run, 'TI' );
    stop();
    expect( seen ).toEqual( [
      'ML + transfer bootstrap expectation + consensus',
      'ML tree inference',
    ] );
  } );
} );

describe( 'analysis dependent availability', () => {
  const cases = [
    // [option name, analyses that use it, analyses that do not]
    ['numRuns', ['ML', 'ML+tBS'], ['FT', 'ML+rBS', 'RBS']],
    ['numRepetitions', ['ML+rBS', 'ML+tBS', 'BS+con'], ['FT', 'ML', 'PD']],
    ['branchLength', ['FT', 'ML+rBS', 'ML+tBS', 'BS+con'], ['ML', 'PD', 'AS']],
    ['sHlike', ['FT', 'ML'], ['ML+rBS', 'RBS']],
    ['combinedOutput', ['ML'], ['FT', 'ML+rBS']],
    ['startingTree', ['PD'], ['FT', 'ML']],
  ];

  it.each( cases )( '%s is available only for its analyses', ( name, used, unused ) => {
    const run = newRun();
    const { seen, stop } = track( () => run[name].notAvailable );
    used.forEach( ( value ) => {
      setAnalysis( run, value );
      expect( run[name].notAvailable ).toBe( false );
    } );
    unused.forEach( ( value ) => {
      setAnalysis( run, value );
      expect( run[name].notAvailable ).toBe( true );
    } );
    stop();
    expect( seen ).toContain( true );
    expect( seen ).toContain( false );
  } );

  it( 'numRepetitionsNg is available for the bootstrap analyses of RAxML-NG', () => {
    const run = newRun();
    set( run.binary, 'raxml-ng' );
    const { seen, stop } = track( () => run.numRepetitionsNg.notAvailable );
    setAnalysis( run, 'TI' );
    setAnalysis( run, 'ML+tBS+con' );
    stop();
    expect( seen ).toEqual( [false, true, false] );
  } );

  it( 'numRuns is available for RAxML-NG tree inference', () => {
    const run = newRun();
    set( run.binary, 'raxml-ng' );
    setAnalysis( run, 'TI' );
    expect( run.numRuns.notAvailable ).toBe( false );
    setAnalysis( run, 'SC' );
    expect( run.numRuns.notAvailable ).toBe( true );
  } );
} );

describe( 'option lists', () => {
  it( 'lists the values the run offers', () => {
    const run = newRun();
    const values = ( option ) => option.options.map( ( o ) => o.value );
    expect( values( run.numRuns ) ).toEqual( [1, 10, 20, 50, 100, 500] );
    expect( values( run.numRepetitions ) ).toEqual(
      [100, 200, 500, 1000, 10000, 'autoMR', 'autoMRE', 'autoMRE_IGN', 'autoFC'],
    );
    expect( values( run.numRepetitionsNg ) ).toEqual(
      [100, 200, 500, 1000, 10000, 'autoMRE'],
    );
    expect( values( run.startingTree ) ).toEqual( ['Maximum parsimony', 'User defined'] );
    expect( values( run.baseFrequencies ) ).toEqual( ['default', 'F', 'X'] );
    expect( values( run.aaMatrixName ).length ).toBeGreaterThan( 0 );
    expect( values( run.multistateModel ).length ).toBeGreaterThan( 0 );
  } );
} );

describe( 'CombinedOutput', () => {
  it( 'is used only when checked and available', () => {
    const run = newRun();
    setAnalysis( run, 'ML' );
    const { seen, stop } = track( () => run.combinedOutput.isUsed );
    set( run.combinedOutput, true );
    setAnalysis( run, 'FT' );
    stop();
    expect( seen.map( Boolean ) ).toEqual( [false, true, false] );
  } );
} );

describe( 'option values reach the run command', () => {
  it( 'branchLength and sHlike add their follow-up commands', () => {
    const run = newRun();
    set( run.binary, plain.name );
    setAnalysis( run, 'FT' );
    const { seen, stop } = track( () => run.command );
    set( run.branchLength, true );
    set( run.sHlike, true );
    stop();
    const steps = ( command ) => command.split( ' &&\\\n' ).length;
    expect( seen.map( steps ) ).toEqual( [1, 2, 3] );
  } );

  it( 'numRuns and numRepetitions change the command', () => {
    const run = newRun();
    set( run.binary, plain.name );
    setAnalysis( run, 'ML' );
    const runs = track( () => run.command );
    set( run.numRuns, 10 );
    runs.stop();
    expect( runs.seen[0] ).toContain( '-N 1 ' );
    expect( runs.seen[1] ).toContain( '-N 10 ' );

    setAnalysis( run, 'ML+rBS' );
    const reps = track( () => run.command );
    set( run.numRepetitions, 200 );
    reps.stop();
    expect( reps.seen[0] ).toContain( '100' );
    expect( reps.seen[1] ).toContain( '200' );
  } );

  it( 'numRepetitionsNg changes the RAxML-NG command', () => {
    const run = newRun();
    set( run.binary, 'raxml-ng' );
    setAnalysis( run, 'ML+tBS+con' );
    const { seen, stop } = track( () => run.command );
    set( run.numRepetitionsNg, 500 );
    stop();
    expect( seen[0] ).toContain( '100' );
    expect( seen[1] ).toContain( '500' );
  } );
} );

describe( 'data type options', () => {
  it( 'AAMatrixName is available only for protein', () => {
    const run = newRun();
    const { seen, stop } = track( () => run.aaMatrixName.notAvailable );
    addAlignment( run, 'protein' );
    stop();
    expect( seen ).toEqual( [true, false] );
    expect( run.aaMatrixName.value ).toBe( 'BLOSUM62' );
  } );


  it( 'EstimatedFrequencies is unavailable for protein and RAxML-NG', () => {
    const run = newRun();
    set( run.binary, plain.name );
    const { seen, stop } = track( () => run.estimatedFrequencies.notAvailable );
    addAlignment( run, 'protein' );
    stop();
    expect( seen ).toEqual( [false, true] );
    const ng = newRun();
    set( ng.binary, 'raxml-ng' );
    expect( ng.estimatedFrequencies.notAvailable ).toBe( true );
  } );

  it( 'BaseFrequencies is available only for protein with RAxML', () => {
    const run = newRun();
    set( run.binary, plain.name );
    const { seen, stop } = track( () => run.baseFrequencies.notAvailable );
    addAlignment( run, 'protein' );
    set( run.binary, 'raxml-ng' );
    stop();
    expect( seen ).toEqual( [true, false, true] );
  } );

  it( 'MultistateModel is available only for multistate with RAxML', () => {
    const run = newRun();
    set( run.binary, plain.name );
    const { seen, stop } = track( () => run.multistateModel.notAvailable );
    addAlignment( run, 'multistate' );
    set( run.binary, 'raxml-ng' );
    stop();
    expect( seen ).toEqual( [true, false, true] );
    expect( run.multistateModel.value ).toBe( 'GTR' );
  } );

  it( 'value changes of the data type options reach reactions', () => {
    const run = newRun();
    set( run.binary, plain.name );
    addAlignment( run, 'multistate' );
    setAnalysis( run, 'FT' );
    const { seen, stop } = track( () => run.command );
    set( run.multistateModel, 'ORDERED' );
    stop();
    expect( seen[0] ).toContain( '-K GTR' );
    expect( seen[1] ).toContain( '-K ORDERED' );
  } );

  it( 'EstimatedFrequencies adds X to the model for nucleotide data', () => {
    const run = newRun();
    addAlignment( run, 'nucleotide' );
    const { seen, stop } = track( () => run.raxmlSubstitutionModelCmd );
    set( run.estimatedFrequencies, true );
    stop();
    expect( seen[1] ).toBe( `${seen[0]}X` );
  } );

  it( 'BaseFrequencies adds its suffix to the model for protein data', () => {
    const run = newRun();
    addAlignment( run, 'protein' );
    const { seen, stop } = track( () => run.raxmlSubstitutionModelCmd );
    set( run.baseFrequencies, 'F' );
    set( run.baseFrequencies, 'default' );
    stop();
    expect( seen[1] ).toBe( `${seen[0]}F` );
    expect( seen[2] ).toBe( seen[0] );
  } );

  // No page store computed reads these two values, so the reaction reads them itself.
  it( 'a reaction on StartingTree and AAMatrixName values updates when they are set', () => {
    const run = newRun();
    const { seen, stop } = track( () => [run.startingTree.value, run.aaMatrixName.value] );
    set( run.startingTree, 'User defined' );
    set( run.aaMatrixName, 'WAG' );
    stop();
    expect( seen ).toEqual( [
      ['Maximum parsimony', 'BLOSUM62'],
      ['User defined', 'BLOSUM62'],
      ['User defined', 'WAG'],
    ] );
  } );
} );
