import {
  app,
  ipcMain,
  shell,
  dialog,
  Notification,
  BrowserWindow,
} from 'electron';
import _ from 'lodash';
import path from 'path';
import util from 'util';
import _fs from 'fs';
import childProcess from 'child_process';
import { serializeError } from 'serialize-error';
import parsePath from 'parse-filepath';
import * as Sentry from '@sentry/electron/main';

import * as ipc from '../constants/ipc';
import io from '../common/io';
import { is, platform, quote } from '../common/utils';
import UserFixError from '../common/errors';
import { activeWindow } from './utils/utils';


is.development ? null : Sentry.init({
  dsn: 'https://d92efa46c2ba43f38250b202c791a2c2@o117148.ingest.sentry.io/6517975',
  maxValueLength: 2000,
});

const fs = _fs.promises;

const get_space_safe_binary_path = (bin_path) => {
  // For Windows users with spaces in user dir
  return is.windows ? `"${bin_path}"` : bin_path;
};

function handleError(title, error) {
  // send error to renderer
  console.log(`${title}:`, error);
  const win = activeWindow();
  if (win) {
    win.webContents.send(ipc.UNHANDLED_ERROR, {
      title,
      error: serializeError(error),
    });
  }
}

process.on('uncaughtException', (error) => {
  handleError('Unhandled Error', error);
});

process.on('unhandledRejection', (error) => {
  handleError('Unhandled Promise Rejection', error);
});

const exec = util.promisify(childProcess.exec);
const execFile = util.promisify(childProcess.execFile);

const state = {
  processes: {},
};

function send(event, channel, data) {
  if (!data.error) {
    return event.sender.send(channel, data);
  }
  return event.sender.send(
    channel,
    Object.assign({}, data, { error: serializeError(data.error) })
  );
}

// Init the app state with some relevant information
ipcMain.on(ipc.INIT_APP_STATE, (event) => {
  const version = app.getVersion();
  send(event, ipc.INIT_APP_STATE_RECEIVED, {
    version,
  });
});

ipcMain.on(ipc.RELOAD, () => {
  BrowserWindow.getCurrentWindow().reload();
});

ipcMain.on(ipc.OUTPUT_DIR_SELECT, (event, runId) => {
  dialog
    .showOpenDialog({
      title: 'Select a directory for RAxML output',
      properties: ['openFile', 'openDirectory'],
    })
    .then((result) => {
      console.debug(ipc.OUTPUT_DIR_SELECT, result);
      if (result.canceled) {
        return;
      }
      send(event, ipc.OUTPUT_DIR_SELECTED, {
        id: runId,
        outputDir: result.filePaths[0],
      });
    })
    .catch((err) => {
      console.debug(ipc.OUTPUT_DIR_SELECT, err);
    });
});

ipcMain.on(ipc.PARTITION_FILE_SELECT, (event, runId) => {
  dialog
    .showOpenDialog({
      title: 'Select a partition file',
      properties: ['openFile'],
    })
    .then((result) => {
      console.debug(ipc.PARTITION_FILE_SELECT, result);
      if (result.canceled) {
        return;
      }
      send(event, ipc.PARTITION_FILE_SELECTED, {
        id: runId,
        filePath: result.filePaths[0],
      });
    })
    .catch((err) => {
      console.debug(ipc.PARTITION_FILE_SELECT, err);
    });
});

