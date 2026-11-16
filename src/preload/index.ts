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
  WRITE_FILE,
} from '../constants/ipc';

function onEvent( channel, listener ) {
  const wrapped = ( _event, payload ) => listener( payload );
  ipcRenderer.on( channel, wrapped );
  return () => ipcRenderer.removeListener( channel, wrapped );
}

// Sandboxed preload cannot load Node's os. Main answers once; later reads stay local.
const host = ipcRenderer.sendSync( HOST );

let stateReport = null;

ipcRenderer.on( STATE_REPORT, ( _event, id ) => {
  const report = stateReport
    ? stateReport()
    : undefined;
  ipcRenderer.send( STATE_REPORT_RESULT, { id, report } );
} );

contextBridge.exposeInMainWorld( 'rendererBridge', {
  host,
  provideStateReport( fn ) {
    stateReport = fn;
  },
  copyText( text ) {
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
  setDarkMode( value ) {
    return ipcRenderer.invoke( SET_DARK_MODE, value );
  },
  selectAlignment( runId ) {
    return ipcRenderer.invoke( ALIGNMENT_SELECT, runId );
  },
  parseAlignment( id, filePath ) {
    return ipcRenderer.invoke( ALIGNMENT_PARSE, id, filePath );
  },
  selectAstralFile( runId ) {
    return ipcRenderer.invoke( ASTRAL_FILE_SELECT, runId );
  },
  selectOutputDir( runId ) {
    return ipcRenderer.invoke( OUTPUT_DIR_SELECT, runId );
  },
  checkOutput( { outputDir, outputName } ) {
    return ipcRenderer.invoke( OUTPUT_CHECK, { outputDir, outputName } );
  },
  readFile( filePath ) {
    return ipcRenderer.invoke( READ_FILE, filePath );
  },
  writeFile( filePath, text ) {
    return ipcRenderer.invoke( WRITE_FILE, filePath, text );
  },
  reload() {
    return ipcRenderer.invoke( RELOAD );
  },
  debugInfo() {
    return ipcRenderer.invoke( DEBUG_INFO );
  },
  openExternal( url ) {
    return ipcRenderer.invoke( OPEN_EXTERNAL, url );
  },
  openPath( fullPath ) {
    return ipcRenderer.invoke( OPEN_PATH, fullPath );
  },
  selectPartitionFile( runId ) {
    return ipcRenderer.invoke( PARTITION_FILE_SELECT, runId );
  },
  selectTree( runId, type ) {
    return ipcRenderer.invoke( TREE_SELECT, runId, type );
  },
  showItemInFolder( fullPath ) {
    return ipcRenderer.invoke( FILE_SHOW_IN_FOLDER, fullPath );
  },
  startRun( payload ) {
    return ipcRenderer.invoke( RUN_START, payload );
  },
  cancelRun( id ) {
    return ipcRenderer.invoke( RUN_CANCEL, id );
  },
  onRunStdout( listener ) {
    return onEvent( RUN_STDOUT, listener );
  },
  onRunStderr( listener ) {
    return onEvent( RUN_STDERR, listener );
  },
  onRunFinished( listener ) {
    return onEvent( RUN_FINISHED, listener );
  },
  onRunError( listener ) {
    return onEvent( RUN_ERROR, listener );
  },
  startAstral( payload ) {
    return ipcRenderer.invoke( ASTRAL_REQUEST, payload );
  },
  onAstralSuccess( listener ) {
    return onEvent( ASTRAL_SUCCESS, listener );
  },
  startModelSelection( payload ) {
    return ipcRenderer.invoke( ALIGNMENT_MODEL_SELECTION_REQUEST, payload );
  },
  cancelModelSelection( id ) {
    return ipcRenderer.invoke( ALIGNMENT_MODEL_SELECTION_CANCEL, id );
  },
  onModelSelectionSuccess( listener ) {
    return onEvent( ALIGNMENT_MODEL_SELECTION_SUCCESS, listener );
  },
  onModelSelectionFailure( listener ) {
    return onEvent( ALIGNMENT_MODEL_SELECTION_FAILURE, listener );
  },
  onAddRun( listener ) {
    return onEvent( ADD_RUN, listener );
  },
  onRemoveRun( listener ) {
    return onEvent( REMOVE_RUN, listener );
  },
  onLightMode( listener ) {
    return onEvent( LIGHT_MODE, listener );
  },
  onDarkMode( listener ) {
    return onEvent( DARK_MODE, listener );
  },
  onToggleBackboneConstraint( listener ) {
    return onEvent( TOGGLE_BACKBONE_CONSTRAINT, listener );
  },
  onToggleMultifurcatingConstraint( listener ) {
    return onEvent( TOGGLE_MULTIFURCATING_CONSTRAINT, listener );
  },
  onUnhandledError( listener ) {
    return onEvent( UNHANDLED_ERROR, listener );
  },
  getPathForFile( file ) {
    return webUtils.getPathForFile( file );
  },
} );
