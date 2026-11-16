// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';

import AppStore from './AppStore';
import RunList from './RunList';
import { runEvents } from './StoreBase';

let listeners;
let cancelRun;

// The run list subscribes to bridge events; keep each listener so a test can fire it.
function stubBridge() {
  const byName = {};
  listeners = byName;
  cancelRun = jest.fn();
  const bridge = { cancelRun, getVersion: () => Promise.resolve( '2.0.0' ) };
  for ( const name of Object.values( runEvents ) ) {
    bridge[name] = ( listener ) => {
      ( byName[name] ||= [] ).push( listener );
      return () => {
        byName[name] = byName[name].filter( ( l ) => l !== listener );
      };
    };
  }
  window.rendererBridge = bridge;
}

function fire( name, ...args ) {
  ( listeners[name] || [] ).forEach( ( listener ) => listener( ...args ) );
}

// Records every value an autorun sees, so a test can prove it re-ran.
function track( fn ) {
  const seen = [];
  const stop = autorun( () => seen.push( fn() ) );
  return { seen, stop };
}

beforeEach( () => stubBridge() );

describe( 'AppStore', () => {
  it( 'loads the version from the renderer bridge', async () => {
    const store = new AppStore();
    const { seen, stop } = track( () => store.version );
    await Promise.resolve();
    expect( store.version ).toBe( '2.0.0' );
    expect( seen ).toEqual( [undefined, '2.0.0'] );
    stop();
  } );

  it( 'a reaction sees a version set directly', () => {
    const store = new AppStore();
    const { seen, stop } = track( () => store.version );
    runInAction( () => {
      store.version = '9.9.9';
    } );
    expect( seen ).toEqual( [undefined, '9.9.9'] );
    stop();
  } );

  it( 'setAppSnack and clearAppSnack toggle the snack', () => {
    const store = new AppStore();
    const { seen, stop } = track( () => store.showAppSnack );
    store.setAppSnack();
    expect( store.showAppSnack ).toBe( true );
    store.clearAppSnack();
    expect( store.showAppSnack ).toBe( false );
    expect( seen ).toEqual( [false, true, false] );
    stop();
  } );

  it( 'has a citation and a config', () => {
    const store = new AppStore();
    expect( store.citation.format ).toBe( 'txt' );
    expect( store.config.isDarkMode ).toBe( false );
  } );
} );

