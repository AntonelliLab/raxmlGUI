import os from 'node:os';

import { runEvents } from '../src/app/store/StoreBase';

// React 19 flushes a render inside act() when this flag is set.
global.IS_REACT_ACT_ENVIRONMENT = true;

// Run, an alignment, the run list, and the theme listen at construction. A test assignment keeps its object.
const runEventStubs = {};
for ( const name of Object.values( runEvents ) ) {
  runEventStubs[name] = () => () => {};
}

const modelEventStubs = {
  onModelSelectionSuccess() {
    return () => {};
  },
  onModelSelectionFailure() {
    return () => {};
  },
};

const host = {
  windows: process.platform === 'win32',
  release: os.release(),
  arch: os.arch(),
  cpuModel: os.cpus()[0].model,
};

function withBridgeEvents( next ) {
  for ( const name of Object.keys( runEventStubs ) ) {
    if ( typeof next[name] !== 'function' ) {
      next[name] = runEventStubs[name];
    }
  }
  for ( const name of Object.keys( modelEventStubs ) ) {
    if ( typeof next[name] !== 'function' ) {
      next[name] = modelEventStubs[name];
    }
  }
  if ( !Object.prototype.hasOwnProperty.call( next, 'host' ) ) {
    next.host = host;
  }
  // Run.dispose calls cancel, which calls cancelRun.
  // Alignment.dispose calls cancelModelTest while model selection is loading.
  if ( typeof next.cancelRun !== 'function' ) {
    next.cancelRun = () => {};
  }
  if ( typeof next.cancelModelSelection !== 'function' ) {
    next.cancelModelSelection = () => {};
  }
  if ( typeof next.provideStateReport !== 'function' ) {
    next.provideStateReport = () => {};
  }
  return next;
}

let bridge = withBridgeEvents( { host } );

Object.defineProperty( window, 'rendererBridge', {
  configurable: true,
  enumerable: true,
  get() {
    return bridge;
  },
  set( next ) {
    bridge = withBridgeEvents( next );
  },
} );
