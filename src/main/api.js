import { app, ipcMain, shell, dialog } from "electron";
import _ from "lodash";
import path from "path";
import util from "util";
import fs from "fs";
import childProcess from 'child_process';
import isDev from 'electron-is-dev';
import serializeError from 'serialize-error';
import { activeWindow } from 'electron-util';
import io from '../common/io';

import * as ipc from "../constants/ipc";
import electronUtil from 'electron-util';
import unhandled from 'electron-unhandled';
import { reportIssue, getMailtoLinkToReportError } from "../common/utils";

// unhandled({
//   showDialog: true,
// 	reportButton: reportIssue,
// });

function handleError(title, error) {
  // send error to renderer
  console.log(`${title}:`, error);
  const win = activeWindow();
  if (win) {
    win.webContents.send(ipc.UNHANDLED_ERROR, { title, error: serializeError(error) });
  }
}

process.on('uncaughtException', error => {
  handleError('Unhandled Error', error);
});

process.on('unhandledRejection', error => {
  handleError('Unhandled Promise Rejection', error);
});

const exec = util.promisify(childProcess.exec);
const readdir = util.promisify(fs.readdir);

const state = {
  processes: {},
};

function send(event, channel, data) {
  if (!data.error) {
    return event.sender.send(channel, data);
  }
  return event.sender.send(channel, Object.assign({}, data, { error: serializeError(data.error) }));
}


ipcMain.on(ipc.OUTPUT_DIR_SELECT, (event, runId) => {
  dialog.showOpenDialog({
    title: 'Select a directory for RAxML output',
    properties: ['openDirectory', 'createDirectory'],
  }, paths => {
    if (paths.length === 0) { // On cancel
      return;
    }
    send(event, ipc.OUTPUT_DIR_SELECTED, { id: runId, outputDir: paths[0] });
  });
});

// Open a file with the OS's default file handler
ipcMain.on(ipc.FILE_OPEN, (event, fullPath) => {
  console.debug(ipc.FILE_OPEN, fullPath);
  shell.openItem(fullPath);
});

// Open a file in it's folder with native file explorer
ipcMain.on(ipc.FILE_SHOW_IN_FOLDER, (event, fullPath) => {
  console.debug(ipc.FILE_SHOW_IN_FOLDER, fullPath);
  shell.showItemInFolder(fullPath);
});

// Open a folder
ipcMain.on(ipc.FOLDER_OPEN, (event, fullPath) => {
  console.debug(ipc.FOLDER_OPEN, fullPath);
  shell.showItemInFolder(fullPath);
});

// Check if raxml output files already exist with current name
ipcMain.on(ipc.OUTPUT_CHECK, async (event, data) => {
  const { id, outputDir, outputName } = data;
  const outputFilename = `${outputName}.tre`;
  console.log('Check unused filename:', outputFilename);
  if (!outputDir) {
    send(event, ipc.OUTPUT_CHECKED, {
      id, outputDir, outputName,
      ok: true, notice: '', outputNameUnused: outputName,
      resultFilenames: [],
    });
    return;
  }
  try {
    const filenames = await readdir(outputDir);
    let outputNameUnused = outputName;
    const filterResultFilenames = filename =>
      filename.includes(`${outputNameUnused}.raxml.`) ||
      filename.endsWith(outputNameUnused) ||
      filename.endsWith(`${outputNameUnused}.tre`);
    const resultFilenames = filenames.filter(filterResultFilenames)
    let counter = 1;
    const matchCounterName = /(\w+)_\d+$/.exec(outputName);
    const outputNameWithoutCounter = matchCounterName ? matchCounterName[1] : outputName;
    while (filenames.find(filterResultFilenames)) {
      outputNameUnused = `${outputNameWithoutCounter}_${counter}`;
      ++counter;
    }
    const ok = outputName === outputNameUnused;
    const notice = ok ? '' : `Using '${outputNameUnused}'`;
    send(event, ipc.OUTPUT_CHECKED, {
      id, outputDir, outputName, ok, notice, outputNameUnused, resultFilenames
    });
  }
  catch (error) {
    console.log(ipc.OUTPUT_CHECK, 'error:', error);
    send(event, ipc.OUTPUT_CHECKED, {
      id, ok: false, notice: error.message, error, resultFilenames
    });
  }
});

