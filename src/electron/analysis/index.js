import _ from 'lodash';
import { exec } from 'child_process';

import { sendToMainWindow } from '../communication';
import { transformArgsToArray, checkIfExists } from '../utils';
import { runRaxmlWithArgs } from './run';

import RAXMLError from '../../errors';
import {
  CALCULATION_PROGRESS_IPC,
  CALCULATION_ERROR_IPC,
  CALCULATION_START_IPC,
  CALCULATION_END_IPC
} from '../../constants/ipc';

function makeStandardRun(run, arrayArgs) {
  console.log('makeStandardRun');
  return new Promise((resolve, reject) => {
    runRaxmlWithArgs(run.path, arrayArgs, {
      stdout: data => {
        // Parsing the stdout of the run as string
        const dataString = String(data);
        // If the run had a warning in stdout
        if (dataString.toLowerCase().includes('warning')) {
          console.log("Run stdout: WARNING encountered:", dataString);
        }
        run.data = dataString;
        sendToMainWindow(CALCULATION_PROGRESS_IPC, { run });
      },
      close: code => {
        // code = 255: RAxML errored out ??????
        run.code = code;
        console.log('RAxML exit code', code);
        if (code === 255) {
          console.log('Run stdout close: Error code given for RAxML.');
          // Send all text after the word error along as error message
          // TODO don't know if that is helpfull in any way, yet
          const message = run.data.toLowerCase().split('error');
          const error = message[message.length - 1];
          sendToMainWindow(CALCULATION_ERROR_IPC, { run, error });
          reject(error);
        } else if (code === 0) {
          // code = 0: everything ok ???
          console.log('Run stdout close: Code equals 0, i.e. success');
          // TODO refactor to be a list of results
          resolve(run);
        } else {
          // TODO if this happens something is not set properly
          // TODO use some error sentry
          console.log('RAxML exit code', code);
          reject(new RAXMLError('RAxML exited with non-standard error'));
        }
      }
    });
  });
}

export function startRuns(runs) {
  console.log('startRuns');
  _.each(runs, run => {
    if (!run.argsList) {
      console.log('No args list given');
    }
    // Send to client that run has started being calculated
    sendToMainWindow(CALCULATION_START_IPC, { run });
    // Window options for the run window
    const runWindowOptions = {
      width: 640,
      height: 740,
      title: run.path,
      resizable: true,
      // This is essential, to avoid being throttled when in the background,
      webPreferences: { backgroundThrottling: false }
    };
    // TODO: Open a new window to show the run progress was in the old UI, now should be in main window
    // windowManager.open(
    //   run.path,
    //   null,
    //   `{appBase}?runWindow#${run.path}`,
    //   null,
    //   runWindowOptions,
    //   false
    // );

    // Perform the selected main analysis type
    console.log(run.analysisType);
    switch (run.analysisType) {
      case 'FT':
        makeFT(run);
        break;
      case 'ML':
        makeML(run);
        break;
      case 'ML+BS':
        makeMLrBS(run);
        break;
      case 'ML+tBS':
        makeMLtBS(run);
        break;
      case 'BS+con':
        makeBScon(run);
        break;
      case 'AS':
        makeAS(run);
        break;
      case 'PD':
        makePD(run);
        break;
      case 'RBS':
        makeRBS(run);
        break;
      default:
        break;
    }
  });
}

function makeFT(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  const i = run.argsList.length;
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  // TODO: I am sure this can be written much more elegant, I'd be more than happy if someone can show me
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      // If there are not more than one RAxML calls
      if (i === 1) {
        sendToMainWindow(CALCULATION_END_IPC, { run });
        return run;
      }
      // TODO: this can be a SH search without brL prior, so names are wrong
      const argsOne = run.argsList[1];
      argsOne.t = `${args.w}/RAxML_fastTree.${args.n}`;
      argsOne.n = `brL.${args.n}`;
      const arrayArgsOne = transformArgsToArray(argsOne);
      console.log('The second args:');
      console.log(argsOne);
      // Check if the input file still exists
      // TODO: if not show error UI
      checkIfExists(argsOne.s);
      // Check if the result of the previous call still exists
      // TODO: what to do if not
      checkIfExists(argsOne.t);
      return makeStandardRun(run, arrayArgsOne)
        .then(run => {
          // The second analysis is finished successfully
          console.log('Finished 2 successful: ', run.path);
          // If there are not more than two RAxML calls
          if (i === 2) {
            sendToMainWindow(CALCULATION_END_IPC, { run });
            return run;
          }
          const argsTwo = run.argsList[2];
          argsTwo.t = `${args.w}/RAxML_fastTree.${args.n}`;
          argsTwo.n = `SH.${args.n}`;
          const arrayArgsTwo = transformArgsToArray(argsTwo);
          console.log('The third args:');
          console.log(argsTwo);
          // Check if the input file still exists
          // TODO: if not show error UI
          checkIfExists(argsTwo.s);
          // Check if the result of the previous call still exists
          // TODO: what to do if not
          checkIfExists(argsTwo.t);
          return makeStandardRun(run, arrayArgsTwo)
            .then(run => {
              // The second analysis is finished successfully
              console.log('Finished 3 successful: ', run.path);
              sendToMainWindow(CALCULATION_END_IPC, { run });
              return run;
            })
            .catch(error => console.log('Error: ', error));
          }
        )
        .catch(error => console.log('Error: ', error));
      }
    )
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}

