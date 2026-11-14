import path from 'path';
import util from 'util';
import _fs from 'fs';
import childProcess from 'child_process';
import type { ExecOptions } from 'child_process';
import type { IpcMainEvent } from 'electron';
import * as Sentry from '@sentry/electron/main';
import * as ipc from '../constants/ipc';
import { is } from '../common/utils';
import UserFixError from '../common/errors';
import {
  beginRun,
  finishedRun,
  stillRunning,
  stopRun,
} from './cancelRun';
import {
  binaryDir,
  get_space_safe_binary_path,
  runProcess,
  send,
} from './processHelpers';

const fs = _fs.promises;
const exec = util.promisify( childProcess.exec );
const execFile = util.promisify( childProcess.execFile );

type RunId = number;

type ProcessExit =
  | 'SIGTERM'
  | number
  | NodeJS.Signals
  | null;

interface StartRunPayload {
  id: RunId;
  args: string[][];
  binaryName: string;
  outputDir: string;
  outputFilename: string;
  outputName: string;
  combinedOutput: boolean;
  usesRaxmlNg: boolean;
  usesModeltestNg: boolean;
  inputPath: string;
}

async function combineOutput( outputDir: string, outputFilename: string ): Promise<void> {
  // Use type command on windows, cat on Mac or Linux
  const command = is.windows
    ? 'type'
    : 'cat';
  const childCmd = `${command} RAxML_result.${outputFilename}* > combined_results.${outputFilename}`;
  const { stdout, stderr } = await exec( childCmd, {
    cwd: outputDir,
    ...( is.windows
      ? { shell: true }
      : {} ),
  } as unknown as ExecOptions );
  console.log( stdout, stderr );
}

