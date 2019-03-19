const electron = require('electron');
const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');

const { ipcMain, dialog } = electron;

const state = {
  raxmlProcess: null,
  files: null,
  processes: {},
};

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('Got async message:', arg);
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('open-file', (event, arg) => {
  state.files = dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections']
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
  const binaryPath = path.resolve('raxml', 'binaries', binaryName);
  console.log('binaryPath:', binaryPath, '__dirname:', __dirname);
  // const ext = path.extname(inputPath);
  // const name = path.basename(inputPath, ext);
  // const outPath = path.dirname(inputPath);
  // const args = `-T 2 -f a -x 572 -m GTRGAMMA -p 820 -N 100 -s "${inputPath}" -n ${name}.tre  -O -w ${outPath}`;
  
  // console.log(`ext: '${ext}, name: '${name}', outPath: '${outPath}', -> args: ${args}`);

  // const proc = childProcess.spawn(binaryPath, process.argv.slice(2), { stdio: 'inherit' });
  const proc = childProcess.spawn(binaryPath, args, { stdio: 'pipe' });
  return proc;
}