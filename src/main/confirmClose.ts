import type { App, BrowserWindow, Dialog, Event } from 'electron';
import { hasRuns, stopAllRuns } from './cancelRun';

/**
 * Asks before closing `win` (or quitting, which closes it) while a run is in progress.
 * Stop kills the runs, then closes or quits; Cancel leaves window and runs as they were.
 */
const STOP = 1;

export function confirmCloseWithRuns( win: BrowserWindow, dialog: Dialog, app: App ): void {
  // A prevented close also cancels a quit; the flag remembers to quit again on Stop.
  let quitting = false;
  let asking = false;
  const onBeforeQuit = (): void => {
    quitting = true;
  };
  app.on( 'before-quit', onBeforeQuit );
  win.once( 'closed', () => app.off( 'before-quit', onBeforeQuit ) );
  win.on( 'close', ( event: Event ) => {
    if ( !hasRuns() ) {
      return;
    }
    event.preventDefault();
    if ( asking ) {
      return;
    }
    asking = true;
    void dialog.showMessageBox( win, {
      type: 'warning',
      title: 'Run in progress',
      message: 'A run is in progress. Do you really want to stop the run by closing the window?',
      buttons: ['Cancel', 'Stop run and close'],
      defaultId: 0,
      cancelId: 0,
    } ).then( ( { response } ) => {
      const wasQuitting = quitting;
      asking = false;
      quitting = false;
      if ( response !== STOP ) {
        return;
      }
      stopAllRuns();
      if ( wasQuitting ) {
        app.quit();
      }
      else {
        win.close();
      }
    } );
  } );
}
