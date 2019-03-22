import electron from 'electron';
import path from 'path';
import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';

const { ipcMain, dialog } = electron;

const state = {
  processes: {},
};

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('Got async message:', arg);
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('open-file', (event, arg) => {
  state.files = dialog.showOpenDialog({
    properties: [
      'openFile',
      'multiSelections',
    ]
  });
  console.log('files:', state.files);
  if (state.files) {
    const filename = state.files[0];
    fs.stat(filename, (err, stats) => {
      if (err) {
        event.sender.send('error', { message: `Error trying to open file ${filename}: ${err.message}`});
        return;
      }
      // event.sender.send('filename', filename);
      event.sender.send('file', {
        filename,
        size: stats.size,
      });
    })
  }
});

ipcMain.on('open-dir', (event, arg) => {
  const dirs = dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  console.log('dirs:', dirs);
  if (dirs) {
    event.sender.send('outDir', dirs[0]);
  }
});

ipcMain.on('run', (event, arg) => {
  const { id, args } = arg;
  console.log(`Run with id ${id} and args ${args}...`);

  cancelProcess(id);

  const proc = runRaxml(args);
  state.processes[id] = proc;
  
  proc.stdout.on('data', buffer => {
    const content = String(buffer);
    event.sender.send('raxml-output', { id, content });
  });

  proc.on('close', code => {
    event.sender.send('raxml-close', { id, code });
    delete state.processes[id];
  });
});

ipcMain.on('cancel', (event, arg) => {
  const id = arg;
  console.log(`Cancel raxml process ${id}...`);
  cancelProcess(id);
});

ipcMain.on('open-item', (event, arg) => {
  console.log('Open item:', arg);
  electron.shell.openItem(arg);
});

function cancelProcess(id) {
  if (state.processes[id]) {
    state.processes[id].kill();
    console.log(`Killed RAxML proces ${id}`);
    delete state.processes[id];
    // event.sender.send('raxml-close', { id });
  }
}

function runRaxml(args) {
  const binaryName = `raxmlHPC-PTHREADS-SSE3-Mac`;
  const rootDir = electron.app.isPackaged ? electron.app.getAppPath() : __dirname;
  const binaryDir = path.resolve(rootDir, '..', '..', 'bin', 'raxml');
  const binaryPath = path.resolve(binaryDir, binaryName);
  console.log('binaryPath:', binaryPath);

  const proc = childProcess.spawn(binaryName, args, {
    stdio: 'pipe',
    cwd: os.homedir(),
    env: { PATH: `${process.env.path}:${binaryDir}` },
  });
  return proc;
}
