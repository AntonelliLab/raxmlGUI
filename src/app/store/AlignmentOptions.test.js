// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Run from './Run';
import * as raxmlNgSettings from '../../settings/raxmlng';

beforeEach( () => {
  window.rendererBridge = { parseAlignment: () => new Promise( () => {} ) };
} );

function setup() {
  const run = new Run( { onError() {} }, 1 );
  run.addAlignments( [{ path: '/data/a.fasta' }] );
  const alignment = run.alignments[0];
  runInAction( () => {
    run.binary.value = 'raxml-ng';
    alignment.dataType = 'nucleotide';
  } );
  return { run, alignment };
}

function useOtherBinary( run ) {
  runInAction( () => {
    run.binary.value = run.binary.options.find(
      ( o ) => !o.value.includes( 'raxml-ng' ),
    ).value;
  } );
}

// Records every value a computed takes while the store changes.
function watch( read ) {
  const seen = [];
  const stop = autorun( () => seen.push( read() ) );
  return { seen, stop };
}

describe( 'substitution model', () => {
  it( 'lists the options of the alignment data type', () => {
    const { alignment } = setup();
    const { options } = raxmlNgSettings.modelOptions.nucleotide;
    expect( alignment.substitutionModel.options ).toEqual(
      options.map( ( value ) => ( { value, title: value } ) ),
    );
  } );

  it( 'has no options for an unknown data type', () => {
    const { alignment } = setup();
    runInAction( () => {
      alignment.dataType = undefined;
    } );
    expect( alignment.substitutionModel.options ).toEqual( [] );
  } );

  it( 'has no options and is not available without alignments', () => {
    const { run, alignment } = setup();
    const model = alignment.substitutionModel;
    const { seen, stop } = watch( () => [model.options.length > 0, model.notAvailable] );
    run.removeAlignment( alignment );
    stop();
    expect( seen ).toEqual( [[true, false], [false, true]] );
  } );

  it( 'updates the options when the data type changes', () => {
    const { alignment } = setup();
    const { seen, stop } = watch( () => alignment.substitutionModel.options.length );
    runInAction( () => {
      alignment.dataType = 'protein';
    } );
    stop();
    expect( seen ).toEqual( [
      raxmlNgSettings.modelOptions.nucleotide.options.length,
      raxmlNgSettings.modelOptions.protein.options.length,
    ] );
  } );

  it( 'uses its value as the command value and follows value changes', () => {
    const { alignment } = setup();
    const model = alignment.substitutionModel;
    const { seen, stop } = watch( () => model.cmdValue );
    model.setValue( 'HKY' );
    stop();
    expect( seen ).toEqual( ['', 'HKY'] );
  } );

  it( 'puts the multistate number into the command value', () => {
    const { alignment } = setup();
    runInAction( () => {
      alignment.dataType = 'multistate';
    } );
    alignment.substitutionModel.setValue( 'MULTIx_GTR' );
    const { seen, stop } = watch( () => alignment.substitutionModel.cmdValue );
    alignment.multistateNumber.setValue( '5' );
    stop();
    expect( seen ).toEqual( ['MULTI_GTR', 'MULTI5_GTR'] );
  } );
} );

describe( 'extra model parameters', () => {
  const extras = [
    ['ngStationaryFrequencies', 'Stationary frequencies', '+F'],
    ['ngInvariantSites', 'Proportion of invariant sites', '+I'],
    ['ngRateHeterogeneity', 'Rate heterogeneity', '+G'],
  ];

  it.each( extras )( '%s starts at none and has an empty command value', ( key, title ) => {
    const { alignment } = setup();
    const option = alignment[key];
    expect( option.title ).toBe( title );
    expect( option.value ).toBe( '<none>' );
    expect( option.cmdValue ).toBe( '' );
    expect( option.options[0] ).toEqual( { value: '<none>', title: 'none' } );
    expect( option.options.length ).toBeGreaterThan( 1 );
  } );

  it.each( extras )( '%s command value follows its value', ( key, _title, value ) => {
    const { alignment } = setup();
    const option = alignment[key];
    const { seen, stop } = watch( () => option.cmdValue );
    option.setValue( value );
    option.setValue( '<none>' );
    stop();
    expect( seen ).toEqual( ['', value, ''] );
  } );

  it.each( extras )( '%s is only available with alignments and raxml-ng', ( key ) => {
    const { run, alignment } = setup();
    const option = alignment[key];
    const { seen, stop } = watch( () => [option.notAvailable, option.options.length > 0] );
    useOtherBinary( run );
    runInAction( () => {
      run.binary.value = 'raxml-ng';
    } );
    run.removeAlignment( alignment );
    stop();
    expect( seen ).toEqual( [
      [false, true],
      [true, true],
      [false, true],
      [true, false],
    ] );
  } );

  it( 'ascertainment bias defaults to no correction', () => {
    const { alignment } = setup();
    const asc = alignment.ngAscertainmentBias;
    expect( asc.value ).toBe( '<none>' );
    expect( asc.cmdValue ).toBe( '' );
    expect( asc.options ).toEqual( [
      { value: '<none>', title: 'No correction' },
      { value: '+ASC_LEWIS', title: "Lewis' method" },
    ] );
    const { seen, stop } = watch( () => asc.cmdValue );
    asc.setValue( '+ASC_LEWIS' );
    stop();
    expect( seen ).toEqual( ['', '+ASC_LEWIS'] );
  } );

  it( 'ascertainment bias is unavailable with invariant sites, without raxml-ng or without alignments', () => {
    const { run, alignment } = setup();
    const asc = alignment.ngAscertainmentBias;
    const { seen, stop } = watch( () => asc.notAvailable );
    runInAction( () => {
      alignment.hasInvariantSites = true;
    } );
    runInAction( () => {
      alignment.hasInvariantSites = false;
    } );
    useOtherBinary( run );
    stop();
    expect( seen ).toEqual( [false, true, false, true] );
    runInAction( () => {
      run.binary.value = 'raxml-ng';
    } );
    run.removeAlignment( alignment );
    expect( asc.notAvailable ).toBe( true );
  } );
} );

describe( 'multistate number', () => {
  it( 'starts empty with an integer placeholder', () => {
    const { alignment } = setup();
    expect( alignment.multistateNumber.value ).toBe( '' );
    expect( alignment.multistateNumber.placeholder ).toBe( 'Integer' );
  } );

  it( 'has an error for a missing value', () => {
    const { alignment } = setup();
    expect( alignment.multistateNumber.error ).toBe( true );
  } );

  it( 'has an error for a non-integer value', () => {
    const { alignment } = setup();
    alignment.multistateNumber.setValue( '2.5' );
    expect( alignment.multistateNumber.error ).toBe( true );
    alignment.multistateNumber.setValue( 'abc' );
    expect( alignment.multistateNumber.error ).toBe( true );
  } );

  it( 'has no error for a valid value and follows value changes', () => {
    const { alignment } = setup();
    const { seen, stop } = watch( () => alignment.multistateNumber.error );
    alignment.multistateNumber.setValue( '4' );
    stop();
    expect( seen ).toEqual( [true, false] );
  } );

  it( 'is available only for multistate data with raxml-ng', () => {
    const { run, alignment } = setup();
    const number = alignment.multistateNumber;
    const { seen, stop } = watch( () => number.notAvailable );
    runInAction( () => {
      alignment.dataType = 'multistate';
    } );
    useOtherBinary( run );
    stop();
    expect( seen ).toEqual( [true, false, true] );
  } );
} );
