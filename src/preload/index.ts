import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  ADD_RUN,
  ALIGNMENT_MODEL_SELECTION_CANCEL,
  ALIGNMENT_MODEL_SELECTION_FAILURE,
  ALIGNMENT_MODEL_SELECTION_REQUEST,
  ALIGNMENT_MODEL_SELECTION_SUCCESS,
  ALIGNMENT_PARSE,
  ALIGNMENT_SELECT,
  ASTRAL_FILE_SELECT,
  ASTRAL_REQUEST,
  ASTRAL_SUCCESS,
  COPY_TEXT,
  DARK_MODE,
  DEBUG_INFO,
  EXAMPLE_FILES,
  FILE_SHOW_IN_FOLDER,
  GET_DARK_MODE,
  GET_VERSION,
  GET_UPDATE_DOWNLOAD,
  HOST,
  SET_DARK_MODE,
  LIGHT_MODE,
  OPEN_EXTERNAL,
  OPEN_PATH,
  OUTPUT_CHECK,
  OUTPUT_DIR_SELECT,
  PARTITION_FILE_SELECT,
  READ_FILE,
  RELOAD,
  REMOVE_RUN,
  RUN_CANCEL,
  RUN_ERROR,
  RUN_FINISHED,
  RUN_START,
  RUN_STDERR,
  RUN_STDOUT,
  STATE_REPORT,
  STATE_REPORT_RESULT,
  TOGGLE_BACKBONE_CONSTRAINT,
  TOGGLE_MULTIFURCATING_CONSTRAINT,
  TREE_SELECT,
  UNHANDLED_ERROR,
  UPDATE_DOWNLOAD,
  WRITE_FILE,
} from '../constants/ipc';
import type { RendererBridge, HostInfo, UnhandledErrorPayload, UpdateDownloadPayload } from '../common/rendererBridge';
import type { CheckOutputArgs } from '../main/checkOutput';
import type { StateReport } from '../main/getActiveState';
import type { StartRunPayload, RunFinishedPayload, RunErrorPayload } from '../main/startRun';
import type { AstralPayload, AstralSuccessPayload } from '../main/astral';
import type { RunOutputPayload } from '../main/processHelpers';
import type {
  ModelSelectionPayload,
  ModelSelectionSuccessPayload,
  ModelSelectionFailurePayload,
} from '../main/modelSelection';

function onEvent<T = unknown>( channel: string, listener: ( payload: T ) => void ): () => void {
  const wrapped = ( _event: unknown, payload: T ): void => listener( payload );
  ipcRenderer.on( channel, wrapped );
  return () => ipcRenderer.removeListener( channel, wrapped );
}

// Sandboxed preload cannot load Node's os. Main answers once; later reads stay local.
const host: HostInfo = ipcRenderer.sendSync( HOST );

let stateReport: ( () => StateReport ) | null = null;

ipcRenderer.on( STATE_REPORT, ( _event: unknown, id: string ): void => {
  const report = stateReport
    ? stateReport()
    : undefined;
  ipcRenderer.send( STATE_REPORT_RESULT, { id, report } );
} );

