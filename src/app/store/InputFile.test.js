// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import AstralTree from './AstralTree';
import InputFile from './InputFile';
import StoreBase from './StoreBase';

let bridge;

beforeEach( () => {
  bridge = {
    getVersion: jest.fn( () => Promise.resolve( '2.0.0' ) ),
    openPath: jest.fn( () => Promise.resolve() ),
    showItemInFolder: jest.fn( () => Promise.resolve() ),
  };
  window.rendererBridge = bridge;
} );

// Records every value an autorun sees, so a test can prove it re-ran.
function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

const run = { id: 'run1', removeAstralTree: jest.fn() };

describe( 'StoreBase', () => {
  it( 'initialises the version from the renderer bridge', async () => {
    const store = new StoreBase();
    expect( store.version ).toBeUndefined();
    await Promise.resolve();
    expect( bridge.getVersion ).toHaveBeenCalledTimes( 1 );
    expect( store.version ).toBe( '2.0.0' );
  } );

  it( 'subscribe registers a bridge listener and unlisten stops them all', () => {
    const stopA = jest.fn();
    const stopB = jest.fn();
    bridge.onRunStdout = jest.fn( () => stopA );
    bridge.onRunStderr = jest.fn( () => stopB );
    const store = new StoreBase();
    const listener = () => {};
    store.subscribe( 'onRunStdout', listener );
    store.subscribe( 'onRunStderr', listener );
    expect( bridge.onRunStdout ).toHaveBeenCalledWith( listener );
    expect( store.eventStops ).toHaveLength( 2 );
    store.unlisten();
    expect( stopA ).toHaveBeenCalledTimes( 1 );
    expect( stopB ).toHaveBeenCalledTimes( 1 );
    expect( store.eventStops ).toHaveLength( 0 );
  } );

  it( 'dispose stops the listeners', () => {
    const stop = jest.fn();
    bridge.onRunStdout = () => stop;
    const store = new StoreBase();
    store.subscribe( 'onRunStdout', () => {} );
    store.dispose();
    expect( stop ).toHaveBeenCalledTimes( 1 );
  } );
} );

describe( 'InputFile', () => {
  it( 'derives its parts from the path', () => {
    const file = new InputFile( run, '/data/trees/astral.tre' );
    expect( file.id ).toBe( 'run1_/data/trees/astral.tre' );
    expect( file.name ).toBe( 'astral' );
    expect( file.dir ).toBe( '/data/trees' );
    expect( file.base ).toBe( 'astral.tre' );
    expect( file.filename ).toBe( 'astral.tre' );
    expect( file.ok ).toBe( true );
  } );

  it( 'is not ok with an empty path', () => {
    expect( new InputFile( run, '' ).ok ).toBe( false );
  } );

  it( 'every computed updates when the path changes', () => {
    const file = new InputFile( run, '/a/one.tre' );
    const keys = ['id', 'name', 'dir', 'base', 'filename', 'ok'];
    const tracked = Object.fromEntries( keys.map( ( key ) => [key, track( () => file[key] )] ) );
    runInAction( () => {
      file.path = '';
    } );
    runInAction( () => {
      file.path = '/b/two.nwk';
    } );
    expect( tracked.id.seen ).toEqual( ['run1_/a/one.tre', 'run1_', 'run1_/b/two.nwk'] );
    expect( tracked.name.seen ).toEqual( ['one', '', 'two'] );
    expect( tracked.dir.seen ).toEqual( ['/a', '', '/b'] );
    expect( tracked.base.seen ).toEqual( ['one.tre', '', 'two.nwk'] );
    expect( tracked.filename.seen ).toEqual( ['one.tre', '', 'two.nwk'] );
    expect( tracked.ok.seen ).toEqual( [true, false, true] );
    keys.forEach( ( key ) => tracked[key].stop() );
  } );

  it( 'openFile asks the bridge to open the path', async () => {
    const file = new InputFile( run, '/a/one.tre' );
    await file.openFile();
    expect( bridge.openPath ).toHaveBeenCalledWith( '/a/one.tre' );
  } );

  it( 'showFileInFolder asks the bridge to reveal the path', async () => {
    const file = new InputFile( run, '/a/one.tre' );
    await file.showFileInFolder();
    expect( bridge.showItemInFolder ).toHaveBeenCalledWith( '/a/one.tre' );
  } );

  it( 'initialises the version like any store', async () => {
    const file = new InputFile( run, '/a/one.tre' );
    await Promise.resolve();
    expect( file.version ).toBe( '2.0.0' );
  } );
} );

describe( 'AstralTree', () => {
  it( 'remove removes the tree from its run', () => {
    run.removeAstralTree.mockClear();
    new AstralTree( run, '/a/one.tre' ).remove();
    expect( run.removeAstralTree ).toHaveBeenCalledTimes( 1 );
  } );

  it( 'inherits the input file computeds', () => {
    const tree = new AstralTree( run, '/a/one.tre' );
    const { seen, stop } = track( () => tree.name );
    runInAction( () => {
      tree.path = '/a/other.tre';
    } );
    expect( seen ).toEqual( ['one', 'other'] );
    stop();
  } );
} );