// Open a file with the OS's default file handler
ipcMain.on(ipc.FILE_OPEN, (event, fullPath) => {
  console.debug(ipc.FILE_OPEN, fullPath);
  shell.openPath(fullPath);
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
      id,
      outputDir,
      outputName,
      ok: true,
      notice: '',
      outputNameUnused: outputName,
      resultFilenames: [],
    });
    return;
  }
  try {
    const filenames = await fs.readdir(outputDir);
    let outputNameUnused = outputName;
    const filterResultFilenames = (filename) =>
      filename.startsWith(`${outputNameUnused}.raxml.`) ||
      filename.endsWith(outputNameUnused) ||
      filename.endsWith(`.${outputNameUnused}.txt`) ||
      filename.endsWith(`${outputNameUnused}.tre`);
    const resultFilenamesMain = filenames.filter(filterResultFilenames);
    const filterResultFilenamesAdditional = (filename) =>
      filename.startsWith(`RAxML_GUI_ModelTest_${outputNameUnused}.`) ||
      filename.startsWith(`RAxML_GUI_Settings_${outputNameUnused}.`);
    const resultFilenamesAdditional = filenames.filter(
      filterResultFilenamesAdditional
    );
    const resultFilenames = resultFilenamesMain.concat(
      resultFilenamesAdditional
    );
    let counter = 1;
    const matchCounterName = /(\w+)_\d+$/.exec(outputName);
    const outputNameWithoutCounter = matchCounterName
      ? matchCounterName[1]
      : outputName;
    while (filenames.find(filterResultFilenames)) {
      outputNameUnused = `${outputNameWithoutCounter}_${counter}`;
      ++counter;
    }
    const ok = outputName === outputNameUnused;
    const notice = ok ? '' : `Using '${outputNameUnused}'`;
    send(event, ipc.OUTPUT_CHECKED, {
      id,
      outputDir,
      outputName,
      ok,
      notice,
      outputNameUnused,
      resultFilenames,
    });
  } catch (error) {
    console.log(ipc.OUTPUT_CHECK, 'error:', error);
    send(event, ipc.OUTPUT_CHECKED, {
      id,
      ok: false,
      notice: error.message,
      error,
      resultFilenames,
    });
  }
});

// Function to combine multiple output trees into one file
async function combineOutput(outputDir, outputFilename) {
  // Use type command on windows, cat on Mac or Linux
  const command = is.windows ? 'type' : 'cat';
  const childCmd = `${command} RAxML_result.${outputFilename}* > combined_results.${outputFilename}`;
  const { stdout, stderr } = await exec(childCmd, {
    cwd: outputDir,
    shell: is.windows,
  });
  console.log(stdout, stderr);
}

const binParentDir = app.isPackaged
  ? ''
  : platform({
      macos: 'Mac',
      windows: 'Windows',
      linux: 'Linux',
    });
const binaryDir = path.join(__static, 'bin', binParentDir);

