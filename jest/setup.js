// React 19 flushes a render inside act() when this flag is set.
global.IS_REACT_ACT_ENVIRONMENT = true;

// Run listens at construction. Tests replace rendererBridge and still need these.
const runEvents = {
  onRunStdout() {
    return () => {};
  },
  onRunStderr() {
    return () => {};
  },
  onRunFinished() {
    return () => {};
  },
  onRunError() {
    return () => {};
  },
};

let bridge = { ...runEvents };

Object.defineProperty( window, 'rendererBridge', {
  configurable: true,
  enumerable: true,
  get() {
    return bridge;
  },
  set( next ) {
    bridge = { ...runEvents, ...next };
  },
} );