describe( 'RunList', () => {
  it( 'starts with one active run', () => {
    const list = new RunList();
    expect( list.runs ).toHaveLength( 1 );
    expect( list.activeIndex ).toBe( 0 );
    expect( list.activeRun ).toBe( list.runs[0] );
    expect( list.activeRun.id ).toBe( 1 );
  } );

  it( 'adding a run appends it with the next id and makes it active', () => {
    const list = new RunList();
    const { seen, stop } = track( () => list.activeRun.id );
    list.addRun();
    list.addRun();
    expect( list.runs.map( ( r ) => r.id ) ).toEqual( [1, 2, 3] );
    expect( list.activeIndex ).toBe( 2 );
    expect( seen ).toEqual( [1, 2, 3] );
    stop();
  } );

  it( 'adding a run after a delete uses one more than the highest id', () => {
    const list = new RunList();
    list.addRun();
    list.addRun();
    list.deleteRun( list.runs[1] );
    list.addRun();
    expect( list.runs.map( ( r ) => r.id ) ).toEqual( [1, 3, 4] );
  } );

  it( 'switching the active run changes activeRun', () => {
    const list = new RunList();
    list.addRun();
    const { seen, stop } = track( () => list.activeRun.id );
    list.setActive( 0 );
    expect( list.activeIndex ).toBe( 0 );
    expect( list.activeRun ).toBe( list.runs[0] );
    list.setActive( 1 );
    expect( seen ).toEqual( [2, 1, 2] );
    stop();
  } );

  it( 'activeRun follows activeIndex and runs set directly', () => {
    const list = new RunList();
    list.addRun();
    const { seen, stop } = track( () => list.activeRun?.id );
    runInAction( () => {
      list.activeIndex = 0;
    } );
    runInAction( () => {
      list.runs = list.runs.slice().reverse();
    } );
    expect( seen ).toEqual( [2, 1, 2] );
    stop();
  } );

  it( 'removing a run disposes it and clamps the active index', () => {
    const list = new RunList();
    list.addRun();
    list.addRun();
    const last = list.runs[2];
    list.deleteRun( last );
    expect( cancelRun ).toHaveBeenCalledWith( 3 );
    expect( list.runs.map( ( r ) => r.id ) ).toEqual( [1, 2] );
    expect( list.activeIndex ).toBe( 1 );
    expect( list.activeRun.id ).toBe( 2 );
  } );

  it( 'removing a run before the active one keeps the index', () => {
    const list = new RunList();
    list.addRun();
    list.addRun();
    list.setActive( 1 );
    list.deleteRun( list.runs[0] );
    expect( list.activeIndex ).toBe( 1 );
    expect( list.activeRun.id ).toBe( 3 );
  } );

  it( 'removing the only run replaces it with a fresh run 1', () => {
    const list = new RunList();
    list.addRun();
    list.deleteRun( list.runs[0] );
    const remaining = list.runs[0];
    list.deleteRun( remaining );
    expect( list.runs ).toHaveLength( 1 );
    expect( list.runs[0] ).not.toBe( remaining );
    expect( list.activeRun.id ).toBe( 1 );
    expect( list.activeIndex ).toBe( 0 );
  } );

  it( 'deleteActive removes the active run', () => {
    const list = new RunList();
    list.addRun();
    list.setActive( 0 );
    list.deleteActive();
    expect( list.runs.map( ( r ) => r.id ) ).toEqual( [2] );
    expect( list.activeRun.id ).toBe( 2 );
  } );

  it( 'a removed run stops listening to bridge events', () => {
    const list = new RunList();
    list.addRun();
    const removed = list.runs[1];
    list.deleteRun( removed );
    fire( runEvents.onRunStdout, { id: 2, content: 'late' } );
    expect( removed.stdout ).toBe( '' );
  } );

  it( 'two runs keep independent state', () => {
    const list = new RunList();
    list.addRun();
    const [first, second] = list.runs;
    runInAction( () => {
      first.useBackboneConstraint = true;
    } );
    fire( runEvents.onRunStdout, { id: 2, content: 'second only' } );
    expect( first.useBackboneConstraint ).toBe( true );
    expect( second.useBackboneConstraint ).toBe( false );
    expect( first.stdout ).toBe( '' );
    expect( second.stdout ).toBe( 'second only' );
    expect( first.outputNamePlaceholder ).toBe( '1' );
    expect( second.outputNamePlaceholder ).toBe( '2' );
  } );

  it( 'onError sets the error and clears the title; clearError resets both', () => {
    const list = new RunList();
    const { seen, stop } = track( () => [list.errorTitle, list.error] );
    runInAction( () => {
      list.errorTitle = 'Old';
    } );
    const error = new Error( 'boom' );
    list.onError( error );
    expect( list.error ).toBe( error );
    expect( list.errorTitle ).toBeNull();
    list.clearError();
    expect( list.error ).toBeNull();
    expect( list.errorTitle ).toBeNull();
    expect( seen ).toEqual( [
      [null, null],
      ['Old', null],
      [null, error],
      [null, null],
    ] );
    stop();
  } );

  it( 'onUnhandledError sets the title and error', () => {
    jest.spyOn( console, 'log' ).mockImplementation( () => {} );
    const list = new RunList();
    const error = new Error( 'crash' );
    list.onUnhandledError( { title: 'Oops', error } );
    expect( list.errorTitle ).toBe( 'Oops' );
    expect( list.error ).toBe( error );
    console.log.mockRestore();
  } );

  it( 'the constraint toggles flip the active run only', () => {
    const list = new RunList();
    list.addRun();
    const [first, second] = list.runs;
    list.onBackboneConstraint();
    list.onMultifurcatingConstraint();
    expect( second.useBackboneConstraint ).toBe( true );
    expect( second.useMultifurcatingConstraint ).toBe( true );
    expect( first.useBackboneConstraint ).toBe( false );
    expect( first.useMultifurcatingConstraint ).toBe( false );
    list.onBackboneConstraint();
    list.onMultifurcatingConstraint();
    expect( second.useBackboneConstraint ).toBe( false );
    expect( second.useMultifurcatingConstraint ).toBe( false );
  } );

  it( 'routes bridge events to its actions', () => {
    jest.spyOn( console, 'log' ).mockImplementation( () => {} );
    const list = new RunList();
    fire( runEvents.onAddRun );
    expect( list.runs ).toHaveLength( 2 );
    fire( runEvents.onToggleBackboneConstraint );
    fire( runEvents.onToggleMultifurcatingConstraint );
    expect( list.activeRun.useBackboneConstraint ).toBe( true );
    expect( list.activeRun.useMultifurcatingConstraint ).toBe( true );
    fire( runEvents.onRemoveRun );
    expect( list.runs.map( ( r ) => r.id ) ).toEqual( [1] );
    const error = new Error( 'main' );
    fire( runEvents.onUnhandledError, { title: 'Main', error } );
    expect( list.errorTitle ).toBe( 'Main' );
    expect( list.error ).toBe( error );
    console.log.mockRestore();
  } );

  it( 'generateReport reports the active run with truncated stdout', () => {
    const list = new RunList();
    runInAction( () => {
      list.activeRun.stdout = 'abcdef';
    } );
    const report = list.generateReport( { maxStdoutLength: 3 } );
    expect( report.stdout ).toBe( '[3 more characters]...def' );
    expect( report.command ).toBe( list.activeRun.command );
    expect( list.generateReport().stdout ).toBe( 'abcdef' );
  } );
} );
