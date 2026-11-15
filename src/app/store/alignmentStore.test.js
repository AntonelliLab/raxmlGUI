// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { runInAction } from 'mobx';

import { stubBridge as sharedStubBridge, track } from '../../../jest/storeBridge';

import Run from './Run';
import { runEvents } from './StoreBase';

let bridge;
let listeners;
let fire;

// Alignment construction subscribes to bridge events and parses.
function stubBridge( extra = {} ) {
  ( { bridge, listeners, fire } = sharedStubBridge( {
    parseAlignment: () => new Promise( () => {} ),
    startModelSelection: jest.fn( async () => {} ),
    cancelModelSelection: jest.fn(),
    ...extra,
  } ) );
}

function setup( { onError = () => {}, path = '/data/primates.fasta' } = {} ) {
  const run = new Run( { onError }, 7 );
  run.addAlignments( [{ path }] );
  return { run, alignment: run.alignments[0] };
}

function set( object, values ) {
  runInAction( () => Object.assign( object, values ) );
}

const parsed = {
  sequences: [
    { taxon: 'Homo', code: 'ACGT' },
    { taxon: 'Mus', code: 'ACGA' },
  ],
  fileFormat: 'fasta',
  numSequences: 2,
  length: 4,
  dataType: 'dna',
  hasInvariantSites: true,
  typecheckingComplete: true,
};

beforeEach( () => stubBridge() );

