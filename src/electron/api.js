const electron = require('electron');
const path = require('path');
const proc = require('child_process');

const { ipcMain, dialog } = electron;

const state = {
  raxmlProcess: null,
  files: null,
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
    event.sender.send('filename', state.files[0]);
  }
});

ipcMain.on('run', (event, arg) => {
  if (state.files) {
    runRaxml(state.files[0], {
      stdout: data => {
        event.sender.send('raxml-output', data);
      },
      close: code => {
        event.sender.send('raxml-close', code);
      },
    });
  }
});

ipcMain.on('cancel', (event, arg) => {
  console.log('Canceling raxml process?', !!state.raxmlProcess);
  if (state.raxmlProcess) {
    console.log('Canceling raxml process...');
    state.raxmlProcess.kill();
    event.sender.send('raxml-close', 0);
  }
});



function runRaxml(inputPath, { stdout, close }) {
  const binaryName = `raxmlHPC-PTHREADS-SSE3-Mac`;
  const binaryPath = path.resolve('raxml', 'binaries', binaryName);
  console.log('binaryPath:', binaryPath, '__dirname:', __dirname);
  const ext = path.extname(inputPath);
  const name = path.basename(inputPath, ext);
  const outPath = path.dirname(inputPath);
  // const args = `-T 2 -f a -x 572 -m GTRGAMMA -p 820 -N 100 -s "${inputPath}" -n ${name}.tre  -O -w ${outPath}`;
  const args = [
    '-T',
    '2',
    '-f',
    'a',
    '-x',
    '572',
    '-m',
    'GTRGAMMA',
    '-p',
    '820',
    '-N',
    '100',
    '-s',
    inputPath,
    '-n',
    `${name}.tre`,
    '-O',
    outPath,
  ];
  console.log(`ext: '${ext}, name: '${name}', outPath: '${outPath}', -> args: ${args}`);


  // const child = proc.spawn(binaryPath, process.argv.slice(2), { stdio: 'inherit' });
  const child = proc.spawn(binaryPath, args, { stdio: 'pipe' });
  child.stdout.on('data', data => {
    console.log('stdout:', String(data));
    stdout(data);
  });
  child.on('close', code => {
    close(code);
  });
  state.raxmlProcess = child;
}