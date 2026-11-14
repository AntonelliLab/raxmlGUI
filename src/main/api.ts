import { app, ipcMain, shell, dialog, clipboard } from 'electron';
import os from 'os';
import path from 'path';
import util from 'util';
import _fs from 'fs';
import childProcess from 'child_process';
import { serializeError } from 'serialize-error';
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
import { is, quote } from '../common/utils';
import { activeWindow } from './utils/utils';
import { cancelRun } from './cancelRun';
import {
  binaryDir,
  getStaticDir,
} from './processHelpers';
import { startRun } from './startRun';
import { runModelSelection } from './modelSelection';
import { runAstral } from './astral';

if ( !is.development ) {
  Sentry.init( {
    dsn: 'https://d92efa46c2ba43f38250b202c791a2c2@o117148.ingest.sentry.io/6517975',
    maxValueLength: 2000,
  } );
}
const fs = _fs.promises;
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
ipcMain.handle( ipc.OPEN_PATH, ( _event, fullPath ) => {
  return shell.openPath( fullPath );
} );
// Open a file in it's folder with native file explorer
ipcMain.handle( ipc.FILE_SHOW_IN_FOLDER, ( _event, fullPath ) => {
  console.debug( ipc.FILE_SHOW_IN_FOLDER, fullPath );
  shell.showItemInFolder( fullPath );
} );
// Check if raxml output files already exist with current name
ipcMain.handle( ipc.OUTPUT_CHECK, ( _event, { outputDir, outputName } ) => {
  return checkOutput( { outputDir, outputName } );
} );
ipcMain.handle( ipc.RUN_START, startRun );
ipcMain.handle( ipc.RUN_CANCEL, ( _event, id ) => {
  console.log( `Cancel run process ${id}...` );
  cancelRun( id );
} );
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
ipcMain.handle( ipc.ASTRAL_REQUEST, runAstral );
ipcMain.handle( ipc.ALIGNMENT_MODEL_SELECTION_REQUEST, runModelSelection );
ipcMain.handle( ipc.ALIGNMENT_MODEL_SELECTION_CANCEL, ( _event, id ) => {
  console.log( `Cancel modeltest process ${id}...` );
  cancelRun( id );
} );
ipcMain.handle( ipc.TREE_SELECT, ( _event, _runId, type ) => {
  return selectTree( ( options ) => dialog.showOpenDialog( options ), type );
} );
