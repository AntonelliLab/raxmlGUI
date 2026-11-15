// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Run from './Run';

// Run's constructor subscribes to bridge events; a no-op stub is enough here.
beforeEach( () => {
  window.rendererBridge = new Proxy( {}, {
    get: ( _, name ) => {
      if ( name === 'getVersion' ) {
        return () => Promise.resolve( '2.0.0' );
      }
      // A load that never settles keeps the test in control of dataType.
      return name === 'parseAlignment'
        ? () => new Promise( () => {} )
        : () => () => {};
    },
  } );
} );

const binaryNamed = ( run, prefix ) => run.binary.options
  .map( ( o ) => o.value ).find( ( v ) => v.startsWith( prefix ) );
const ngName = () => binaryNamed( new Run( { onError() {} }, 1 ), 'raxml-ng' );

// The default binary depends on the host platform, so pin a classic RAxML one.
function newRun() {
  const run = new Run( { onError() {} }, 1 );
  run.binary.setValue( binaryNamed( run, 'raxmlHPC' ) );
  return run;
}

function makeRun( dataType = 'nucleotide' ) {
  const run = newRun();
  run.addAlignments( [{ path: '/data/a.fasta' }] );
  runInAction( () => {
    run.alignments[0].dataType = dataType;
  } );
  return run;
}

// Records every value an autorun sees, so a test can prove it re-ran.
function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

const noAlignmentRun = newRun;

describe( 'SubstitutionMatrix', () => {
  it( 'has no options without alignments, then lists them per data type', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionMatrix.options );
    expect( seen[0] ).toEqual( [] );
    run.addAlignments( [{ path: '/a.fasta' }] );
    runInAction( () => {
      run.alignments[0].dataType = 'nucleotide';
    } );
    expect( run.substitutionMatrix.options ).toEqual( [
      { value: 'JC', title: 'JC + GAMMA' },
      { value: 'K80', title: 'K80 + GAMMA' },
      { value: 'HKY', title: 'HKY + GAMMA' },
      { value: 'GTR', title: 'GTR' },
    ] );
    expect( seen[seen.length - 1] ).toHaveLength( 4 );
    stop();
  } );

  it( 'has no options for a data type without settings', () => {
    const run = makeRun( 'unknown' );
    expect( run.substitutionMatrix.options ).toEqual( [] );
  } );

  it( 'is not available without alignments, for other data types or raxml-ng', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionMatrix.notAvailable );
    expect( seen[0] ).toBe( true );
    run.addAlignments( [{ path: '/a.fasta' }] );
    runInAction( () => {
      run.alignments[0].dataType = 'nucleotide';
    } );
    expect( run.substitutionMatrix.notAvailable ).toBe( false );
    for ( const type of ['binary', 'protein', 'multistate'] ) {
      runInAction( () => {
        run.alignments[0].dataType = type;
      } );
      expect( run.substitutionMatrix.notAvailable ).toBe( true );
    }
    runInAction( () => {
      run.alignments[0].dataType = 'nucleotide';
    } );
    run.binary.setValue( ngName() );
    expect( run.substitutionMatrix.notAvailable ).toBe( true );
    expect( seen ).toContain( false );
    stop();
  } );

  it( 'maps the data type and value to the command value', () => {
    const run = makeRun( 'nucleotide' );
    const { seen, stop } = track( () => run.substitutionMatrix.cmdValue );
    expect( seen[0] ).toBe( 'GTR' );
    for ( const [value, cmd] of [['JC', 'GTR'], ['K80', 'GTR'], ['HKY', 'GTR']] ) {
      run.substitutionMatrix.setValue( value );
      expect( run.substitutionMatrix.cmdValue ).toBe( cmd );
    }
    for ( const [type, cmd] of [['binary', 'BIN'], ['protein', 'PROT'], ['multistate', 'MULTI']] ) {
      runInAction( () => {
        run.alignments[0].dataType = type;
      } );
      expect( run.substitutionMatrix.cmdValue ).toBe( cmd );
    }
    expect( seen ).toEqual( ['GTR', 'BIN', 'PROT', 'MULTI'] );
    stop();
  } );

  it( 'passes the value through for a mixed run', () => {
    const run = makeRun( 'mixed' );
    run.substitutionMatrix.setValue( 'BIN' );
    expect( run.substitutionMatrix.cmdValue ).toBe( 'BIN' );
  } );

  it( 'gives the extra raxml-ng flag and notGTR per value', () => {
    const run = makeRun();
    const matrix = run.substitutionMatrix;
    const flags = track( () => matrix.extraCmdValue );
    const notGTR = track( () => matrix.notGTR );
    expect( flags.seen[0] ).toBe( '' );
    expect( notGTR.seen[0] ).toBe( false );
    for ( const [value, flag] of [['JC', '--JC69'], ['K80', '--K80'], ['HKY', '--HKY85'], ['GTR', '']] ) {
      matrix.setValue( value );
      expect( matrix.extraCmdValue ).toBe( flag );
      expect( matrix.notGTR ).toBe( value !== 'GTR' );
    }
    expect( flags.seen ).toEqual( ['', '--JC69', '--K80', '--HKY85', ''] );
    expect( notGTR.seen ).toEqual( [false, true, false] );
    flags.stop();
    notGTR.stop();
  } );
} );