function combineOutput(args) {
  console.log('Combining the results of this run');
  const childCmd = `cat RAxML_result.${args.n}* > combined_results.${args.n}`;
  const child = exec(childCmd, { cwd: args.w });
  child.stdout.on('data', data => {
    console.log("stdout on data:", String(data));
  });
  child.on('close', code => {
    console.log('stdout on close', code);
  });
  child.on('error', error => {
    console.log('Child process errored out', error);
  });
}

function makeML(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  const i = run.argsList.length;
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      // If there are not more than one RAxML calls
      if (i === 1) {
        if (run.combineOutput) {
          combineOutput(args);
        }
        sendToMainWindow(CALCULATION_END_IPC, { run });
        return run;
      }
      // If there are more than one RAxML calls, e.g. SH-like
      const argsOne = run.argsList[1];
      argsOne.t = `${args.w}/RAxML_bestTree.${args.n}`;
      argsOne.n = `SH.${args.n}`;
      const arrayArgsOne = transformArgsToArray(argsOne);
      console.log('The second args:');
      console.log(argsOne);
      // Check if the input file still exists
      // TODO: if not show error UI
      checkIfExists(argsOne.s);
      // Check if the result of the previous call still exists
      // TODO: what to do if not
      checkIfExists(argsOne.t);
      return makeStandardRun(run, arrayArgsOne)
        .then(run => {
          // The second analysis is finished successfully
          console.log('Finished 2 successful: ', run.path);
          if (run.combineOutput) {
            combineOutput(args);
          }
          sendToMainWindow(CALCULATION_END_IPC, { run });
          return run;
        })
        .catch(error => console.log('Error: ', error));
      }
    )
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}

function makeMLrBS(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  args.x = Date.now();
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      sendToMainWindow(CALCULATION_END_IPC, { run });
      return run;
    })
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}

function makeMLtBS(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  args.b = Date.now();
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  // TODO: I am sure this can be written much more elegant, I'd be more than happy if someone can show me
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      const argsOne = run.argsList[1];
      argsOne.n = `B_${args.n}`;
      const arrayArgsOne = transformArgsToArray(argsOne);
      console.log('The second args:');
      console.log(argsOne);
      // Check if the input file still exists
      // TODO: if not show error UI
      checkIfExists(argsOne.s);
      return makeStandardRun(run, arrayArgsOne)
        .then(run => {
          // The second analysis is finished successfully
          console.log('Finished 2 successful: ', run.path);
          const argsTwo = run.argsList[2];
          argsTwo.t = `${args.w}/RAxML_bestTree.B_${args.n}`;
          argsTwo.z = `${args.w}/RAxML_bootstrap.${args.n}`;
          argsTwo.n = `${args.n}_final`;
          const arrayArgsTwo = transformArgsToArray(argsTwo);
          console.log('The third args:');
          console.log(argsTwo);
          // Check if the input file still exists
          // TODO: if not show error UI
          checkIfExists(argsTwo.s);
          // Check if the result of the first call still exists
          // TODO: what to do if not
          checkIfExists(argsTwo.t);
          // Check if the result of the second call still exists
          // TODO: what to do if not
          checkIfExists(argsTwo.z);
          return makeStandardRun(run, arrayArgsTwo)
            .then(run => {
              // The second analysis is finished successfully
              console.log('Finished 3 successful: ', run.path);
              sendToMainWindow(CALCULATION_END_IPC, { run });
              return run;
            })
            .catch(error => console.log('Error: ', error));
        })
        .catch(error => console.log('Error: ', error));
    })
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}

function makeBScon(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  // TODO: I am sure this can be written much more elegant, I'd be more than happy if someone can show me
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      const argsOne = run.argsList[1];
      argsOne.z = `${args.w}/RAxML_bootstrap.${args.n}`;
      argsOne.n = `con.${args.n}`;
      const arrayArgsOne = transformArgsToArray(argsOne);
      console.log('The second args:');
      console.log(argsOne);
      // Check if the input file still exists
      // TODO: if not show error UI
      checkIfExists(argsOne.s);
      // Check if the input file still exists
      // TODO: if not show error UI
      checkIfExists(argsOne.z);
      return makeStandardRun(run, arrayArgsOne)
        .then(run => {
          // The second analysis is finished successfully
          console.log('Finished 2 successful: ', run.path);
          sendToMainWindow(CALCULATION_END_IPC, { run });
          return run;
        })
        .catch(error => console.log('Error: ', error));
    })
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}

function makeAS(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  // TODO: there is no -t set for this, needs input component
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      sendToMainWindow(CALCULATION_END_IPC, { run });
      return run;
    })
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}

function makePD(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      sendToMainWindow(CALCULATION_END_IPC, { run });
      return run;
    })
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}

function makeRBS(run) {
  // Get the args of the first run
  const args = run.argsList[0];
  // Chaining on the different RAxML runs to be performed for one specific analysis
  // i.e. if a settings needs seperate RAxML calls, wait for the previous to finish then next one
  const arrayArgs = transformArgsToArray(args);
  console.log('The first args:');
  console.log(args);
  // Check if the input file still exists
  // TODO: if not show error UI
  checkIfExists(args.s);
  makeStandardRun(run, arrayArgs)
    .then(run => {
      // The fast tree analysis is finished successfully
      console.log('Finished 1 successful: ', run.path);
      sendToMainWindow(CALCULATION_END_IPC, { run });
      return run;
    })
    .catch(error => console.log('Error: ', error));
  // TODO send back meaningfull responses for:
  // calculation:progress
  // calculation:end
  // calculation:error
  // console.log(arrayArgs);
}