describe( 'Alignment observable fields update the page store', () => {
  it( 'path updates id, name, dir, base, filename and ok', () => {
    const { alignment } = setup();
    const { seen, stop } = track( () => [
      alignment.id,
      alignment.name,
      alignment.dir,
      alignment.base,
      alignment.filename,
      alignment.ok,
    ] );
    set( alignment, { path: '/other/apes.fasta' } );
    expect( seen[seen.length - 1][0] ).toBe( '7_/other/apes.fasta' );
    expect( seen.length ).toBe( 2 );
    expect( alignment.ok ).toBe( true );
    set( alignment, { path: '' } );
    expect( alignment.ok ).toBe( false );
    stop();
  } );

  it( 'error, parsingComplete, typecheckingComplete and checkRunComplete drive status', () => {
    const { alignment } = setup();
    const { seen, stop } = track( () => alignment.status );
    set( alignment, { parsingComplete: true } );
    set( alignment, { typecheckingComplete: true } );
    set( alignment, { checkRunComplete: true } );
    set( alignment, { error: 'bad file' } );
    expect( seen ).toEqual( [
      'Parsing...',
      'Type checking...',
      'Check run with RAxML...',
      'ok',
      'Error: bad file',
    ] );
    stop();
  } );

  it( 'sequences update taxons and the run taxons', () => {
    const { run, alignment } = setup();
    const { seen, stop } = track( () => run.taxons );
    expect( alignment.taxons ).toEqual( [] );
    set( alignment, { sequences: parsed.sequences } );
    expect( alignment.taxons ).toEqual( ['Homo', 'Mus'] );
    expect( seen ).toEqual( [[], ['Homo', 'Mus']] );
    stop();
  } );

  it( 'length updates numSites and getSequenceCode padding', () => {
    const { alignment } = setup();
    const { seen, stop } = track( () => alignment.numSites );
    set( alignment, { sequences: parsed.sequences, length: 4 } );
    expect( seen ).toEqual( [0, 4] );
    expect( alignment.getSequenceCode( 'Homo' ) ).toBe( 'ACGT' );
    expect( alignment.getSequenceCode( 'Missing' ) ).toBe( '----' );
    stop();
  } );

  it( 'dataType updates partitionType, modelTestCanRun and modelExtra', () => {
    const { run, alignment } = setup();
    runInAction( () => {
      run.binary.value = 'raxml-ng';
    } );
    runInAction( () => {
      run.binary.value = run.binary.options.find(
        ( { value } ) => !value.includes( 'raxml-ng' ),
      ).value;
    } );
    expect( run.usesRaxmlNg ).toBe( false );
    const { seen, stop } = track( () => [
      alignment.partitionType,
      alignment.modelTestCanRun,
      alignment.modelExtra && alignment.modelExtra.value,
    ] );
    const types = {
      dna: ['DNA', false, null],
      nucleotide: ['DNA', true, null],
      protein: ['BLOSUM62', true, 'BLOSUM62'],
      binary: ['BIN', false, null],
      multistate: ['MULTI', false, null],
      mixed: ['mixed', false, null],
    };
    for ( const [dataType, expected] of Object.entries( types ) ) {
      set( alignment, { dataType } );
      expect( seen[seen.length - 1] ).toEqual( expected );
    }
    stop();
  } );

  it( 'aaMatrixName updates partitionType and modelExtra, and onChangeAAMatrixName sets it', () => {
    const { run, alignment } = setup();
    set( run.binary, {
      value: run.binary.options.find( ( { value } ) => !value.includes( 'raxml-ng' ) ).value,
    } );
    set( alignment, { dataType: 'protein' } );
    const { seen, stop } = track( () => [
      alignment.partitionType,
      alignment.modelExtra?.value,
    ] );
    alignment.modelExtra.onChange( 'WAG' );
    expect( alignment.aaMatrixName ).toBe( 'WAG' );
    expect( seen[seen.length - 1] ).toEqual( ['WAG', 'WAG'] );
    stop();
  } );

  it( 'modelExtra is null for protein with raxml-ng', () => {
    const { run, alignment } = setup();
    set( alignment, { dataType: 'protein' } );
    const ng = run.binary.options.find( ( { value } ) => value.includes( 'raxml-ng' ) );
    const old = run.binary.options.find( ( { value } ) => !value.includes( 'raxml-ng' ) );
    set( run.binary, { value: old.value } );
    const { seen, stop } = track( () => alignment.modelExtra?.value );
    set( run.binary, { value: ng.value } );
    expect( run.usesRaxmlNg ).toBe( true );
    expect( seen ).toEqual( ['BLOSUM62', undefined] );
    stop();
  } );

  it( 'partitionText and the partition flag update showPartition', () => {
    const { run, alignment } = setup();
    const { seen, stop } = track( () => alignment.showPartition );
    alignment.setShowPartition();
    expect( run.showPartitionFor ).toBe( alignment );
    alignment.hidePartition();
    alignment.setShowPartition( true );
    alignment.setShowPartition( false );
    expect( seen ).toEqual( [false, true, false, true, false] );
    alignment.setPartitionText( 'DNA, a = 1-4' );
    expect( alignment.partitionText ).toBe( 'DNA, a = 1-4' );
    stop();
  } );

  it( 'dataType, length and aaMatrixName update partitionFileContent', () => {
    const { run, alignment } = setup();
    set( alignment, { dataType: 'nucleotide', length: 10 } );
    const ng = run.binary.options.find( ( { value } ) => value.includes( 'raxml-ng' ) );
    const old = run.binary.options.find( ( { value } ) => !value.includes( 'raxml-ng' ) );
    set( run.binary, { value: old.value } );
    const { seen, stop } = track( () => alignment.partitionFileContent );
    set( alignment, { length: 12 } );
    set( alignment, { dataType: 'protein' } );
    set( alignment, { aaMatrixName: 'JTT' } );
    expect( seen ).toEqual( [
      'DNA, nucleotide_0 = 1-10\n',
      'DNA, nucleotide_0 = 1-12\n',
      'BLOSUM62, protein_0 = 1-12\n',
      'JTT, protein_0 = 1-12\n',
    ] );
    set( run.binary, { value: ng.value } );
    expect( alignment.partitionFileContent ).toBe(
      `${alignment.ngSubstitutionModelCmd}, protein_0 = 1-12\n`,
    );
    stop();
  } );

  it( 'the model options update ngSubstitutionModelCmd', () => {
    const { alignment } = setup();
    set( alignment, { dataType: 'nucleotide' } );
    alignment.substitutionModel.setValue( 'GTR' );
    const { seen, stop } = track( () => alignment.ngSubstitutionModelCmd );
    alignment.ngStationaryFrequencies.setValue( '+FO' );
    alignment.ngInvariantSites.setValue( '+I' );
    alignment.ngRateHeterogeneity.setValue( '+G' );
    alignment.ngAscertainmentBias.setValue( '+ASC_LEWIS' );
    expect( seen ).toEqual( [
      'GTR',
      'GTR+FO',
      'GTR+FO+I',
      'GTR+FO+I+G',
      'GTR+FO+I+G+ASC_LEWIS',
    ] );
    stop();
  } );

  it( 'multistateNumber updates the multistate model command', () => {
    const { alignment } = setup();
    set( alignment, { dataType: 'multistate' } );
    alignment.substitutionModel.setValue( 'MULTIx_GTR' );
    const { seen, stop } = track( () => alignment.ngSubstitutionModelCmd );
    alignment.multistateNumber.setValue( 5 );
    expect( seen[0] ).toContain( 'MULTI' );
    expect( seen[seen.length - 1] ).toBe( alignment.substitutionModel.value.replace( 'x', '5' ) + '' );
    stop();
  } );

  it( 'hasInvariantSites updates ascertainment bias availability', () => {
    const { run, alignment } = setup();
    const ng = run.binary.options.find( ( { value } ) => value.includes( 'raxml-ng' ) );
    set( run.binary, { value: ng.value } );
    const { seen, stop } = track( () => alignment.ngAscertainmentBias.notAvailable );
    set( alignment, { hasInvariantSites: true } );
    expect( seen ).toEqual( [false, true] );
    stop();
  } );

  it( 'modified fields update the run converted and modified flags', () => {
    const { run, alignment } = setup();
    const { seen, stop } = track( () => [run.converted, run.modified] );
    set( alignment, { converted: true } );
    set( alignment, { modified: true } );
    const last = seen[seen.length - 1];
    expect( last ).toEqual( [true, true] );
    expect( seen.length ).toBeGreaterThanOrEqual( 3 );
    stop();
  } );

  it( 'the dialog and snack flags are set and cleared by clearModified', () => {
    const { alignment } = setup();
    const { seen, stop } = track( () => [alignment.showModifiedSnack, alignment.showModifiedDialog] );
    set( alignment, { showModifiedSnack: true, showModifiedDialog: true } );
    alignment.clearModified();
    expect( seen ).toEqual( [[false, false], [true, true], [false, false]] );
    stop();
  } );

  it( 'dataType updates the final alignment data type of the run', () => {
    const { run, alignment } = setup();
    const { seen, stop } = track( () => run.dataType );
    set( alignment, { dataType: 'protein' } );
    expect( run.dataType ).toBe( 'protein' );
    expect( seen[0] ).not.toBe( 'protein' );
    expect( seen[seen.length - 1] ).toBe( 'protein' );
    stop();
  } );

  it( 'the remaining observable fields can be set and read back', () => {
    const { alignment } = setup();
    const values = {
      size: 1,
      fileFormat: 'fasta',
      convertedFrom: 'nexus',
      modificationMessages: ['a'],
      numSequences: 3,
      checkRunData: 'out',
      checkRunSuccess: true,
      loading: true,
      modeltestLoading: true,
      partitionText: 'x',
    };
    const { seen, stop } = track( () => JSON.stringify( Object.keys( values ).map( ( k ) => alignment[k] ) ) );
    set( alignment, values );
    for ( const [key, value] of Object.entries( values ) ) {
      expect( alignment[key] ).toEqual( value );
    }
    expect( seen.length ).toBe( 2 );
    stop();
  } );
} );

