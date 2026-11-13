// @ts-nocheck — Jest globals. checkJs has no test runner types.
import fs from 'fs';
import path from 'path';
import { setImmediate } from 'timers';
import { listenForUpdates } from './updates';

global.setImmediate = setImmediate;

function updater() {
  const listeners = Object.create( null );
  return {
    on( event, fn ) {
      listeners[event] = fn;
    },
    emit( event, payload ) {
      const fn = listeners[event];
      if ( fn ) {
        fn( payload );
      }
    },
    downloadUpdate: jest.fn(),
    quitAndInstall: jest.fn(),
  };
}

it( 'No on Found Updates leaves the current version', async () => {
  const updates = updater();
  const choice = Promise.resolve( { response: 1 } );
  const dialog = {
    showMessageBox: jest.fn( () => choice ),
    showErrorBox: jest.fn(),
  };
  listenForUpdates( updates, dialog );
  updates.emit( 'update-available' );
  await choice;
  expect( dialog.showMessageBox ).toHaveBeenCalledWith( {
    type: 'info',
    title: 'Found Updates',
    message: 'An update for RAxML-GUI is available, do you want to update now and restart?',
    buttons: ['Yes', 'No'],
    cancelId: 1,
  } );
  expect( updates.downloadUpdate ).not.toHaveBeenCalled();
  expect( updates.quitAndInstall ).not.toHaveBeenCalled();
} );

it( 'Yes downloads the update with no window, bar, or percent', async () => {
  const updates = updater();
  const choice = Promise.resolve( { response: 0 } );
  const dialog = {
    showMessageBox: jest.fn( () => choice ),
    showErrorBox: jest.fn(),
  };
  listenForUpdates( updates, dialog );
  updates.emit( 'update-available' );
  await choice;
  expect( updates.downloadUpdate ).toHaveBeenCalledWith();
  expect( dialog.showMessageBox ).toHaveBeenCalledTimes( 1 );
  expect( JSON.stringify( dialog.showMessageBox.mock.calls[0][0] ) ).not.toMatch( /%|percent|progress/i );
  updates.emit( 'download-progress', {
    percent: 40,
    bytesPerSecond: 1,
    transferred: 1,
    total: 2,
  } );
  expect( dialog.showMessageBox ).toHaveBeenCalledTimes( 1 );
  expect( dialog.showErrorBox ).not.toHaveBeenCalled();
} );

it( 'a finished download quits to install', async () => {
  const updates = updater();
  const dialog = {
    showMessageBox: jest.fn( () => Promise.resolve( { response: 0 } ) ),
    showErrorBox: jest.fn(),
  };
  listenForUpdates( updates, dialog );
  updates.emit( 'update-downloaded' );
  await dialog.showMessageBox.mock.results[0].value;
  await new Promise( ( resolve ) => setImmediate( resolve ) );
  expect( dialog.showMessageBox ).toHaveBeenCalledWith( {
    title: 'Install Updates',
    message: 'Updates downloaded, the application will now quit to update...',
  } );
  expect( updates.quitAndInstall ).toHaveBeenCalledWith();
} );

it( 'a failed update uses the error dialog', () => {
  const updates = updater();
  const dialog = {
    showMessageBox: jest.fn(),
    showErrorBox: jest.fn(),
  };
  listenForUpdates( updates, dialog );
  const failure = new Error( 'network down' );
  updates.emit( 'error', failure );
  expect( dialog.showErrorBox ).toHaveBeenCalledWith( 'Error: ', expect.stringContaining( 'network down' ) );
  expect( updates.downloadUpdate ).not.toHaveBeenCalled();
  expect( updates.quitAndInstall ).not.toHaveBeenCalled();
} );

it( 'the shell opens no update progress window', () => {
  const pkg = JSON.parse( fs.readFileSync( path.join( __dirname, '../../package.json' ), 'utf8' ) );
  const main = fs.readFileSync( path.join( __dirname, 'index.js' ), 'utf8' );
  const updates = fs.readFileSync( path.join( __dirname, 'updates.js' ), 'utf8' );
  expect( pkg.dependencies['electron-progressbar'] ).toBeUndefined();
  expect( main ).toContain( 'listenForUpdates( autoUpdater, dialog )' );
  expect( main + updates ).not.toContain( 'electron-progressbar' );
  expect( main + updates ).not.toContain( 'ProgressBar' );
  expect( main + updates ).not.toContain( 'download-progress' );
} );
