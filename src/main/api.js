/* global __static */
import { app, ipcMain, shell, dialog, Notification, clipboard } from 'electron';
import os from 'os';
import path from 'path';
import util from 'util';
import _fs from 'fs';
import childProcess from 'child_process';
import { serializeError } from 'serialize-error';
import parsePath from 'parse-filepath';
import * as Sentry from '@sentry/electron/main';
import * as ipc from '../constants/ipc';
import io from '../common/io';
import { parseAlignment } from './parseAlignment';
import { selectAlignment } from './selectAlignment';
import { selectAstralFile } from './selectAstralFile';
import { selectOutputDir } from './selectOutputDir';
import { checkOutput } from './checkOutput';
import { debugInfo } from './debugInfo';
import { selectPartitionFile } from './selectPartitionFile';
import { selectTree } from './selectTree';
import { appStore } from './appStore';
import { is, platform, quote } from '../common/utils';
import UserFixError from '../common/errors';
import { activeWindow } from './utils/utils';
import {
  beginRun,
  cancelRun,
  finishedRun,
  forgetRun,
  runResult,
  stillRunning,
  stopRun,
  trackRun,
} from './cancelRun';
if ( !is.development ) {
  Sentry.init( {
    dsn: 'https://d92efa46c2ba43f38250b202c791a2c2@o117148.ingest.sentry.io/6517975',
    maxValueLength: 2000,
  } );
}
const fs = _fs.promises;
function getStaticDir() {
  if ( process.env.RAXMLGUI_E2E === '1' ) {
    return path.join( __dirname, '..', '..', 'static' );
  }
  return __static;
}
const get_space_safe_binary_path = ( bin_path ) => {
  // For Windows users with spaces in user dir
  return is.windows
    ? `"${bin_path}"`
    : bin_path;
};
function handleError( title, error ) {
  // send error to renderer
  console.log( `${title}:`, error );
  const win = activeWindow();
  if ( win ) {
    win.webContents.send( ipc.UNHANDLED_ERROR, {
      title,
      error: serializeError( error ),
    } );
  }
}
process.on( 'uncaughtException', ( error ) => {
  handleError( 'Unhandled Error', error );
} );
process.on( 'unhandledRejection', ( error ) => {
  handleError( 'Unhandled Promise Rejection', error );
} );
const exec = util.promisify( childProcess.exec );
const execFile = util.promisify( childProcess.execFile );
function send( event, channel, data ) {
  if ( !data.error ) {
    return event.sender.send( channel, data );
  }
  return event.sender.send( channel, Object.assign( {}, data, { error: serializeError( data.error ) } ) );
}
ipcMain.on( ipc.HOST, ( event ) => {
  const cpu = os.cpus()[0];
  event.returnValue = {
    windows: process.platform === 'win32',
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpu.model,
  };
} );
ipcMain.handle( ipc.GET_VERSION, () => app.getVersion() );
ipcMain.handle( ipc.GET_DARK_MODE, () => Boolean( appStore.get( 'darkMode' ) ) );
ipcMain.handle( ipc.SET_DARK_MODE, ( _event, value ) => {
  appStore.set( 'darkMode', !!value );
} );
ipcMain.handle( ipc.COPY_TEXT, async ( _event, text ) => {
  await clipboard.writeText( text );
} );
ipcMain.handle( ipc.READ_FILE, ( _event, filePath ) => {
  return fs.readFile( filePath, 'utf-8' );
} );
ipcMain.handle( ipc.WRITE_FILE, async ( _event, filePath, text ) => {
  await fs.writeFile( filePath, text );
} );
ipcMain.handle( ipc.RELOAD, ( event ) => {
  event.sender.reload();
} );
ipcMain.handle( ipc.DEBUG_INFO, () => {
  return debugInfo( {
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: process.platform,
    release: os.release(),
    locale: app.getLocale(),
  } );
} );
ipcMain.handle( ipc.OPEN_EXTERNAL, ( _event, url ) => {
  return shell.openExternal( url );
} );
ipcMain.handle( ipc.OUTPUT_DIR_SELECT, ( _event, _runId ) => {
  return selectOutputDir( ( options ) => dialog.showOpenDialog( options ) );
} );
ipcMain.handle( ipc.PARTITION_FILE_SELECT, ( _event, _runId ) => {
  return selectPartitionFile( ( options ) => dialog.showOpenDialog( options ) );
} );
// Open a file with the OS's default file handler
ipcMain.on( ipc.FILE_OPEN, ( event, fullPath ) => {
  console.debug( ipc.FILE_OPEN, fullPath );
  shell.openPath( fullPath );
} );
ipcMain.handle( ipc.OPEN_PATH, ( _event, fullPath ) => {
  return shell.openPath( fullPath );
} );
// Open a file in it's folder with native file explorer
ipcMain.handle( ipc.FILE_SHOW_IN_FOLDER, ( _event, fullPath ) => {
  console.debug( ipc.FILE_SHOW_IN_FOLDER, fullPath );
  shell.showItemInFolder( fullPath );
} );
// Open a folder
ipcMain.on( ipc.FOLDER_OPEN, ( event, fullPath ) => {
  console.debug( ipc.FOLDER_OPEN, fullPath );
  shell.showItemInFolder( fullPath );
} );
// Check if raxml output files already exist with current name
ipcMain.handle( ipc.OUTPUT_CHECK, ( _event, { outputDir, outputName } ) => {
  return checkOutput( { outputDir, outputName } );
} );
// Function to combine multiple output trees into one file
async function combineOutput( outputDir, outputFilename ) {
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
  } );
  console.log( stdout, stderr );
}
const binParentDir = app.isPackaged
  ? ''
  : platform( {
    macos: 'Mac',
    windows: 'Windows',
    linux: 'Linux',
  } );