describe( 'Alignment onChangeModel', () => {
  it( 'sets model from the event target', () => {
    const { alignment } = setup();
    alignment.onChangeModel( { target: { value: 'GTR' } } );
    expect( alignment.model ).toBe( 'GTR' );
  } );
} );

describe( 'Alignment stdout and stderr', () => {
  it( 'appends content for its own id only', () => {
    const { run, alignment } = setup();
    const { seen, stop } = track( () => [run.stdout, run.stderr] );
    fire( runEvents.onRunStdout, { id: 'other', content: 'no' } );
    fire( runEvents.onRunStdout, { id: alignment.id, content: 'a' } );
    fire( runEvents.onRunStdout, { id: alignment.id, content: 'b' } );
    fire( runEvents.onRunStderr, { id: alignment.id, content: 'e' } );
    expect( run.stdout ).toBe( 'ab' );
    expect( run.stderr ).toBe( 'e' );
    expect( seen[seen.length - 1] ).toEqual( ['ab', 'e'] );
    stop();
  } );
} );

describe( 'Alignment constructor', () => {
  it( 'builds the option objects and the partition', () => {
    const { alignment } = setup();
    expect( alignment.substitutionModel.run ).toBe( alignment.run );
    expect( alignment.multistateNumber ).toBeDefined();
    expect( alignment.partition ).toBeDefined();
    expect( typeof alignment.modeltestDisabled ).toBe( 'boolean' );
  } );

  it( 'disables modeltest on Windows 7', () => {
    window.rendererBridge = { ...bridge, host: { ...bridge.host, windows: true, release: '6.1.7601' } };
    jest.isolateModules( () => {
      const IsolatedRun = require( './Run' ).default;
      const run = new IsolatedRun( {}, 1 );
      run.addAlignments( [{ path: '/a.fasta' }] );
      expect( run.alignments[0].modeltestDisabled ).toBe( true );
    } );
  } );
} );