const rendererBridge = {
  host,
  provideStateReport( fn: () => StateReport ): void {
    stateReport = fn;
  },
  copyText( text: string ) {
    return ipcRenderer.invoke( COPY_TEXT, text );
  },
  getExampleFiles() {
    return ipcRenderer.invoke( EXAMPLE_FILES );
  },
  getVersion() {
    return ipcRenderer.invoke( GET_VERSION );
  },
  getDarkMode() {
    return ipcRenderer.invoke( GET_DARK_MODE );
  },
  setDarkMode( value: boolean ) {
    return ipcRenderer.invoke( SET_DARK_MODE, value );
  },
  selectAlignment( runId: number ) {
    return ipcRenderer.invoke( ALIGNMENT_SELECT, runId );
  },
  parseAlignment( id: string, filePath: string ) {
    return ipcRenderer.invoke( ALIGNMENT_PARSE, id, filePath );
  },
  selectAstralFile( runId: number ) {
    return ipcRenderer.invoke( ASTRAL_FILE_SELECT, runId );
  },
  selectOutputDir( runId: number ) {
    return ipcRenderer.invoke( OUTPUT_DIR_SELECT, runId );
  },
  checkOutput( { outputDir, outputName }: CheckOutputArgs ) {
    return ipcRenderer.invoke( OUTPUT_CHECK, { outputDir, outputName } );
  },
  readFile( filePath: string ) {
    return ipcRenderer.invoke( READ_FILE, filePath );
  },
  writeFile( filePath: string, text: string ) {
    return ipcRenderer.invoke( WRITE_FILE, filePath, text );
  },
  reload() {
    return ipcRenderer.invoke( RELOAD );
  },
  debugInfo() {
    return ipcRenderer.invoke( DEBUG_INFO );
  },
  openExternal( url: string ) {
    return ipcRenderer.invoke( OPEN_EXTERNAL, url );
  },
  openPath( fullPath: string ) {
    return ipcRenderer.invoke( OPEN_PATH, fullPath );
  },
  selectPartitionFile( runId: number ) {
    return ipcRenderer.invoke( PARTITION_FILE_SELECT, runId );
  },
  selectTree( runId: number, type: string ) {
    return ipcRenderer.invoke( TREE_SELECT, runId, type );
  },
  showItemInFolder( fullPath: string ) {
    return ipcRenderer.invoke( FILE_SHOW_IN_FOLDER, fullPath );
  },
  startRun( payload: StartRunPayload ) {
    return ipcRenderer.invoke( RUN_START, payload );
  },
  cancelRun( id: number ) {
    return ipcRenderer.invoke( RUN_CANCEL, id );
  },
  onRunStdout( listener: ( payload: RunOutputPayload ) => void ) {
    return onEvent( RUN_STDOUT, listener );
  },
  onRunStderr( listener: ( payload: RunOutputPayload ) => void ) {
    return onEvent( RUN_STDERR, listener );
  },
  onRunFinished( listener: ( payload: RunFinishedPayload ) => void ) {
    return onEvent( RUN_FINISHED, listener );
  },
  onRunError( listener: ( payload: RunErrorPayload ) => void ) {
    return onEvent( RUN_ERROR, listener );
  },
  startAstral( payload: AstralPayload ) {
    return ipcRenderer.invoke( ASTRAL_REQUEST, payload );
  },
  onAstralSuccess( listener: ( payload: AstralSuccessPayload ) => void ) {
    return onEvent( ASTRAL_SUCCESS, listener );
  },
  startModelSelection( payload: ModelSelectionPayload ) {
    return ipcRenderer.invoke( ALIGNMENT_MODEL_SELECTION_REQUEST, payload );
  },
  cancelModelSelection( id: string ) {
    return ipcRenderer.invoke( ALIGNMENT_MODEL_SELECTION_CANCEL, id );
  },
  onModelSelectionSuccess( listener: ( payload: ModelSelectionSuccessPayload ) => void ) {
    return onEvent( ALIGNMENT_MODEL_SELECTION_SUCCESS, listener );
  },
  onModelSelectionFailure( listener: ( payload: ModelSelectionFailurePayload ) => void ) {
    return onEvent( ALIGNMENT_MODEL_SELECTION_FAILURE, listener );
  },
  onAddRun( listener: ( payload: unknown ) => void ) {
    return onEvent( ADD_RUN, listener );
  },
  onRemoveRun( listener: ( payload: unknown ) => void ) {
    return onEvent( REMOVE_RUN, listener );
  },
  onLightMode( listener: ( payload: unknown ) => void ) {
    return onEvent( LIGHT_MODE, listener );
  },
  onDarkMode( listener: ( payload: unknown ) => void ) {
    return onEvent( DARK_MODE, listener );
  },
  onToggleBackboneConstraint( listener: ( payload: unknown ) => void ) {
    return onEvent( TOGGLE_BACKBONE_CONSTRAINT, listener );
  },
  onToggleMultifurcatingConstraint( listener: ( payload: unknown ) => void ) {
    return onEvent( TOGGLE_MULTIFURCATING_CONSTRAINT, listener );
  },
  onUnhandledError( listener: ( payload: UnhandledErrorPayload ) => void ) {
    return onEvent( UNHANDLED_ERROR, listener );
  },
  onUpdateDownload( listener: ( payload: UpdateDownloadPayload ) => void ) {
    return onEvent( UPDATE_DOWNLOAD, listener );
  },
  getUpdateDownload() {
    return ipcRenderer.invoke( GET_UPDATE_DOWNLOAD );
  },
  getPathForFile( file: File ): string {
    return webUtils.getPathForFile( file );
  },
} satisfies RendererBridge;

contextBridge.exposeInMainWorld( 'rendererBridge', rendererBridge );