const binaryDir = path.join( getStaticDir(), 'bin', binParentDir );
ipcMain.handle( ipc.RUN_START, async ( event, { id, args, binaryName, outputDir, outputFilename, outputName, combinedOutput, usesRaxmlNg, usesModeltestNg, inputPath } ) => {
  const token = beginRun( id );
  stopRun( id );
  const reportError = ( error ) => {
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
  catch ( err ) {
    const error = new UserFixError( `The input file does not exist '${inputPath}': ${err.message}` );
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
  catch ( err ) {
    console.error( 'Error writing to output file:', err );
    const error = new Error( `Error trying to write to output file '${resultFilePath}': ${err.message}` );
    Sentry.captureException( err );
    reportError( error );
    return;
  }
  finally {
    try {
      fs.unlink( resultFilePath );
    }
    catch ( err ) {
      console.error( `Error trying to unlink temporary result file: ${err.message}` );
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
  catch ( err ) {
    console.error( 'Error executing binary:', err );
    const error = new Error( `Error trying to execute raxml binary '${binaryPath}': ${err.message}` );
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
        } );
        console.log( stdout, stderr );
      }
      catch ( err ) {
        console.error( 'Flag check run error:', err );
        Sentry.captureException( err );
        reportError( err );
        return;
      }
    }
  }
  let exitCode = 0;
  for ( const arg of args ) {
    try {
      console.log( `Run '${binaryName}' with args:`, arg );
      exitCode = await runProcess( id, event, binaryDir, binaryName, arg );
      if ( exitCode !== 0 ) {
        break;
      }
    }
    catch ( err ) {
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
} );
ipcMain.handle( ipc.RUN_CANCEL, ( _event, id ) => {
  console.log( `Cancel run process ${id}...` );
  cancelRun( id );
} );
function spawnProcess( binaryDir, binaryName, args ) {
  const binaryPath = path.join( binaryDir, binaryName );
  const proc = childProcess.execFile( get_space_safe_binary_path( binaryPath ), args, {
    shell: is.windows,
  } );
  return proc;
}
async function runProcess( id, event, binaryDir, binaryName, args, { onStdOut = ( _content ) => { }, onStdErr = ( _content ) => { } } = {} ) {
  return new Promise( ( resolve, reject ) => {
    stopRun( id );
    try {
      const proc = spawnProcess( binaryDir, binaryName, args );
      trackRun( id, proc );
      let exited = false;
      proc.stdout.on( 'data', ( buffer ) => {
        const content = String( buffer );
        console.log( 'on stdout:', content );
        onStdOut( content );
        send( event, ipc.RUN_STDOUT, { id, content } );
      } );
      proc.stderr.on( 'data', ( buffer ) => {
        const content = String( buffer );
        console.error( 'on stderr:', content );
        onStdErr( content );
        send( event, ipc.RUN_STDERR, { id, content } );
      } );
      const onQuit = ( message ) => ( code, signal ) => {
        if ( exited ) {
          return;
        }
        console.log( `Process finished with event '${message}' and error/code/signal:`, signal || code );
        exited = true;
        forgetRun( id, proc );
        const result = runResult( proc, message, code, signal );
        const win = activeWindow();
        if ( !win || !win.isFocused() ) {
          const notification = new Notification( {
            title: app.name,
            body: 'Calculation finished',
          } );
          notification.show();
        }
        if ( result === 'SIGTERM' ) {
          return resolve( result );
        }
        if ( message === 'error' || result instanceof Error ) {
          return reject( result ); // code is an error object on 'error' event
        }
        return resolve( result ); // Add code last to get through code 0
      };
      ['error', 'exit', 'close'].forEach( ( message ) => {
        proc.on( message, onQuit( message ) );
      } );
    }
    catch ( err ) {
      console.log( 'Run catch error:', err );
      reject( err );
    }
  } );
}
// Function to get an alignment format with readal
async function readalGetFormat( alignmentPath ) {
  const readalPath = path.resolve( binaryDir, 'readal' );
  const childCmd = `${quote( readalPath )} -in ${quote( alignmentPath )} -type -format`;
  const { stdout, stderr } = await exec( childCmd, {
    ...( is.windows
      ? { shell: true }
      : {} ),
  } );
  console.log( 'Readal stderr', stderr );
  const replaced = stdout.replace( alignmentPath, '' );
  const formats = ['clustal', 'fasta', 'nbrf', 'nexus', 'mega', 'phylip'];
  for ( let i = 0; i < formats.length; i++ ) {
    const f = formats[i];
    if ( replaced.includes( f ) ) {
      return f;
    }
  }
  return;
}
// Function to convert an alignment to fasta with readal
async function convertAlignment( alignmentPath ) {
  const readalPath = path.resolve( binaryDir, 'readal' );
  const newPath = alignmentPath.replace( path.extname( alignmentPath ), '.fas' );
  const childCmd = `${quote( readalPath )} -in ${quote( alignmentPath )} -out ${quote( newPath )} -fasta`;
  const { stdout, stderr } = await exec( childCmd, {
    ...( is.windows
      ? { shell: true }
      : {} ),
  } );
  console.log( stdout, stderr );
  return newPath;
}
ipcMain.handle( ipc.ALIGNMENT_PARSE, ( _event, id, filePath ) => {
  return parseAlignment( id, filePath, {
    readFormat: readalGetFormat,
    convert: convertAlignment,
    parse: io.parseAlignment,
    write: io.writeAlignment,
  } );
} );
// Open a dialog to select alignments
ipcMain.handle( ipc.ALIGNMENT_SELECT, ( _event, _runId ) => {
  return selectAlignment( ( options ) => dialog.showOpenDialog( options ) );
} );
ipcMain.handle( ipc.ASTRAL_FILE_SELECT, ( _event, _runId ) => {
  return selectAstralFile( ( options ) => dialog.showOpenDialog( options ) );
} );
ipcMain.handle( ipc.EXAMPLE_FILES, async () => {
  const staticDir = getStaticDir();
  const dir = path.join( staticDir, 'example-files' );
  const outdir = path.join( staticDir, 'test-results' );
  // Create outdir if not exists
  await fs.mkdir( outdir, { recursive: true } );
  const fastaFiles = await fs.readdir( path.join( dir, 'fasta' ) );
  const phylipFiles = await fs.readdir( path.join( dir, 'phylip' ) );
  return {
    fasta: fastaFiles,
    phylip: phylipFiles,
    dir,
    outdir,
  };
} );
ipcMain.handle( ipc.ASTRAL_REQUEST, async ( event, payload ) => {
  const { id, binaryName, args } = payload;
  const javaBin = 'java';
  const [arg] = args;
  arg.splice( 0, 0, '-jar', quote( path.join( binaryDir, binaryName ) ) );
  let exitCode = 0;
  try {
    console.log( 'arg', arg );
    console.log( `ASTRAL?` );
    exitCode = await runProcess( id, event, '', javaBin, arg );
    if ( exitCode !== 0 ) {
      if ( exitCode === 'SIGTERM' ) {
        // Cancelled
        return;
      }
      throw new Error( `Error trying to run ASTRAL, exited with code '${exitCode}'.` );
    }
  }
  catch ( err ) {
    console.error( 'ASTRAL run error:', err );
    send( event, ipc.RUN_ERROR, { id, error: err } );
    return;
  }
  send( event, ipc.ASTRAL_SUCCESS, {
    id,
    exitCode,
  } );
} );
ipcMain.handle( ipc.ALIGNMENT_MODEL_SELECTION_REQUEST, async ( event, payload ) => {
  const { id, filePath, outputDir, dataType, numThreads, binaryName } = payload;
  const token = beginRun( id );
  const reportFailure = ( error ) => {
    if ( !stillRunning( id, token ) ) {
      return;
    }
    send( event, ipc.ALIGNMENT_MODEL_SELECTION_FAILURE, { id, error } );
  };
  const { name } = parsePath( filePath );
  const outputPath = path.join( outputDir, `RAxML_GUI_ModelTest_${name}` );
  try {
    // Remove binary checkpoint as that may be invalid
    await fs.unlink( `${outputPath}.ckp` );
  }
  catch ( err ) { }
  const args = [];
  if ( dataType === 'nucleotide' ) {
    args.push( '-d', 'nt' );
  }
  else if ( dataType === 'protein' ) {
    args.push( '-d', 'aa' );
  }
  // alignment file
  args.push( '-i', quote( filePath ) );
  // output path
  args.push( '-o', quote( outputPath ) );
  // modeltest throws errors if the output file already exists
  args.push( '--force' );
  // Number of processors
  args.push( '-p', numThreads );
  console.log( `Alignment '${id}': Run modeltest with args ${args}...` );
  const stdOuts = [];
  const onStdOut = ( content ) => {
    stdOuts.push( content );
  };
  let exitCode = 0;
  try {
    if ( !stillRunning( id, token ) ) {
      return;
    }
    console.log( `Run modeltest-ng with args:`, args );
    exitCode = await runProcess( id, event, binaryDir, binaryName, args, {
      onStdOut,
    } );
    if ( !stillRunning( id, token ) || exitCode === 'SIGTERM' ) {
      return;
    }
    if ( exitCode !== 0 ) {
      throw new Error( `Error trying to run modeltest-ng, exited with code '${exitCode}'.` );
    }
  }
  catch ( err ) {
    console.error( 'Modeltest run error:', err );
    reportFailure( err );
    return;
  }
  // Parse stdout to get the best models
  console.log( 'Parse output from modeltest-ng...' );
  const commands = stdOuts.join( '' ).split( '\n' );
  try {
    // Each '> [program]' is written three times, for BIC, AIC and AICc respectively. Use AICc.
    const cmdRaxml = commands.filter( ( cmd ) => cmd.startsWith( '  > raxmlHPC-SSE3' ) )[2];
    const cmdRaxmlNG = commands.filter( ( cmd ) => cmd.startsWith( '  > raxml-ng' ) )[2];
    const modelRaxml = /-m (\S+)/.exec( cmdRaxml )[1];
    const extraFlag = /--(\S+)/.exec( cmdRaxml )?.[0];
    const modelRaxmlNG = /--model (\S+)/.exec( cmdRaxmlNG )[1];
    console.log( `-> raxml: ${modelRaxml}, extraFlag: ${extraFlag}, raxml-ng: ${modelRaxmlNG}` );
    send( event, ipc.ALIGNMENT_MODEL_SELECTION_SUCCESS, {
      id,
      result: {
        raxml: modelRaxml,
        extraFlag,
        raxmlNG: modelRaxmlNG,
      },
    } );
  }
  catch ( err ) {
    console.error( `Couldn't parse best models from modeltest-ng output:`, err );
    console.log( 'output:', commands );
    const error = new Error( `Couldn't parse best models from modeltest-ng output. Check alignment log.` );
    error.name = 'Modeltest error';
    reportFailure( error );
  }
} );
ipcMain.handle( ipc.ALIGNMENT_MODEL_SELECTION_CANCEL, ( _event, id ) => {
  console.log( `Cancel modeltest process ${id}...` );
  cancelRun( id );
} );
ipcMain.handle( ipc.TREE_SELECT, ( _event, _runId, type ) => {
  return selectTree( ( options ) => dialog.showOpenDialog( options ), type );
} );