// Function to combine multiple output trees into one file
async function combineOutput(outputDir, outputFilename) {
  // Use type command on windows, cat on Mac or Linux
  const command = electronUtil.is.windows ? 'type' : 'cat';
  const childCmd = `${command} RAxML_result.${outputFilename}* > combined_results.${outputFilename}`;
  const { stdout, stderr } = await exec(childCmd, {
    cwd: outputDir,
    shell: electronUtil.is.windows
  });
  console.log(stdout, stderr);
}

ipcMain.on(ipc.RUN_START, async (event, { id, args, binaryName, outputDir, outputFilename, outputName, combinedOutput, usesRaxmlNg }) => {
  cancelProcess(id);

  const binParentDir = app.isPackaged ? '' : electronUtil.platform({
    macos: 'Mac',
    windows: 'Windows',
    linux: 'Linux',
  });
  const binaryDir = path.join(__static, 'bin', binParentDir);
  const binaryPath = path.resolve(binaryDir, binaryName);

  console.log(`Run ${id}:\n  output filename id: ${outputFilename}\n  output dir: ${outputDir}\n  binary: ${binaryName}\n  binary path: ${binaryDir}\n  args:`, args);

  // TODO: When packaged, RAxML throws error trying to write the file RAxML_flagCheck:
  // "The file RAxML_flagCheck RAxML wants to open for writing or appending can not be opened [mode: wb], exiting ..."
  // TODO: this is just skipping a check when raxml-ng is used. Maybe make the "Sanity check" option compulsory here
  const checkFlags = isDev && !electronUtil.is.windows && !usesRaxmlNg;
  if (checkFlags) {
    for (const arg of args) {
      try {
        const { stdout, stderr } = await exec(`${binaryPath} ${arg.join(' ')} --flag-check`, {
          shell: electronUtil.is.windows,
        });
        console.log(stdout, stderr);
      }
      catch (err) {
        console.error('Flag check run error:', err);
        send(event, ipc.RUN_ERROR, { id, error: err });
        return;
      }
    }
  }

  let exitCode = 0;
  for (const arg of args) {
    try {
      console.log(`Run ${binaryName} with args:`, arg)
      exitCode = await runProcess(id, event, binaryPath, arg);
      if (exitCode !== 0) {
        break;
      }
    }
    catch (err) {
      console.error('Run error:', err);
      send(event, ipc.RUN_ERROR, { id, error: err });
      return;
    }
  }

  if (combinedOutput) {
    await combineOutput(outputDir, outputFilename);
  }

  const filenames = await readdir(outputDir);
  const resultFilenames = filenames.filter(filename => filename.includes(outputName));

  send(event, ipc.RUN_FINISHED, { id, resultDir: outputDir, resultFilenames, exitCode });

});

ipcMain.on(ipc.RUN_CANCEL, (event, arg) => {
  const id = arg;
  console.log(`Cancel raxml process ${id}...`);
  cancelProcess(id);
  // send(event, ipc.RUN_CLOSED, { id });
});

function cancelProcess(id) {
  if (state.processes[id]) {
    const proc = state.processes[id];
    delete state.processes[id];
    proc.kill();
    console.log(`Killed RAxML process ${id}`);
  }
}

function spawnProcess(binaryPath, args) {
  // const binaryDir = path.dirname(binaryPath);
  // const binaryName = path.basename(binaryPath);

  const proc = childProcess.execFile(binaryPath, args, {
    // stdio: 'pipe',
    // cwd: os.homedir(),
    // env: { PATH: `${process.env.path}:${binaryDir}` },
    shell: electronUtil.is.windows,
  });
  return proc;
}