describe( 'SubstitutionRate', () => {
  it( 'lists rate options once there are alignments', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionRate.options );
    expect( seen[0] ).toEqual( [] );
    run.addAlignments( [{ path: '/a.fasta' }] );
    expect( run.substitutionRate.options ).toEqual( [
      { value: 'CAT', title: 'CAT' },
      { value: 'GAMMA', title: 'GAMMA' },
    ] );
    expect( seen ).toHaveLength( 2 );
    stop();
  } );

  it( 'is unavailable without alignments, for non-GTR nucleotide or raxml-ng', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionRate.notAvailable );
    expect( seen[0] ).toBe( true );
    run.addAlignments( [{ path: '/a.fasta' }] );
    runInAction( () => {
      run.alignments[0].dataType = 'nucleotide';
    } );
    expect( run.substitutionRate.notAvailable ).toBe( false );
    run.substitutionMatrix.setValue( 'HKY' );
    expect( run.substitutionRate.notAvailable ).toBe( true );
    runInAction( () => {
      run.alignments[0].dataType = 'protein';
    } );
    expect( run.substitutionRate.notAvailable ).toBe( false );
    run.binary.setValue( ngName() );
    expect( run.substitutionRate.notAvailable ).toBe( true );
    expect( seen ).toEqual( [true, false, true, false, true] );
    stop();
  } );

  it( 'forces GAMMA unless the matrix is GTR, and reports CAT', () => {
    const run = makeRun();
    const rate = run.substitutionRate;
    const cmd = track( () => rate.cmdValue );
    const cat = track( () => rate.isCAT );
    expect( cmd.seen[0] ).toBe( 'GAMMA' );
    expect( cat.seen[0] ).toBe( false );
    rate.setValue( 'CAT' );
    expect( rate.cmdValue ).toBe( 'CAT' );
    expect( rate.isCAT ).toBe( true );
    run.substitutionMatrix.setValue( 'K80' );
    expect( rate.cmdValue ).toBe( 'GAMMA' );
    expect( rate.isCAT ).toBe( true );
    expect( cmd.seen ).toEqual( ['GAMMA', 'CAT', 'GAMMA'] );
    expect( cat.seen ).toEqual( [false, true] );
    cmd.stop();
    cat.stop();
  } );
} );

describe( 'SubstitutionI', () => {
  it( 'lists the invariant-sites options once there are alignments', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionI.options );
    expect( seen[0] ).toEqual( [] );
    run.addAlignments( [{ path: '/a.fasta' }] );
    expect( run.substitutionI.options ).toEqual( [
      { value: 'none', title: 'none' },
      { value: '+I (ML estimate)', title: '+I (ML estimate)' },
    ] );
    expect( seen ).toHaveLength( 2 );
    stop();
  } );

  it( 'is unavailable without alignments, with ascertainment set or raxml-ng', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionI.notAvailable );
    expect( seen[0] ).toBe( true );
    run.addAlignments( [{ path: '/a.fasta' }] );
    expect( run.substitutionI.notAvailable ).toBe( false );
    run.substitutionAscertainment.setValue( "Lewis' method" );
    expect( run.substitutionI.notAvailable ).toBe( true );
    run.substitutionAscertainment.setValue( 'none' );
    run.binary.setValue( ngName() );
    expect( run.substitutionI.notAvailable ).toBe( true );
    expect( seen ).toEqual( [true, false, true, false, true] );
    stop();
  } );

  it( 'gives I and isSet once a value is chosen', () => {
    const run = makeRun();
    const cmd = track( () => run.substitutionI.cmdValue );
    const set = track( () => run.substitutionI.isSet );
    expect( cmd.seen ).toEqual( [''] );
    expect( set.seen ).toEqual( [false] );
    run.substitutionI.setValue( '+I (ML estimate)' );
    expect( cmd.seen ).toEqual( ['', 'I'] );
    expect( set.seen ).toEqual( [false, true] );
    cmd.stop();
    set.stop();
  } );
} );

