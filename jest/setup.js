const os = require( 'os' );

// React 19 flushes a render inside act() when this flag is set.
global.IS_REACT_ACT_ENVIRONMENT = true;

window.rendererBridge = {
  host: {
    windows: process.platform === 'win32',
    release: os.release(),
    arch: os.arch(),
    cpuModel: os.cpus()[0].model,
  },
};