describe( 'Alignment loadParsedAlignment', () => {
  async function load( parse, run ) {
    let pending;
    stubBridge( {
      parseAlignment: ( ...args ) => {
        pending = parse( ...args );
        return pending;
      },
    } );
    const result = setup();
    await pending.catch( () => {} );
    return result;
  }

  it( 'writes the parsed fields', async () => {
    const parseAlignment = jest.fn( async () => ( { alignment: parsed, change: null } ) );
    const { alignment } = await load( parseAlignment );
    expect( parseAlignment ).toHaveBeenCalledWith( '7_/data/primates.fasta', '/data/primates.fasta' );
    expect( alignment.sequences ).toEqual( parsed.sequences );
    expect( alignment.numSequences ).toBe( 2 );
    expect( alignment.parsingComplete ).toBe( true );
    expect( alignment.loading ).toBe( false );
    expect( alignment.status ).toBe( 'Check run with RAxML...' );
  } );

  it( 'writes the substitution model default and the substitution matrix default', async () => {
    const { run, alignment } = await load( async () => ( {
      alignment: { ...parsed, dataType: 'protein' },
      change: null,
    } ) );
    expect( alignment.substitutionModel.value ).toBe( 'Blosum62' );
    expect( run.substitutionMatrix.value ).toBe( 'BLOSUM62' );
  } );

  it( 'keeps the substitution matrix when the run data type is unchanged', async () => {
    const { run, alignment } = await load( async () => ( {
      alignment: { ...parsed, dataType: 'dna' },
      change: null,
    } ) );
    expect( run.substitutionMatrix.value ).toBe( 'GTR' );
    expect( alignment.substitutionModel.value ).toBe( 'GTR' );
  } );

  it( 'a modification with messages shows the dialog', async () => {
    const { alignment } = await load( async () => ( {
      alignment: parsed,
      change: {
        newFilePath: '/data/primates_modified.fas',
        format: 'nexus',
        converted: true,
        modified: true,
        modificationMessages: ['fixed a name'],
      },
    } ) );
    expect( alignment.path ).toBe( '/data/primates_modified.fas' );
    expect( alignment.convertedFrom ).toBe( 'nexus' );
    expect( alignment.converted ).toBe( true );
    expect( alignment.modified ).toBe( true );
    expect( alignment.showModifiedDialog ).toBe( true );
    expect( alignment.showModifiedSnack ).toBe( false );
  } );

  it( 'a conversion without messages shows the snack', async () => {
    const { alignment } = await load( async () => ( {
      alignment: parsed,
      change: {
        newFilePath: '/data/primates.fas',
        format: 'nexus',
        converted: true,
        modified: false,
        modificationMessages: [],
      },
    } ) );
    expect( alignment.showModifiedSnack ).toBe( true );
    expect( alignment.showModifiedDialog ).toBe( false );
  } );

  it( 'a failed parse sets the error, removes the alignment and stops listening', async () => {
    const error = new Error( 'unrecognized format' );
    const { run, alignment } = await load( async () => {
      throw error;
    } );
    expect( alignment.error ).toBe( error );
    expect( alignment.loading ).toBe( false );
    expect( run.error ).toBe( error );
    expect( run.alignments ).toEqual( [] );
    expect( listeners[runEvents.onModelSelectionSuccess] ).toEqual( [] );
  } );
} );