export async function startRun( event: IpcMainEvent, { id, args, binaryName, outputDir, outputFilename, outputName, combinedOutput, usesRaxmlNg, usesModeltestNg, inputPath }: StartRunPayload ): Promise<void> {
  const token = beginRun( id );
  stopRun( id );
  const reportError = ( error: unknown ): void => {
    if ( !stillRunning( id, token ) ) {
      return;
    }
    send( event, ipc.RUN_ERROR, { id, error } );
  };
  const binaryPath = path.resolve( binaryDir, binaryName );
  console.log( `Run ${id}:\n  output filename id: ${outputFilename}\n  output dir: ${outputDir}\n  binary: ${binaryName}\n  binary path: ${binaryDir}\n  args:`, args );
  // Check for deleted input file
  try {
    await fs.access( inputPath );
    // The check succeeded
  }
  catch ( err: unknown ) {
    const error = new UserFixError( `The input file does not exist '${inputPath}': ${( err as Error ).message}` );
    Sentry.captureException( err );
    reportError( error );
    return;
  }
  const resultFilePath = path.join( outputDir, outputFilename );
  console.log( `Try writing to output file '${resultFilePath}'...` );
  try {
    await fs.writeFile( resultFilePath, 'test' );
    console.log( ` -> writing to output file ok!` );
  }
  catch ( err: unknown ) {
    console.error( 'Error writing to output file:', err );
    const error = new Error( `Error trying to write to output file '${resultFilePath}': ${( err as Error ).message}` );
    Sentry.captureException( err );
    reportError( error );
    return;
  }
  finally {
    try {
      fs.unlink( resultFilePath );
    }
    catch ( err: unknown ) {
      console.error( `Error trying to unlink temporary result file: ${( err as Error ).message}` );
    }
  }
  console.log( `Try executing binary by running '"${binaryPath}" -v'...` );
  try {
    const { stdout, stderr } = await execFile( get_space_safe_binary_path( binaryPath ), usesModeltestNg
      ? ['--version']
      : ['-v'], {
      // env: { PATH: binaryDir },
      shell: is.windows,
    } );
    console.log( stdout );
    if ( stderr ) {
      console.error( 'Error:', stderr );
    }
  }
  catch ( err: unknown ) {
    console.error( 'Error executing binary:', err );
    const error = new Error( `Error trying to execute raxml binary '${binaryPath}': ${( err as Error ).message}` );
    Sentry.captureException( err );
    reportError( error );
    return;
  }
  // TODO: When packaged, RAxML throws error trying to write the file RAxML_flagCheck:
  // "The file RAxML_flagCheck RAxML wants to open for writing or appending can not be opened [mode: wb], exiting ..."
  // TODO: this is just skipping a check when raxml-ng is used. Maybe make the "Sanity check" option compulsory here
  const checkFlags = is.development && !is.windows && !usesRaxmlNg && !usesModeltestNg;
  if ( checkFlags ) {
    for ( const arg of args ) {
      try {
        const { stdout, stderr } = await exec( `"${binaryPath}" ${arg.join( ' ' )} --flag-check`, {
          ...( is.windows
            ? { shell: true }
            : {} ),
        } as unknown as ExecOptions );
        console.log( stdout, stderr );
      }
      catch ( err: unknown ) {
        console.error( 'Flag check run error:', err );
        Sentry.captureException( err );
        reportError( err );
        return;
      }
    }
  }
  let exitCode: ProcessExit = 0;
  for ( const arg of args ) {
    try {
      console.log( `Run '${binaryName}' with args:`, arg );
      exitCode = await runProcess( id, event, binaryDir, binaryName, arg );
      if ( exitCode !== 0 ) {
        break;
      }
    }
    catch ( err: unknown ) {
      console.error( 'Run error:', err );
      Sentry.captureException( err );
      reportError( err );
      return;
    }
  }
  if ( !stillRunning( id, token ) || !finishedRun( exitCode ) ) {
    return;
  }
  if ( combinedOutput ) {
    console.log( 'Combining output...' );
    await combineOutput( outputDir, outputFilename );
  }
  // Rename the RAxML_info.\*.tre into RAxML_info.\*.txt
  console.log(
    `Renaming info file 'RAxML_info.${outputName}.tre' -> 'RAxML_info.${outputName}.txt'...`,
  );
  const anyMatch = new RegExp( `RAxML_info\\.${outputName}\\.tre` );
  const filenames = await fs.readdir( outputDir );
  const infoFiles = filenames.filter( ( filename ) => anyMatch.test( filename ) );
  for ( let i = 0; i < infoFiles.length; i++ ) {
    const infoPath = path.join( outputDir, infoFiles[i] );
    const newPath = path.join( outputDir, infoFiles[i].replace( '.tre', '.txt' ) );
    await fs.rename( infoPath, newPath );
  }
  // Rename the raxml-ng output files to add .tre or .txt extension
  if ( usesRaxmlNg ) {
    console.log( `Renaming raxml-ng output files to add .tre or .txt extension...` );
    const anyMatch = new RegExp( `${outputName}.raxml` );
    const filenames = await fs.readdir( outputDir );
    const outputFiles = filenames.filter( ( filename ) => anyMatch.test( filename ) );
    const rbaMatch = new RegExp( `${outputName}.raxml.rba` );
    const bestModelMatch = new RegExp( `${outputName}.raxml.bestModel` );
    const logMatch = new RegExp( `${outputName}.raxml.log` );
    const aPMatch = new RegExp( `${outputName}.raxml.ancestralProbs` );
    const aSMatch = new RegExp( `${outputName}.raxml.ancestralStates` );
    let renamedFiles = outputFiles.map( ( f ) => {
      if ( rbaMatch.test( f ) ) {
        return f;
      }
      if ( bestModelMatch.test( f ) ||
                logMatch.test( f ) ||
                aPMatch.test( f ) ||
                aSMatch.test( f ) ) {
        return ( f += '.txt' );
      }
      return ( f += '.tre' );
    } );
    for ( let i = 0; i < outputFiles.length; i++ ) {
      const infoPath = path.join( outputDir, outputFiles[i] );
      const newPath = path.join( outputDir, renamedFiles[i] );
      await fs.rename( infoPath, newPath );
    }
  }
  const nextFilenames = await fs.readdir( outputDir );
  const resultFilenames = nextFilenames.filter( ( filename ) => filename.includes( outputName ) );
  if ( !stillRunning( id, token ) ) {
    return;
  }
  send( event, ipc.RUN_FINISHED, {
    id,
    resultDir: outputDir,
    resultFilenames,
    exitCode,
  } );
}
