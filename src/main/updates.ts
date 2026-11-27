import log from 'electron-log';
import type { BrowserWindow, Dialog } from 'electron';
import type { AppUpdater, ProgressInfo } from 'electron-updater';
import type { UpdateDownload } from '../common/rendererBridge';
import { UPDATE_DOWNLOAD } from '../constants/ipc';

type WindowGetter = () => BrowserWindow | null;

let download: UpdateDownload = { status: 'idle' };
let getWindow: WindowGetter = () => null;

export function getUpdateDownload(): UpdateDownload {
  return download;
}

// Shows the held Update download on the window's Dock or taskbar icon.
export function applyUpdateDownloadBar( win: BrowserWindow | null ): void {
  if ( !win ) {
    return;
  }
  switch ( download.status ) {
    case 'connecting':
      // Linux has no indeterminate mode
      if ( process.platform !== 'linux' ) {
        win.setProgressBar( 2 );
      }
      break;
    case 'downloading':
    case 'restarted':
      win.setProgressBar( download.percent / 100 );
      break;
    default:
      win.setProgressBar( -1 );
  }
}

function setDownload( next: UpdateDownload ): void {
  download = next;
  const win = getWindow();
  win?.webContents.send( UPDATE_DOWNLOAD, { id: 'update', ...next } );
  applyUpdateDownloadBar( win );
}

// checkForUpdates rejects as well as emitting 'error'; the listener already reports it,
// so swallow the rejection to avoid an unhandled one (offline users, Sentry 3593287140).
export async function checkForUpdates( updater: AppUpdater ): Promise<void> {
  updater.autoDownload = false;
  try {
    await updater.checkForUpdates();
  } catch {
    // reported via the updater's 'error' event
  }
}

export function listenForUpdates( updater: AppUpdater, dialog: Dialog, windowGetter: WindowGetter ): void {
  download = { status: 'idle' };
  getWindow = windowGetter;
  updater.on( 'checking-for-update', () => {
    log.info( 'Checking for update...' );
  } );
  updater.on( 'update-available', () => {
    dialog
      .showMessageBox( {
        type: 'info',
        title: 'Found Updates',
        message: 'An update for RAxML-GUI is available, do you want to update now and restart?',
        buttons: ['Yes', 'No'],
        cancelId: 1,
      } )
      .then( ( r ) => {
        if ( r.response === 0 ) {
          setDownload( { status: 'connecting' } );
          log.info( 'Update download started.' );
          // rejects as well as emitting 'error'; the 'error' listener already reports it
          updater.downloadUpdate().catch( () => {} );
        }
      } );
    log.info( 'Update available.' );
  } );
  updater.on( 'update-not-available', () => {
    log.info( 'Update not available.' );
  } );
  updater.on( 'download-progress', ( progress: ProgressInfo ) => {
    const restarted = download.status === 'restarted' ||
      ( download.status === 'downloading' && progress.percent < download.percent );
    setDownload( {
      status: restarted
        ? 'restarted'
        : 'downloading',
      percent: progress.percent,
    } );
  } );
  updater.on( 'error', ( error ) => {
    log.info( 'Error in auto-updater. ' + error );
    if ( download.status !== 'idle' ) {
      setDownload( { status: 'idle' } );
    }
    const message = error == null
      ? 'unknown'
      : error instanceof Error
        ? error.stack || error.message
        : String( error );
    dialog.showErrorBox( 'Error: ', message );
  } );
  updater.on( 'update-downloaded', () => {
    setDownload( { status: 'done' } );
    dialog
      .showMessageBox( {
        title: 'Install Updates',
        message: 'Updates downloaded, the application will now quit to update...',
      } )
      .then( () => {
        setImmediate( () => updater.quitAndInstall() );
      } );
    log.info( 'Update downloaded' );
  } );
}