async function runProcess(id, event, binaryPath, args) {
  return new Promise((resolve, reject) => {

    cancelProcess(id);
    try {

      const proc = spawnProcess(binaryPath, args);
      state.processes[id] = proc;
      let exited = false;

      const exit = ({ event, code, signal, error }) => {

      }

      proc.stdout.on('data', buffer => {
        const content = String(buffer);
        console.log('on stdout:', content);
        send(event, ipc.RUN_STDOUT, { id, content });
      });

      proc.stderr.on('data', buffer => {
        const content = String(buffer);
        console.log('on stderr:', content);
        send(event, ipc.RUN_STDERR, { id, content });
      });

      const onQuit = message => (code, signal) => {
        if (exited) { return; }
        console.log(`Process finished with event '${message}' and error/code/signal:`, signal || code);
        exited = true;
        delete state.processes[id];
        if (message === 'error') {
          return reject(code); // code is an error object on 'error' event
        }
        if (!code) {
          return resolve(signal || code); // Add code last to get through code 0
        }
        return reject(new Error(`Exited with code ${signal || code}. Check console output for more information.`));
      }

      ['error', 'exit', 'close'].forEach(message => {
        proc.on(message, onQuit(message));
      });

    }
    catch (err) {
      console.log('Run catch error:', err);
      reject(err);
    }
  });
}

// Send promise with exit code and stdout
async function execProcess(binaryPath, args) {
  // const binaryDir = path.dirname(binaryPath);
  // const binaryName = path.basename(binaryPath);
  return exec(`${binaryPath} ${args.join(' ')}`);
}

// // Receive a new batch of alignments dropped into the app
ipcMain.on(ipc.ALIGNMENT_PARSE_REQUEST, async (event, { id, filePath }) => {
  console.log('Parse alignment', filePath);
  try {
    const alignment = await io.parseAlignment(filePath);
    send(event, ipc.ALIGNMENT_PARSE_SUCCESS, { id, alignment });
  }
  catch (error) {
    send(event, ipc.ALIGNMENT_PARSE_FAILURE, { id, error });
  }
});

// Open a dialog to select alignments
ipcMain.on(ipc.ALIGNMENT_SELECT, (event) => {
  dialog.showOpenDialog({
    title: 'Select an alignment',
    properties: ['openFile', 'multiSelections']
  }, filePaths => {
    if (filePaths.length === 0) { return; }
    const alignments = filePaths.map(filePath => {
    return {
        path: filePath,
        name: path.basename(filePath)
      };
    });
    send(event, ipc.ALIGNMENT_SELECTED, alignments);
  });
});




// Open a folder with native file explorer in given path
ipcMain.on(ipc.ALIGNMENT_EXAMPLE_FILES_GET_REQUEST, async (event) => {
  // __static is defined by electron-webpack
  // const dir = path.join(__static, 'example-files', 'fasta');
  const dir = path.join(__static, 'example-files');
  // const dir = path.join(__static, 'example-files', 'phylip');
  const fastaFiles = await readdir(path.join(dir, 'fasta'));
  const phylipFiles = await readdir(path.join(dir, 'phylip'));
  send(event, ipc.ALIGNMENT_EXAMPLE_FILES_GET_SUCCESS, {
    fasta: fastaFiles,
    phylip: phylipFiles,
    dir,
  });
});


// Open a dialog to select a file
ipcMain.on(ipc.TREE_SELECT, (event, runId) => {
  console.log('api', ipc.TREE_SELECT);
  dialog.showOpenDialog({
    title: 'Select a tree file',
    properties: ['openFile']
  }, filePaths => {
    if (filePaths.length === 0) { return; }
    send(event, ipc.TREE_SELECTED, { id: runId, filePath: filePaths[0] });
  });
});
