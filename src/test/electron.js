const os = require( 'os' );

const ipcRenderer = {
  on() {},
  removeListener() {},
  send() {},
  // electron-store reads this while the page store is imported.
  sendSync() {
    return {
      defaultCwd: os.tmpdir(),
      appVersion: '0.0.0-test',
    };
  },
};

module.exports = { ipcRenderer };
