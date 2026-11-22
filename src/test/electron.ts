import os from 'node:os';

export const ipcRenderer = {
  on(): void {},
  removeListener(): void {},
  send(): void {},
  // electron-store reads this while the page store is imported.
  sendSync(): { defaultCwd: string; appVersion: string } {
    return {
      defaultCwd: os.tmpdir(),
      appVersion: '0.0.0-test',
    };
  },
};
