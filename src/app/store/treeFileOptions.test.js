// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import Run from './Run';

const files = [
  [ 'tree', '/data/start.nwk' ],
  [ 'backboneConstraint', '/data/backbone.tre' ],
  [ 'multifurcatingConstraint', '/data/multi.tre' ],
];

let showItemInFolder;
let openPath;
let selectTree;
let run;
let disposers;

// Records every value an autorun sees, so a test can prove it re-ran.
// Run.analysis is a computed that builds a new option; observing it keeps the set value.
function observe( fn ) {
  const seen = [];
  disposers.push( autorun( () => seen.push( fn() ) ) );
  return { seen };
}

beforeEach( () => {
  showItemInFolder = jest.fn( async () => {} );
  openPath = jest.fn( async () => {} );
  selectTree = jest.fn();
  window.rendererBridge = { showItemInFolder, openPath, selectTree };
  run = new Run( {}, 3 );
  disposers = [];
  // The default binary is raxml-ng; these tests use the classic RAxML analyses.
  run.binary.setValue( run.binary.options.find( ( { value } ) => value.includes( 'raxmlHPC' ) ).value );
  observe( () => run.analysis.value );
} );

afterEach( () => {
  disposers.forEach( ( stop ) => stop() );
} );

describe.each( files )( '%s file', ( key, filePath ) => {
  const option = () => run[key];
  const filename = filePath.split( '/' ).pop();
  const stem = filename.replace( /\.\w+$/, '' );

  it( 'starts without a file', () => {
    expect( option().filePath ).toBe( '' );
    expect( option().haveFile ).toBe( false );
    expect( option().filename ).toBe( '' );
    expect( option().dir ).toBe( '' );
  } );

  it( 'loading a file sets path, filename, name, dir and haveFile', async () => {
    selectTree.mockResolvedValue( { type: key, filePath } );
    const load = {
      tree: run.loadTreeFile,
      backboneConstraint: run.loadBackboneConstraintFile,
      multifurcatingConstraint: run.loadMultifurcatingConstraintFile,
    }[key];
    await load();
    expect( selectTree ).toHaveBeenCalledWith( 3, key );
    expect( option().filePath ).toBe( filePath );
    expect( option().haveFile ).toBe( true );
    expect( option().filename ).toBe( filename );
    expect( option().name ).toBe( stem );
    expect( option().dir ).toBe( '/data' );
  } );

  it( 'setFilePath updates every computed', () => {
    const { seen } = observe( () => [
      option().haveFile, option().filename, option().name, option().dir,
    ] );
    option().setFilePath( filePath );
    expect( seen ).toEqual( [
      [ false, '', '', '' ],
      [ true, filename, stem, '/data' ],
    ] );
  } );

  it( 'a reaction sees filePath set directly', () => {
    const { seen } = observe( () => option().haveFile );
    runInAction( () => {
      option().filePath = filePath;
    } );
    expect( seen ).toEqual( [ false, true ] );
  } );

  it( 'remove clears the file', () => {
    option().setFilePath( filePath );
    const { seen } = observe( () => option().haveFile );
    option().remove();
    expect( option().filePath ).toBe( '' );
    expect( seen ).toEqual( [ true, false ] );
  } );

  it( 'openFolder and openFile pass the path to the bridge', async () => {
    option().setFilePath( filePath );
    await option().openFolder();
    await option().openFile();
    expect( showItemInFolder ).toHaveBeenCalledWith( filePath );
    expect( openPath ).toHaveBeenCalledWith( filePath );
  } );
} );

describe( 'Tree notAvailable', () => {
  it( 'is unavailable for the default analysis', () => {
    expect( run.tree.notAvailable ).toBe( true );
  } );

  it( 'follows the analysis that takes a tree', () => {
    const { seen } = observe( () => run.tree.notAvailable );
    run.analysis.setValue( 'AS' );
    run.analysis.setValue( 'ML+rBS' );
    expect( seen ).toEqual( [ true, false, true ] );
  } );

  it( 'follows a user defined starting tree', () => {
    const { seen } = observe( () => run.tree.notAvailable );
    run.analysis.setValue( 'PD' );
    run.startingTree.setValue( 'User defined' );
    run.startingTree.setValue( 'Maximum parsimony' );
    expect( seen ).toEqual( [ true, false, true ] );
  } );
} );

describe.each( [
  [ 'backboneConstraint', 'useBackboneConstraint', 'onBackboneConstraint' ],
  [ 'multifurcatingConstraint', 'useMultifurcatingConstraint', 'onMultifurcatingConstraint' ],
] )( '%s toggle', ( key, flag, toggle ) => {
  const option = () => run[key];

  it( 'notAvailable follows the toggle', () => {
    const { seen } = observe( () => option().notAvailable );
    run[toggle]();
    run[toggle]();
    expect( seen ).toEqual( [ true, false, true ] );
  } );

  it( 'notAvailable follows the analysis', () => {
    runInAction( () => {
      run[flag] = true;
    } );
    const { seen } = observe( () => [ option().canConstraint, option().notAvailable ] );
    run.analysis.setValue( 'FT' );
    expect( seen ).toEqual( [ [ true, false ], [ false, true ] ] );
  } );

  it( 'isSet needs the toggle and a file', () => {
    const { seen } = observe( () => option().isSet );
    run[toggle]();
    option().setFilePath( '/data/c.tre' );
    run[toggle]();
    option().remove();
    run[toggle]();
    // the computed only notifies when its value changes
    expect( seen ).toEqual( [ false, true, false ] );
  } );
} );