describe( 'Alignment model selection', () => {
  it( 'runModelTest reports an error for fewer than three sequences', async () => {
    const onError = jest.fn();
    const { alignment } = setup( { onError } );
    set( alignment, { numSequences: 2 } );
    await alignment.runModelTest();
    expect( onError ).toHaveBeenCalledTimes( 1 );
    expect( onError.mock.calls[0][0].message ).toBe(
      'ModelTest can only be run on alignments with more than two sequences.',
    );
    expect( alignment.modeltestLoading ).toBe( false );
    expect( bridge.startModelSelection ).not.toHaveBeenCalled();
  } );

  it( 'start sets loading and calls the bridge', async () => {
    const { run, alignment } = setup();
    run.setOutputDir( '/out' );
    set( alignment, { numSequences: 4, dataType: 'nucleotide' } );
    const { seen, stop } = track( () => alignment.modeltestLoading );
    await alignment.runModelTest();
    expect( seen ).toEqual( [false, true] );
    expect( bridge.startModelSelection ).toHaveBeenCalledWith( {
      id: '7_/data/primates.fasta',
      filePath: '/data/primates.fasta',
      outputDir: '/out',
      dataType: 'nucleotide',
      numThreads: run.numThreads.value,
      binaryName: run.modeltestName,
    } );
    stop();
  } );

  it( 'cancel clears loading and calls the bridge only while loading', () => {
    const { alignment } = setup();
    alignment.cancelModelTest();
    expect( bridge.cancelModelSelection ).not.toHaveBeenCalled();
    set( alignment, { modeltestLoading: true } );
    alignment.cancelModelTest();
    expect( alignment.modeltestLoading ).toBe( false );
    expect( bridge.cancelModelSelection ).toHaveBeenCalledWith( alignment.id );
  } );

  it( 'success for its own id sets the model and ends the run', () => {
    const { run, alignment } = setup();
    set( alignment, { modeltestLoading: true } );
    set( run, { running: true } );
    const result = { raxml: 'GTRGAMMA', extraFlag: '--HKY85', raxmlNG: 'HKY+G' };
    fire( runEvents.onModelSelectionSuccess, { id: 'other', result } );
    expect( alignment.modeltestLoading ).toBe( true );
    expect( run.running ).toBe( true );
    fire( runEvents.onModelSelectionSuccess, { id: alignment.id, result } );
    expect( alignment.modeltestLoading ).toBe( false );
    expect( alignment.substitutionModel.value ).toBe( 'HKY' );
    expect( alignment.ngRateHeterogeneity.value ).toBe( '+G' );
    expect( run.substitutionMatrix.value ).toBe( 'HKY' );
    expect( run.substitutionRate.value ).toBe( 'GAMMA' );
    expect( run.running ).toBe( false );
  } );

  it( 'failure for its own id sets the run error and ends the run', () => {
    const { run, alignment } = setup();
    set( alignment, { modeltestLoading: true } );
    set( run, { running: true } );
    fire( runEvents.onModelSelectionFailure, { id: 'other', error: 'x' } );
    expect( run.error ).toBe( null );
    fire( runEvents.onModelSelectionFailure, { id: alignment.id, error: 'missing binary' } );
    expect( run.error ).toBe( 'missing binary' );
    expect( alignment.modeltestLoading ).toBe( false );
    expect( run.running ).toBe( false );
  } );

  it( 'dispose stops listening and cancels a running model selection', () => {
    const { alignment } = setup();
    set( alignment, { modeltestLoading: true } );
    const before = listeners[runEvents.onModelSelectionSuccess].length;
    alignment.dispose();
    expect( bridge.cancelModelSelection ).toHaveBeenCalledWith( alignment.id );
    expect( listeners[runEvents.onModelSelectionSuccess].length ).toBe( before - 1 );
  } );

  it( 'remove disposes and removes the alignment from the run', () => {
    const { run, alignment } = setup();
    alignment.remove();
    expect( run.alignments ).toEqual( [] );
  } );
} );

