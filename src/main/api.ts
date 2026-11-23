import { app, ipcMain, shell, dialog, clipboard } from 'electron';
import type { IpcMainEvent, IpcMainInvokeEvent, OpenDialogOptions } from 'electron';
import os from 'os';
import path from 'path';
import util from 'util';
import _fs from 'fs';
import childProcess from 'child_process';
import type { ExecOptions } from 'child_process';
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
function handleError( title: string, error: unknown ): void {
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
process.on( 'uncaughtException', ( error: Error ) => {
  handleError( 'Unhandled Error', error );
} );
process.on( 'unhandledRejection', ( error: unknown ) => {
  handleError( 'Unhandled Promise Rejection', error );
} );
export interface ExampleFilesPayload {
  fasta: string[];
  phylip: string[];
  dir: string;
  outdir: string;
}
const exec = util.promisify( childProcess.exec );
ipcMain.on( ipc.HOST, ( event: IpcMainEvent ) => {
  const cpu = os.cpus()[0];
  event.returnValue = {
    windows: process.platform === 'win32',
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpu.model,
  };
} );
ipcMain.handle( ipc.GET_VERSION, (): string => app.getVersion() );
ipcMain.handle( ipc.GET_DARK_MODE, (): boolean => Boolean( appStore.get( 'darkMode' ) ) );
ipcMain.handle( ipc.SET_DARK_MODE, ( _event: IpcMainInvokeEvent, value: boolean ): void => {
  appStore.set( 'darkMode', value );
} );
ipcMain.handle( ipc.COPY_TEXT, async ( _event: IpcMainInvokeEvent, text: string ): Promise<void> => {
  await clipboard.writeText( text );
} );
ipcMain.handle( ipc.READ_FILE, ( _event: IpcMainInvokeEvent, filePath: string ): Promise<string> => {
  return fs.readFile( filePath, 'utf-8' );
} );
ipcMain.handle( ipc.WRITE_FILE, async ( _event: IpcMainInvokeEvent, filePath: string, text: string ): Promise<void> => {
  await fs.writeFile( filePath, text );
} );
ipcMain.handle( ipc.RELOAD, ( event: IpcMainInvokeEvent ): void => {
  event.sender.reload();
} );
ipcMain.handle( ipc.DEBUG_INFO, (): string => {
  return debugInfo( {
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: process.platform,
    release: os.release(),
    locale: app.getLocale(),
  } );
} );
ipcMain.handle( ipc.OPEN_EXTERNAL, ( _event: IpcMainInvokeEvent, url: string ): Promise<void> => {
  return shell.openExternal( url );
} );
ipcMain.handle( ipc.OUTPUT_DIR_SELECT, ( _event: IpcMainInvokeEvent, _runId: number ) => {
  return selectOutputDir( ( options: OpenDialogOptions ) => dialog.showOpenDialog( options ) );
} );
ipcMain.handle( ipc.PARTITION_FILE_SELECT, ( _event: IpcMainInvokeEvent, _runId: number ) => {
  return selectPartitionFile( ( options: OpenDialogOptions ) => dialog.showOpenDialog( options ) );
} );
ipcMain.handle( ipc.OPEN_PATH, ( _event: IpcMainInvokeEvent, fullPath: string ): Promise<string> => {
  return shell.openPath( fullPath );
} );
// Open a file in it's folder with native file explorer
ipcMain.handle( ipc.FILE_SHOW_IN_FOLDER, ( _event: IpcMainInvokeEvent, fullPath: string ): void => {
  console.debug( ipc.FILE_SHOW_IN_FOLDER, fullPath );
  shell.showItemInFolder( fullPath );
} );
// Check if raxml output files already exist with current name
ipcMain.handle( ipc.OUTPUT_CHECK, ( _event: IpcMainInvokeEvent, { outputDir, outputName }: { outputDir: string; outputName: string } ) => {
  return checkOutput( { outputDir, outputName } );
} );
ipcMain.handle( ipc.RUN_START, startRun );
ipcMain.handle( ipc.RUN_CANCEL, ( _event: IpcMainInvokeEvent, id: number ): void => {
  console.log( `Cancel run process ${id}...` );
  cancelRun( id );
} );
// Function to get an alignment format with readal
async function readalGetFormat( alignmentPath: string ): Promise<string | undefined> {
  const readalPath = path.resolve( binaryDir, 'readal' );
  const childCmd = `${quote( readalPath )} -in ${quote( alignmentPath )} -type -format`;
  const { stdout, stderr } = await exec( childCmd, {
    ...( is.windows
      ? { shell: true }
      : {} ),
  } as unknown as ExecOptions );
  console.log( 'Readal stderr', stderr );
  const replaced = String( stdout ).replace( alignmentPath, '' );
  const formats = ['clustal', 'fasta', 'nbrf', 'nexus', 'mega', 'phylip'];
  for ( const f of formats ) {
    if ( replaced.includes( f ) ) {
      return f;
    }
  }
  return;
}
// Function to convert an alignment to fasta with readal
async function convertAlignment( alignmentPath: string ): Promise<string> {
  const readalPath = path.resolve( binaryDir, 'readal' );
  const newPath = alignmentPath.replace( path.extname( alignmentPath ), '.fas' );
  const childCmd = `${quote( readalPath )} -in ${quote( alignmentPath )} -out ${quote( newPath )} -fasta`;
  const { stdout, stderr } = await exec( childCmd, {
    ...( is.windows
      ? { shell: true }
      : {} ),
  } as unknown as ExecOptions );
  console.log( stdout, stderr );
  return newPath;
}
ipcMain.handle( ipc.ALIGNMENT_PARSE, ( _event: IpcMainInvokeEvent, id: string, filePath: string ) => {
  return parseAlignment( id, filePath, {
    readFormat: readalGetFormat as ( filePath: string ) => Promise<string>,
    convert: convertAlignment,
    parse: io.parseAlignment,
    write: io.writeAlignment,
  } );
} );
// Open a dialog to select alignments
ipcMain.handle( ipc.ALIGNMENT_SELECT, ( _event: IpcMainInvokeEvent, _runId: number ) => {
  return selectAlignment( ( options: OpenDialogOptions ) => dialog.showOpenDialog( options ) );
} );
ipcMain.handle( ipc.ASTRAL_FILE_SELECT, ( _event: IpcMainInvokeEvent, _runId: number ) => {
  return selectAstralFile( ( options: OpenDialogOptions ) => dialog.showOpenDialog( options ) );
} );
ipcMain.handle( ipc.EXAMPLE_FILES, async (): Promise<ExampleFilesPayload> => {
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
ipcMain.handle( ipc.ALIGNMENT_MODEL_SELECTION_CANCEL, ( _event: IpcMainInvokeEvent, id: string ): void => {
  console.log( `Cancel modeltest process ${id}...` );
  cancelRun( id );
} );
ipcMain.handle( ipc.TREE_SELECT, ( _event: IpcMainInvokeEvent, _runId: number, type: string ) => {
  return selectTree( ( options: OpenDialogOptions ) => dialog.showOpenDialog( options ), type );
} );
