import path from 'path';
import proc from 'child_process';
import os from 'os';

import { binariesDir } from '../utils/binaries';
import { sendToMainWindow } from '../communication';

import {
  CALCULATION_END_IPC,
  CALCULATION_CANCELED_IPC
} from '../../constants/ipc';

const state = {
  raxmlProcesses: {}
};

export function runRaxmlWithArgs(runPath, args, { stdout, close }) {
  console.log('runRaxmlWithArgs');
  console.log('runPath', runPath);
  // TODO: the hardcoded mac binary has to be replaced, it should be the same name for all in the production build folder. There are some settings to change the  extra file name in the build part of package.json with electron-builder package
  const binaryName = `raxmlHPC-PTHREADS-SSE3-Mac`;
  const binaryPath = path.resolve(binariesDir, binaryName);

  console.log('binariesPath', binaryPath);

  // TODO place the transformation of args array here and call this fct directly with object
  // TODO refactor Daniels fct call into object for args
  return new Promise((resolve, reject) => {
    const child = proc.spawn(binaryPath, args, { cwd: os.homedir(), stdio: 'pipe' });
    child.stdout.on('data', data => {
      stdout(data);
    });
    child.on('close', code => {
      close(code);
      resolve(code);
    });
    child.on('error', error => {
      console.log('Child process errored out', error);
      close(error);
      reject(error);
    });
    state.raxmlProcesses[runPath] = child;
  })
}

export function cancelCalculations(run) {
  console.log('Canceling raxml process?', !!state.raxmlProcesses);
  if (state.raxmlProcesses[run.path]) {
    console.log('Canceling raxml process...');
    state.raxmlProcesses[run.path].kill();
    // TODO Daniel? Why 0 here. Calc is not finished
    run.code = 0;
    sendToMainWindow(CALCULATION_CANCELED_IPC, { run });
    sendToMainWindow(CALCULATION_END_IPC, { run });
  }
}