describe( 'Alignment setModelFromString', () => {
  function apply( result, dataType = 'nucleotide' ) {
    const { run, alignment } = setup();
    set( alignment, { dataType, modeltestLoading: true } );
    alignment.setModelFromString( result );
    return { run, alignment };
  }

  it( 'maps renamed models and the ng parameters', () => {
    const { alignment } = apply( { raxml: 'GTRGAMMAIF', extraFlag: '', raxmlNG: 'TrN+FO+IC+GA+ASC_LEWIS' } );
    expect( alignment.modeltestLoading ).toBe( false );
    expect( alignment.substitutionModel.value ).toBe( 'TN93' );
    expect( alignment.ngStationaryFrequencies.value ).toBe( '+FO' );
    expect( alignment.ngInvariantSites.value ).toBe( '+IC' );
    expect( alignment.ngRateHeterogeneity.value ).toBe( '+GA' );
    expect( alignment.ngAscertainmentBias.value ).toBe( '+ASC_LEWIS' );
  } );

  it( 'maps TPM1 to K81', () => {
    const { alignment } = apply( { raxml: 'GTRGAMMA', extraFlag: '', raxmlNG: 'TPM1' } );
    expect( alignment.substitutionModel.value ).toBe( 'K81' );
  } );

  it( 'reads the raxml flags F, X, invariant sites and rate', () => {
    const f = apply( { raxml: 'GTRGAMMAIF', extraFlag: '', raxmlNG: 'GTR' } );
    expect( f.run.baseFrequencies.value ).toBe( 'F' );
    expect( f.run.substitutionI.value ).toBe( '+I (ML estimate)' );
    expect( f.run.substitutionRate.value ).toBe( 'GAMMA' );
    expect( f.run.substitutionAscertainment.value ).toBe( 'none' );

    const x = apply( { raxml: 'GTRCATX', extraFlag: '', raxmlNG: 'GTR' } );
    expect( x.run.estimatedFrequencies.value ).toBe( true );
    expect( x.run.baseFrequencies.value ).toBe( 'X' );
    expect( x.run.substitutionRate.value ).toBe( 'CAT' );
    expect( x.run.substitutionI.value ).toBe( 'none' );

    const d = apply( { raxml: 'GTRGAMMA', extraFlag: '', raxmlNG: 'GTR' } );
    expect( d.run.baseFrequencies.value ).toBe( 'default' );
  } );

  it( 'maps the extra flags to the substitution matrix', () => {
    const jc = apply( { raxml: 'GTRCAT', extraFlag: '--JC69', raxmlNG: 'JC' } );
    expect( jc.run.substitutionMatrix.value ).toBe( 'JC' );
    expect( jc.run.substitutionRate.value ).toBe( 'GAMMA' );
    const k80 = apply( { raxml: 'GTRCAT', extraFlag: '--K80', raxmlNG: 'K80' } );
    expect( k80.run.substitutionMatrix.value ).toBe( 'K80' );
    const hky = apply( { raxml: 'GTRCAT', extraFlag: '--HKY85', raxmlNG: 'HKY' } );
    expect( hky.run.substitutionMatrix.value ).toBe( 'HKY' );
  } );

  it( 'parses the amino acid matrix for protein', () => {
    const { alignment } = apply( { raxml: 'PROTGAMMAWAGF', extraFlag: '', raxmlNG: 'WAG+FO' }, 'protein' );
    expect( alignment.aaMatrixName ).toBe( 'WAG' );
  } );
} );
