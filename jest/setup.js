const os = require( 'os' );

// React 19 flushes a render inside act() when this flag is set.
global.IS_REACT_ACT_ENVIRONMENT = true;

function withModelEvents( bridge ) {
  if ( typeof bridge.onModelSelectionSuccess !== 'function' ) {
    bridge.onModelSelectionSuccess = () => () => {};
  }
  if ( typeof bridge.onModelSelectionFailure !== 'function' ) {
    bridge.onModelSelectionFailure = () => () => {};
  }
  return bridge;
}

let bridge = withModelEvents( {
  host: {
    windows: process.platform === 'win32',
    release: os.release(),
    arch: os.arch(),
    cpuModel: os.cpus()[0].model,
  },
} );

Object.defineProperty( window, 'rendererBridge', {
  configurable: true,
  enumerable: true,
  get() {
    return bridge;
  },
  set( next ) {
    bridge = withModelEvents( next );
  },
} );