ipcMain.on(
  ipc.RUN_START,
  async (
    event,
    {
      id,
      args,
      binaryName,
      outputDir,
      outputFilename,
      outputName,
      combinedOutput,
      usesRaxmlNg,
      usesModeltestNg,
      inputPath,
    }
  ) => {
    cancelProcess(id);

    const binaryPath = path.resolve(binaryDir, binaryName);

    console.log(
      `Run ${id}:\n  output filename id: ${outputFilename}\n  output dir: ${outputDir}\n  binary: ${binaryName}\n  binary path: ${binaryDir}\n  args:`,
      args
    );

    // Check for deleted input file
    try {
      await fs.access(inputPath);
      // The check succeeded
    } catch (err) {
      const error = new UserFixError(
        `The input file does not exist '${inputPath}': ${err.message}`
      );
      Sentry.captureException(err);
      send(event, ipc.RUN_ERROR, { id, error });
      return;
    }

    const resultFilePath = path.join(outputDir, outputFilename);
    console.log(`Try writing to output file '${resultFilePath}'...`);
    try {
      await fs.writeFile(resultFilePath, 'test');
      console.log(` -> writing to output file ok!`);
    } catch (err) {
      console.error('Error writing to output file:', err);
      const error = new Error(
        `Error trying to write to output file '${resultFilePath}': ${err.message}`
      );
      Sentry.captureException(err);
      send(event, ipc.RUN_ERROR, { id, error });
      return;
    } finally {
      try {
        fs.unlink(resultFilePath);
      } catch (err) {
        console.error(
          `Error trying to unlink temporary result file: ${err.message}`
        );
      }
    }

    console.log(`Try executing binary by running '"${binaryPath}" -v'...`);
    try {
      const { stdout, stderr } = await execFile(
        get_space_safe_binary_path(binaryPath),
        usesModeltestNg ? ['--version'] : ['-v'],
        {
          // env: { PATH: binaryDir },
          shell: is.windows,
        }
      );
      console.log(stdout);
      if (stderr) {
        console.error('Error:', stderr);
      }
    } catch (err) {
      console.error('Error executing binary:', err);
      const error = new Error(
        `Error trying to execute raxml binary '${binaryPath}': ${err.message}`
      );
      Sentry.captureException(err);
      send(event, ipc.RUN_ERROR, { id, error });
      return;
    }

    // TODO: When packaged, RAxML throws error trying to write the file RAxML_flagCheck:
    // "The file RAxML_flagCheck RAxML wants to open for writing or appending can not be opened [mode: wb], exiting ..."
    // TODO: this is just skipping a check when raxml-ng is used. Maybe make the "Sanity check" option compulsory here
    const checkFlags =
      is.development && !is.windows && !usesRaxmlNg && !usesModeltestNg;
    if (checkFlags) {
      for (const arg of args) {
        try {
          const { stdout, stderr } = await exec(
            `"${binaryPath}" ${arg.join(' ')} --flag-check`,
            {
              shell: is.windows,
            }
          );
          console.log(stdout, stderr);
        } catch (err) {
          console.error('Flag check run error:', err);
          Sentry.captureException(err);
          send(event, ipc.RUN_ERROR, { id, error: err });
          return;
        }
      }
    }

    let exitCode = 0;
    for (const arg of args) {
      try {
        console.log(`Run '${binaryName}' with args:`, arg);
        exitCode = await runProcess(id, event, binaryDir, binaryName, arg);
        if (exitCode !== 0) {
          break;
        }
      } catch (err) {
        console.error('Run error:', err);
        Sentry.captureException(err);
        send(event, ipc.RUN_ERROR, { id, error: err });
        return;
      }
    }

    if (combinedOutput) {
      console.log('Combining output...');
      await combineOutput(outputDir, outputFilename);
    }

    // Rename the RAxML_info.\*.tre into RAxML_info.\*.txt
    console.log(
      `Renaming info file 'RAxML_info\.${outputName}\.tre' -> 'RAxML_info\.${outputName}\.txt'...`
    );
    const anyMatch = new RegExp(`RAxML_info\.${outputName}\.tre`);
    const filenames = await fs.readdir(outputDir);
    const infoFiles = filenames.filter((filename) => anyMatch.test(filename));
    for (let i = 0; i < infoFiles.length; i++) {
      const infoPath = path.join(outputDir, infoFiles[i]);
      const newPath = path.join(
        outputDir,
        infoFiles[i].replace('.tre', '.txt')
      );
      await fs.rename(infoPath, newPath);
    }

    // Rename the raxml-ng output files to add .tre or .txt extension
    if (usesRaxmlNg) {
      console.log(
        `Renaming raxml-ng output files to add .tre or .txt extension...`
      );
      const anyMatch = new RegExp(`${outputName}.raxml`);
      const filenames = await fs.readdir(outputDir);
      const outputFiles = filenames.filter((filename) => anyMatch.test(filename));
      const rbaMatch = new RegExp(`${outputName}.raxml.rba`);
      const bestModelMatch = new RegExp(`${outputName}.raxml.bestModel`);
      const logMatch = new RegExp(`${outputName}.raxml.log`);
      const aPMatch = new RegExp(`${outputName}.raxml.ancestralProbs`);
      const aSMatch = new RegExp(`${outputName}.raxml.ancestralStates`);
      let renamedFiles = outputFiles.map((f) => {
        if (rbaMatch.test(f)) {
          return f;
        }
        if (bestModelMatch.test(f) || logMatch.test(f) || aPMatch.test(f) || aSMatch.test(f)) {
          return f += '.txt';
        }
        return f += '.tre';
      });
      for (let i = 0; i < outputFiles.length; i++) {
        const infoPath = path.join(outputDir, outputFiles[i]);
        const newPath = path.join(outputDir, renamedFiles[i]);
        await fs.rename(infoPath, newPath);
      }
    }


    const nextFilenames = await fs.readdir(outputDir);
    const resultFilenames = nextFilenames.filter((filename) =>
      filename.includes(outputName)
    );

    send(event, ipc.RUN_FINISHED, {
      id,
      resultDir: outputDir,
      resultFilenames,
      exitCode,
    });
  }
);

ipcMain.on(ipc.RUN_CANCEL, (event, arg) => {
  const id = arg;
  console.log(`Cancel run process ${id}...`);
  cancelProcess(id);
});

function cancelProcess(id) {
  if (state.processes[id]) {
    const proc = state.processes[id];
    delete state.processes[id];
    proc.kill();
    console.log(`Killed RAxML process ${id}`);
  }
}

function spawnProcess(binaryDir, binaryName, args) {
  const binaryPath = path.join(binaryDir, binaryName);

  const proc = childProcess.execFile(
    get_space_safe_binary_path(binaryPath),
    args,
    {
      shell: is.windows,
    }
  );
  return proc;
}

