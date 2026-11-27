import { afterEach, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';
import type { BrowserWindow, Dialog } from 'electron';
import type { AppUpdater } from 'electron-updater';
import { applyUpdateDownloadBar, checkForUpdates, getUpdateDownload, listenForUpdates } from './updates';

vi.mock( 'electron-log', () => ( { default: { info: vi.fn() } } ) );

const { platform } = process;

afterEach( () => {
  Object.defineProperty( process, 'platform', { value: platform } );
  vi.mocked( log.info ).mockClear();
} );

function updater( download: () => Promise<unknown> = () => Promise.resolve( [] ) ) {
  const listeners: Record<string, ( payload?: unknown ) => void> = Object.create( null );
  return {
    on( event: string, fn: ( payload?: unknown ) => void ) {
      listeners[event] = fn;
    },
    emit( event: string, payload?: unknown ) {
      const fn = listeners[event];
      if ( fn ) {
        fn( payload );
      }
    },
    has( event: string ) {
      return event in listeners;
    },
    downloadUpdate: vi.fn( download ),
    quitAndInstall: vi.fn(),
  };
}

function fakeWindow() {
  return {
    setProgressBar: vi.fn<( value: number ) => void>(),
    webContents: { send: vi.fn<( channel: string, payload: { status: string } ) => void>() },
  };
}

function progress( percent: number ) {
  return { percent, bytesPerSecond: 1, transferred: 1, total: 2 };
}

function logs() {
  return vi.mocked( log.info ).mock.calls.map( ( [line] ) => String( line ) );
}

// Listens with a fake window and clicks Yes on Found Updates.
async function startDownload( options: {
  win?: ReturnType<typeof fakeWindow> | null;
  download?: () => Promise<unknown>;
} = {} ) {
  const updates = updater( options.download );
  const win = options.win === undefined
    ? fakeWindow()
    : options.win;
  const calls: string[] = [];
  win?.setProgressBar.mockImplementation( ( value ) => {
    calls.push( `bar ${value}` );
  } );
  win?.webContents.send.mockImplementation( ( _channel, payload ) => {
    calls.push( `send ${payload.status}` );
  } );
  const choice = Promise.resolve( { response: 0 } );
  const dialog = {
    showMessageBox: vi.fn<( options: unknown ) => Promise<{ response: number }>>( () => choice ),
    showErrorBox: vi.fn( () => {
      calls.push( 'error box' );
    } ),
  };
  listenForUpdates(
    updates as unknown as AppUpdater,
    dialog as unknown as Dialog,
    () => win as unknown as BrowserWindow | null,
  );
  updates.emit( 'update-available' );
  await choice;
  return { updates, win, dialog, calls };
}

it( 'No on Found Updates leaves the current version', async () => {
  const updates = updater();
  const choice = Promise.resolve( { response: 1 } );
  const dialog = {
    showMessageBox: vi.fn( () => choice ),
    showErrorBox: vi.fn(),
  };
  listenForUpdates( updates as unknown as AppUpdater, dialog as unknown as Dialog, () => null );
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
  expect( getUpdateDownload() ).toEqual( { status: 'idle' } );
} );

it( 'Yes downloads the update and shows its progress on the icon', async () => {
  Object.defineProperty( process, 'platform', { value: 'darwin' } );
  const { updates, win, dialog } = await startDownload();
  expect( updates.downloadUpdate ).toHaveBeenCalledWith();
  expect( getUpdateDownload() ).toEqual( { status: 'connecting' } );
  expect( win?.setProgressBar ).toHaveBeenLastCalledWith( 2 );
  updates.emit( 'download-progress', progress( 40 ) );
  expect( getUpdateDownload() ).toEqual( { status: 'downloading', percent: 40 } );
  expect( win?.setProgressBar ).toHaveBeenLastCalledWith( 0.4 );
  expect( dialog.showMessageBox ).toHaveBeenCalledTimes( 1 );
  expect( dialog.showErrorBox ).not.toHaveBeenCalled();
} );

it( 'every state change is sent to the page', async () => {
  const { updates, win } = await startDownload();
  updates.emit( 'download-progress', progress( 42 ) );
  updates.emit( 'download-progress', progress( 10 ) );
  updates.emit( 'update-downloaded' );
  updates.emit( 'error', new Error( 'network down' ) );
  expect( win?.webContents.send.mock.calls ).toEqual( [
    ['UPDATE_DOWNLOAD', { id: 'update', status: 'connecting' }],
    ['UPDATE_DOWNLOAD', { id: 'update', status: 'downloading', percent: 42 }],
    ['UPDATE_DOWNLOAD', { id: 'update', status: 'restarted', percent: 10 }],
    ['UPDATE_DOWNLOAD', { id: 'update', status: 'done' }],
    ['UPDATE_DOWNLOAD', { id: 'update', status: 'idle' }],
  ] );
} );

it( 'the download-progress listener is registered before any download starts', () => {
  const updates = updater();
  listenForUpdates( updates as unknown as AppUpdater, {} as Dialog, () => null );
  expect( updates.has( 'download-progress' ) ).toBe( true );
} );

it( 'on Linux the indeterminate bar is never sent', async () => {
  Object.defineProperty( process, 'platform', { value: 'linux' } );
  const { updates, win } = await startDownload();
  expect( getUpdateDownload() ).toEqual( { status: 'connecting' } );
  updates.emit( 'download-progress', progress( 10 ) );
  expect( win?.setProgressBar.mock.calls ).toEqual( [[0.1]] );
} );

it( 'a lower percent moves the download to restarted, which stays sticky', async () => {
  const { updates, win } = await startDownload();
  updates.emit( 'download-progress', progress( 60 ) );
  updates.emit( 'download-progress', progress( 5 ) );
  expect( getUpdateDownload() ).toEqual( { status: 'restarted', percent: 5 } );
  expect( win?.setProgressBar ).toHaveBeenLastCalledWith( 0.05 );
  updates.emit( 'download-progress', progress( 80 ) );
  expect( getUpdateDownload() ).toEqual( { status: 'restarted', percent: 80 } );
  expect( win?.setProgressBar ).toHaveBeenLastCalledWith( 0.8 );
} );

it( 'a finished download clears the bar and quits to install', async () => {
  const { updates, win, dialog } = await startDownload();
  updates.emit( 'download-progress', progress( 100 ) );
  updates.emit( 'update-downloaded' );
  expect( getUpdateDownload() ).toEqual( { status: 'done' } );
  expect( win?.setProgressBar ).toHaveBeenLastCalledWith( -1 );
  await dialog.showMessageBox.mock.results[1].value;
  await new Promise( ( resolve ) => setImmediate( resolve ) );
  expect( dialog.showMessageBox ).toHaveBeenLastCalledWith( {
    title: 'Install Updates',
    message: 'Updates downloaded, the application will now quit to update...',
  } );
  expect( updates.quitAndInstall ).toHaveBeenCalledWith();
  expect( logs() ).toEqual( ['Update available.', 'Update download started.', 'Update downloaded'] );
} );

it( 'an error mid-download resets the state, clears the bar, then shows the error box', async () => {
  const { updates, calls } = await startDownload();
  updates.emit( 'download-progress', progress( 30 ) );
  calls.length = 0;
  updates.emit( 'error', new Error( 'network down' ) );
  expect( getUpdateDownload() ).toEqual( { status: 'idle' } );
  expect( calls ).toEqual( ['send idle', 'bar -1', 'error box'] );
  expect( logs() ).toEqual( [
    'Update available.',
    'Update download started.',
    'Error in auto-updater. Error: network down',
  ] );
} );

it( 'a rejected downloadUpdate produces no unhandled rejection', async () => {
  const unhandled = vi.fn();
  process.on( 'unhandledRejection', unhandled );
  try {
    await startDownload( { download: () => Promise.reject( new Error( 'net::ERR_FAILED' ) ) } );
    await new Promise( ( resolve ) => setImmediate( resolve ) );
    expect( unhandled ).not.toHaveBeenCalled();
  } finally {
    process.off( 'unhandledRejection', unhandled );
  }
} );

it( 'with no window nothing throws and the state still advances', async () => {
  const { updates } = await startDownload( { win: null } );
  updates.emit( 'download-progress', progress( 20 ) );
  expect( getUpdateDownload() ).toEqual( { status: 'downloading', percent: 20 } );
  updates.emit( 'update-downloaded' );
  expect( getUpdateDownload() ).toEqual( { status: 'done' } );
} );

it( 'a newly created window gets the held bar value', async () => {
  const { updates } = await startDownload( { win: null } );
  updates.emit( 'download-progress', progress( 70 ) );
  const reopened = fakeWindow();
  applyUpdateDownloadBar( reopened as unknown as BrowserWindow );
  expect( reopened.setProgressBar ).toHaveBeenCalledWith( 0.7 );
} );

it( 'a failed update uses the error dialog', () => {
  const updates = updater();
  const dialog = {
    showMessageBox: vi.fn(),
    showErrorBox: vi.fn(),
  };
  const win = fakeWindow();
  listenForUpdates(
    updates as unknown as AppUpdater,
    dialog as unknown as Dialog,
    () => win as unknown as BrowserWindow,
  );
  const failure = new Error( 'network down' );
  updates.emit( 'error', failure );
  expect( dialog.showErrorBox ).toHaveBeenCalledWith( 'Error: ', expect.stringContaining( 'network down' ) );
  expect( updates.downloadUpdate ).not.toHaveBeenCalled();
  expect( updates.quitAndInstall ).not.toHaveBeenCalled();
  expect( win.setProgressBar ).not.toHaveBeenCalled();
} );

it( 'the shell opens no update progress window', () => {
  const pkg = JSON.parse( fs.readFileSync( path.join( __dirname, '../../package.json' ), 'utf8' ) );
  const main = fs.readFileSync( path.join( __dirname, 'index.ts' ), 'utf8' );
  const updates = fs.readFileSync( path.join( __dirname, 'updates.ts' ), 'utf8' );
  expect( pkg.dependencies['electron-progressbar'] ).toBeUndefined();
  expect( main ).toContain( 'listenForUpdates( autoUpdater, dialog, () => mainWindow )' );
  expect( main + updates ).not.toContain( 'electron-progressbar' );
  expect( main + updates ).not.toMatch( /\bProgressBar\b/ );
} );

it( 'an offline update check rejects nothing (the error event already reports it)', async () => {
  const updates = {
    ...updater(),
    autoDownload: true,
    checkForUpdates: vi.fn( () => Promise.reject( new Error( 'net::ERR_INTERNET_DISCONNECTED' ) ) ),
  };
  await expect( checkForUpdates( updates as unknown as AppUpdater ) ).resolves.toBeUndefined();
  expect( updates.autoDownload ).toBe( false );
} );
