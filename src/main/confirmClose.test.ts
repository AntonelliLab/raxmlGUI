import { afterEach, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import type { App, BrowserWindow, Dialog } from 'electron';
import { stopAllRuns, trackRun } from './cancelRun';
import { confirmCloseWithRuns } from './confirmClose';

function setup( response: number ) {
  const win = Object.assign( new EventEmitter(), { close: vi.fn() } );
  const app = Object.assign( new EventEmitter(), { quit: vi.fn() } );
  const choice = Promise.resolve( { response } );
  const dialog = { showMessageBox: vi.fn( () => choice ) };
  confirmCloseWithRuns( win as unknown as BrowserWindow, dialog as unknown as Dialog, app as unknown as App );
  const close = () => {
    const event = { preventDefault: vi.fn() };
    win.emit( 'close', event );
    return event;
  };
  return { win, app, dialog, choice, close };
}

function running() {
  const proc = { kill: vi.fn() };
  trackRun( 5, proc );
  return proc;
}

afterEach( () => stopAllRuns() );

it( 'closes with no dialog when no run is in progress', () => {
  const { dialog, close } = setup( 1 );
  expect( close().preventDefault ).not.toHaveBeenCalled();
  expect( dialog.showMessageBox ).not.toHaveBeenCalled();
} );

it( 'Cancel keeps the window open and the run untouched', async () => {
  const proc = running();
  const { win, dialog, choice, close } = setup( 0 );
  expect( close().preventDefault ).toHaveBeenCalled();
  await choice;
  expect( dialog.showMessageBox ).toHaveBeenCalledTimes( 1 );
  expect( proc.kill ).not.toHaveBeenCalled();
  expect( win.close ).not.toHaveBeenCalled();
} );

it( 'Stop kills the run and closes the window', async () => {
  const proc = running();
  const { win, app, choice, close } = setup( 1 );
  close();
  await choice;
  expect( proc.kill ).toHaveBeenCalled();
  expect( win.close ).toHaveBeenCalled();
  expect( app.quit ).not.toHaveBeenCalled();
} );

it( 'a quit while the dialog is open asks once and quits on Stop', async () => {
  running();
  const { win, app, dialog, choice, close } = setup( 1 );
  close();
  app.emit( 'before-quit' );
  expect( close().preventDefault ).toHaveBeenCalled();
  await choice;
  expect( dialog.showMessageBox ).toHaveBeenCalledTimes( 1 );
  expect( app.quit ).toHaveBeenCalled();
  expect( win.close ).not.toHaveBeenCalled();
} );

it( 'Stop during a quit kills the run and quits again', async () => {
  const proc = running();
  const { win, app, choice, close } = setup( 1 );
  app.emit( 'before-quit' );
  close();
  await choice;
  expect( proc.kill ).toHaveBeenCalled();
  expect( app.quit ).toHaveBeenCalled();
  expect( win.close ).not.toHaveBeenCalled();
} );