describe( 'SubstitutionAscertainment', () => {
  it( 'lists the ascertainment options once there are alignments', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionAscertainment.options );
    expect( seen[0] ).toEqual( [] );
    run.addAlignments( [{ path: '/a.fasta' }] );
    expect( run.substitutionAscertainment.options.map( ( o ) => o.value ) ).toEqual( [
      'none',
      "Lewis' method",
      "Felsenstein's method",
      "Stamatakis' method",
    ] );
    expect( seen ).toHaveLength( 2 );
    stop();
  } );

  it( 'is unavailable without alignments, mixed data, invariant sites, +I or raxml-ng', () => {
    const run = noAlignmentRun();
    const { seen, stop } = track( () => run.substitutionAscertainment.notAvailable );
    expect( seen[0] ).toBe( true );
    run.addAlignments( [{ path: '/a.fasta' }] );
    runInAction( () => {
      run.alignments[0].dataType = 'nucleotide';
    } );
    expect( run.substitutionAscertainment.notAvailable ).toBe( false );
    runInAction( () => {
      run.alignments[0].dataType = 'mixed';
    } );
    expect( run.substitutionAscertainment.notAvailable ).toBe( true );
    runInAction( () => {
      run.alignments[0].dataType = 'nucleotide';
    } );
    runInAction( () => {
      run.alignments[0].hasInvariantSites = true;
    } );
    expect( run.substitutionAscertainment.notAvailable ).toBe( true );
    runInAction( () => {
      run.alignments[0].hasInvariantSites = false;
    } );
    run.substitutionI.setValue( '+I (ML estimate)' );
    expect( run.substitutionAscertainment.notAvailable ).toBe( true );
    run.substitutionI.setValue( 'none' );
    run.binary.setValue( ngName() );
    expect( run.substitutionAscertainment.notAvailable ).toBe( true );
    expect( seen ).toEqual( [true, false, true, false, true, false, true, false, true] );
    stop();
  } );

  it( 'gives ASC_, the raxml-ng flag and isSet per value', () => {
    const run = makeRun();
    const asc = run.substitutionAscertainment;
    const cmd = track( () => asc.cmdValue );
    const extra = track( () => asc.extraCmdValue );
    const set = track( () => asc.isSet );
    expect( [cmd.seen[0], extra.seen[0], set.seen[0]] ).toEqual( ['', '', false] );
    for ( const [value, flag] of [
      [ "Lewis' method", '--asc-corr=lewis' ],
      [ "Felsenstein's method", '--asc-corr=felsenstein' ],
      [ "Stamatakis' method", '--asc-corr=stamatakis' ],
    ] ) {
      asc.setValue( value );
      expect( asc.cmdValue ).toBe( 'ASC_' );
      expect( asc.extraCmdValue ).toBe( flag );
      expect( asc.isSet ).toBe( true );
    }
    asc.setValue( 'none' );
    expect( [asc.cmdValue, asc.extraCmdValue, asc.isSet] ).toEqual( ['', '', false] );
    expect( extra.seen ).toEqual( [
      '', '--asc-corr=lewis', '--asc-corr=felsenstein', '--asc-corr=stamatakis', '',
    ] );
    expect( cmd.seen ).toEqual( ['', 'ASC_', ''] );
    expect( set.seen ).toEqual( [false, true, false] );
    cmd.stop();
    extra.stop();
    set.stop();
  } );
} );