async function runProcess(
  id,
  event,
  binaryDir,
  binaryName,
  args,
  { onStdOut = () => {}, onStdErr = () => {} } = {}
) {
  return new Promise((resolve, reject) => {
    cancelProcess(id);
    try {
      const proc = spawnProcess(binaryDir, binaryName, args);
      state.processes[id] = proc;
      let exited = false;

      const exit = ({ event, code, signal, error }) => {};

      proc.stdout.on('data', (buffer) => {
        const content = String(buffer);
        console.log('on stdout:', content);
        onStdOut(content);
        send(event, ipc.RUN_STDOUT, { id, content });
      });

      proc.stderr.on('data', (buffer) => {
        const content = String(buffer);
        console.error('on stderr:', content);
        onStdErr(content);
        send(event, ipc.RUN_STDERR, { id, content });
      });

      const onQuit = (message) => (code, signal) => {
        if (exited) {
          return;
        }
        console.log(
          `Process finished with event '${message}' and error/code/signal:`,
          signal || code
        );
        exited = true;
        delete state.processes[id];

        const win = activeWindow();
        if (!win || !win.isFocused()) {
          const notification = new Notification({
            title: app.name,
            body: 'Calculation finished',
          });
          notification.show();
        }

        if (message === 'error') {
          return reject(code); // code is an error object on 'error' event
        }
        if (!code) {
          return resolve(signal || code); // Add code last to get through code 0
        }
        return reject(
          new Error(
            `Exited with code ${
              signal || code
            }. Check console output for more information.`
          )
        );
      };

      ['error', 'exit', 'close'].forEach((message) => {
        proc.on(message, onQuit(message));
      });
    } catch (err) {
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

// Function to get an alignment format with readal
async function readalGetFormat(alignmentPath) {
  const readalPath = path.resolve(binaryDir, 'readal');
  //TODO: Wrap readalPath in quotes?!
  const childCmd = `${readalPath} -in ${alignmentPath} -type -format`;
  const { stdout, stderr } = await exec(childCmd, {
    shell: is.windows,
  });
  console.log('Readal stderr', stderr);
  const replaced = stdout.replace(alignmentPath, '');
  const formats = ['clustal', 'fasta', 'nbrf', 'nexus', 'mega', 'phylip'];
  for (let i = 0; i < formats.length; i++) {
    const f = formats[i];
    if (replaced.includes(f)) {
      return f;
    }
  }
  return;
}

// Function to convert an alignment to fasta with readal
async function convertAlignment(alignmentPath) {
  const readalPath = path.resolve(binaryDir, 'readal');
  const newPath = alignmentPath.replace(path.extname(alignmentPath), '.fas');
  //TODO: Wrap readalPath in quotes?!
  const childCmd = `${readalPath} -in ${alignmentPath} -out ${newPath} -fasta`;
  const { stdout, stderr } = await exec(childCmd, {
    shell: is.windows,
  });
  console.log(stdout, stderr);
  return newPath;
}

// // Receive a new batch of alignments dropped into the app
ipcMain.on(ipc.ALIGNMENT_PARSE_REQUEST, async (event, { id, filePath }) => {
  console.log('Parse alignment', filePath);
  let format;
  let newFilePath;
  let converted;
  let modified;
  let modificationMessages = [];
  // Use readal to check the alignment file format
  try {
    format = await readalGetFormat(filePath);
    if (format !== 'fasta' && format !== 'phylip') {
      newFilePath = await convertAlignment(filePath);
      converted = true;
    }
  } catch (error) {
    console.log('error', error);
  }

  try {
    const actualPath = newFilePath ? newFilePath : filePath;
    const alignment = await io.parseAlignment(actualPath);

    // Check if duplicate or invalid taxon names
    const taxons = new Map();
    let identicalCounter = 0;
    alignment.sequences.forEach(async (sequence, index) => {
      // If the taxon name is longer than 256 characters raxml will error out
      if (sequence.taxon.length > 256) {
        const message = `Taxon name is too long: '${sequence.taxon}'.`;
        console.log(message);
        // Shorten the invalid taxon name
        alignment.sequences[index].taxon = sequence.taxon.slice(0, 253);
        modified = true;
        modificationMessages.push(message);
      }

      const ind = taxons.get(sequence.taxon);
      // Check if a sequence with this name is already in the map
      if (ind !== undefined) {
        const message = `Identical sequence names: ${ind + 1} and ${
          index + 1
        } = ${sequence.taxon}`;
        console.log(message);
        // Add a digit to the end of the second sequence
        identicalCounter++;
        alignment.sequences[
          index
        ].taxon = `${sequence.taxon}_${identicalCounter}`;
        modified = true;
        modificationMessages.push(message);
      }

      // If the taxon name has one of those characters raxml will error out
      const excludedCharacters = [':', ',', '.', '(', ')', '[', ']', ';', "'"];
      // Test white-space characters and excluded characters above
      const testInvalid = new RegExp(
        `[\\s${excludedCharacters.map((c) => `\\${c}`).join('')}]`,
        'g'
      );
      if (testInvalid.test(sequence.taxon)) {
        const message = `Illegal characters in sequence name = taxon '${sequence.taxon}' found.`;
        console.log(message);
        // Replace the invalid characters in taxon names with underscores
        alignment.sequences[index].taxon = sequence.taxon.replace(
          testInvalid,
          '_'
        );
        modified = true;
        modificationMessages.push(message);
      }

      // Add this taxon to the map for checking
      taxons.set(sequence.taxon, index);
    });

    if (modified) {
      // Write the new alignment to file
      const baseName = path.basename(actualPath, path.extname(actualPath));
      newFilePath = actualPath.replace(baseName, `${baseName}_modified`);
      await io.writeAlignment(newFilePath, alignment);
    }

    send(event, ipc.ALIGNMENT_PARSE_SUCCESS, { id, alignment });
    if (newFilePath) {
      send(event, ipc.ALIGNMENT_PARSE_CHANGED_PATH, {
        id,
        newFilePath,
        format,
        converted,
        modified,
        modificationMessages,
      });
    }
  } catch (error) {
    send(event, ipc.ALIGNMENT_PARSE_FAILURE, { id, error });
  }
});

// Open a dialog to select alignments
ipcMain.on(ipc.ALIGNMENT_SELECT, (event, runId) => {
  dialog
    .showOpenDialog({
      title: 'Select an alignment',
      properties: ['openFile', 'multiSelections'],
    })
    .then((result) => {
      console.debug(ipc.ALIGNMENT_SELECTED, result);
      if (result.canceled) {
        return;
      }
      const alignments = result.filePaths.map((filePath) => {
        return {
          path: filePath,
          name: path.basename(filePath),
        };
      });
      send(event, ipc.ALIGNMENT_SELECTED, { id: runId, alignments });
    })
    .catch((err) => {
      console.debug(ipc.ALIGNMENT_SELECTED, err);
    });
});

// Open a dialog to select astral input trees
ipcMain.on(ipc.ASTRAL_FILE_SELECT, (event, runId) => {
  dialog
    .showOpenDialog({
      title: 'Select an input trees file',
      properties: ['openFile'],
    })
    .then((result) => {
      console.debug(ipc.ASTRAL_FILE_SELECTED, result);
      if (result.canceled) {
        return;
      }
      const files = result.filePaths.map((filePath) => {
        return {
          path: filePath,
          name: path.basename(filePath),
        };
      });
      send(event, ipc.ASTRAL_FILE_SELECTED, { id: runId, file: files[0] });
    })
    .catch((err) => {
      console.debug(ipc.ASTRAL_FILE_SELECTED, err);
    });
});

ipcMain.on(ipc.ALIGNMENT_EXAMPLE_FILES_GET_REQUEST, async (event) => {
  // __static is defined by electron-webpack
  const dir = path.join(__static, 'example-files');
  const outdir = path.join(__static, 'test-results');
  // Create outdir if not exists
  await fs.mkdir(outdir, { recursive: true });
  const fastaFiles = await fs.readdir(path.join(dir, 'fasta'));
  const phylipFiles = await fs.readdir(path.join(dir, 'phylip'));
  send(event, ipc.ALIGNMENT_EXAMPLE_FILES_GET_SUCCESS, {
    fasta: fastaFiles,
    phylip: phylipFiles,
    dir,
    outdir,
  });
});

ipcMain.on(ipc.ASTRAL_REQUEST, async (event, payload) => {
  const { id, binaryName, args } = payload;
  const javaBin = 'java';

  const [arg] = args;
  arg.splice(0, 0, '-jar', quote(path.join(binaryDir, binaryName)));

  let exitCode = 0;
  try {
    console.log('arg', arg)
    console.log(`ASTRAL?`);
    exitCode = await runProcess(id, event, '', javaBin, arg);
    if (exitCode !== 0) {
      if (exitCode === 'SIGTERM') {
        // Cancelled
        return;
      }
      throw new Error(
        `Error trying to run ASTRAL, exited with code '${exitCode}'.`
      );
    }
  } catch (err) {
    console.error('ASTRAL run error:', err);
    send(event, ipc.RUN_ERROR, { id, error: err });
    return;
  }

  send(event, ipc.ASTRAL_SUCCESS, {
    id,
    exitCode
  });
});

ipcMain.on(ipc.ALIGNMENT_MODEL_SELECTION_REQUEST, async (event, payload) => {
  const { id, filePath, outputDir, dataType, numThreads, binaryName } = payload;
  const { dir, name } = parsePath(filePath);

  const outputPath = path.join(outputDir, `RAxML_GUI_ModelTest_${name}`);
  try {
    // Remove binary checkpoint as that may be invalid
    await fs.unlink(`${outputPath}.ckp`);
  } catch (err) {}

  const args = [];
  if (dataType === 'nucleotide') {
    args.push('-d', 'nt');
  } else if (dataType === 'protein') {
    args.push('-d', 'aa');
  }
  // alignment file
  args.push('-i', quote(filePath));
  // output path
  args.push('-o', quote(outputPath));

  // modeltest throws errors if the output file already exists
  args.push('--force');
  // Number of processors
  args.push('-p', numThreads);

  console.log(`Alignment '${id}': Run modeltest with args ${args}...`);

  const stdOuts = [];
  const onStdOut = (content) => {
    stdOuts.push(content);
  };
  let exitCode = 0;
  try {
    console.log(`Run modeltest-ng with args:`, args);
    exitCode = await runProcess(id, event, binaryDir, binaryName, args, {
      onStdOut,
    });
    if (exitCode !== 0) {
      if (exitCode === 'SIGTERM') {
        // Cancelled
        return;
      }
      throw new Error(
        `Error trying to run modeltest-ng, exited with code '${exitCode}'.`
      );
    }
  } catch (err) {
    console.error('Modeltest run error:', err);
    send(event, ipc.ALIGNMENT_MODEL_SELECTION_FAILURE, { id, error: err });
    return;
  }

  // Parse stdout to get the best models
  console.log('Parse output from modeltest-ng...');
  const commands = stdOuts.join('').split('\n');

  try {
    // Each '> [program]' is written three times, for BIC, AIC and AICc respectively. Use AICc.
    const cmdRaxml = commands.filter((cmd) =>
      cmd.startsWith('  > raxmlHPC-SSE3')
    )[2];
    const cmdRaxmlNG = commands.filter((cmd) =>
      cmd.startsWith('  > raxml-ng')
    )[2];

    const modelRaxml = /-m (\S+)/.exec(cmdRaxml)[1];
    const extraFlag = /--(\S+)/.exec(cmdRaxml)?.[0];
    const modelRaxmlNG = /--model (\S+)/.exec(cmdRaxmlNG)[1];

    console.log(`-> raxml: ${modelRaxml}, extraFlag: ${extraFlag}, raxml-ng: ${modelRaxmlNG}`);

    send(event, ipc.ALIGNMENT_MODEL_SELECTION_SUCCESS, {
      id,
      result: {
        raxml: modelRaxml,
        extraFlag,
        raxmlNG: modelRaxmlNG,
      },
    });
  } catch (err) {
    console.error(`Couldn't parse best models from modeltest-ng output:`, err);
    console.log('output:', commands);
    const error = new Error(
      `Couldn't parse best models from modeltest-ng output. Check alignment log.`
    );
    error.name = 'Modeltest error';
    send(event, ipc.ALIGNMENT_MODEL_SELECTION_FAILURE, { id, error });
  }
});

ipcMain.on(ipc.ALIGNMENT_MODEL_SELECTION_CANCEL, (event, id) => {
  console.log(`Cancel modeltest process ${id}...`);
  cancelProcess(id);
});

// Open a dialog to select a tree file
ipcMain.on(ipc.TREE_SELECT, (event, params) => {
  const { id, type } = params;
  dialog
    .showOpenDialog(
      {
        title: 'Select a tree file',
        properties: ['openFile'],
      },
      (filePaths) => {
        if (filePaths.length === 0) {
          return;
        }
      }
    )
    .then((result) => {
      console.debug(ipc.TREE_SELECT, result);
      if (result.canceled) {
        return;
      }
      send(event, ipc.TREE_SELECTED, {
        id,
        type,
        filePath: result.filePaths[0],
      });
    })
    .catch((err) => {
      console.debug(ipc.TREE_SELECT, err);
    });
});
