import log from 'electron-log';
import type { Dialog } from 'electron';
import type { AppUpdater } from 'electron-updater';

export function listenForUpdates( updater: AppUpdater, dialog: Dialog ): void {
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
          updater.downloadUpdate();
        }
      } );
    log.info( 'Update available.' );
  } );
  updater.on( 'update-not-available', () => {
    log.info( 'Update not available.' );
  } );
  updater.on( 'error', ( error ) => {
    log.info( 'Error in auto-updater. ' + error );
    const message = error == null
      ? 'unknown'
      : error instanceof Error
        ? error.stack || error.message
        : String( error );
    dialog.showErrorBox( 'Error: ', message );
  } );
  updater.on( 'update-downloaded', () => {
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
