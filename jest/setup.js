import os from 'node:os';

import { runEvents } from '../src/app/store/StoreBase';

// React 19 flushes a render inside act() when this flag is set.
global.IS_REACT_ACT_ENVIRONMENT = true;

// Run listens at construction. Tests replace rendererBridge and still need these.
const runEventStubs = {};
for ( const name of Object.values( runEvents ) ) {
  runEventStubs[name] = () => () => {};
}

const host = {
  windows: process.platform === 'win32',
  release: os.release(),
  arch: os.arch(),
  cpuModel: os.cpus()[0].model,
};

let bridge = { ...runEventStubs, host };

Object.defineProperty( window, 'rendererBridge', {
  configurable: true,
  enumerable: true,
  get() {
    return bridge;
  },
  set( next ) {
    bridge = next;
    for ( const name of Object.keys( runEventStubs ) ) {
      if ( typeof bridge[name] !== 'function' ) {
        bridge[name] = runEventStubs[name];
      }
    }
    if ( !Object.prototype.hasOwnProperty.call( bridge, 'host' ) ) {
      bridge.host = host;
    }
  },
} );
