// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { spawn } from 'child_process';
import { once } from 'events';
import fs from 'fs';
import path from 'path';

import { beginRun, cancelRun, finishedRun, forgetRun, runResult, stillRunning, trackRun } from './cancelRun';

it( 'cancelRun stops that run and sends no terminal event', async () => {
  const proc = spawn( process.execPath, ['-e', 'setTimeout(() => {}, 30000)'] );
  trackRun( 'run-7', proc );
  try {
    cancelRun( 'run-7' );
    await once( proc, 'exit' );
    const exitCode = runResult( proc, 'exit', 1, null );
    expect( exitCode ).toBe( 'SIGTERM' );
    expect( finishedRun( exitCode ) ).toBe( false );
  } finally {
    if ( proc.exitCode === null && proc.signalCode === null ) {
      proc.kill( 'SIGKILL' );
    }
  }
} );

it( 'a late exit from a cancelled run leaves the next run tracked', () => {
  const oldProc = { kill() { this.killed = true; } };
  const nextProc = { kill() { this.killed = true; } };
  const token = beginRun( 'run-8' );
  trackRun( 'run-8', oldProc );
  cancelRun( 'run-8' );
  expect( stillRunning( 'run-8', token ) ).toBe( false );
  const next = beginRun( 'run-8' );
  trackRun( 'run-8', nextProc );
  forgetRun( 'run-8', oldProc );
  expect( stillRunning( 'run-8', next ) ).toBe( true );
  cancelRun( 'run-8' );
  expect( nextProc.killed ).toBe( true );
} );

it( 'a finished run still reports its result', () => {
  expect( runResult( { cancelled: false }, 'exit', 0, null ) ).toBe( 0 );
  expect( finishedRun( 0 ) ).toBe( true );
} );

it( 'the run handler returns before a terminal event once the run is no longer current', () => {
  const source = fs.readFileSync( path.join( __dirname, 'api.js' ), 'utf8' );
  const start = source.indexOf( 'ipcMain.handle( ipc.RUN_START' );
  const end = source.indexOf( 'ipcMain.handle( ipc.RUN_CANCEL' );
  const handler = source.slice( start, end );
  const finished = handler.lastIndexOf( 'ipc.RUN_FINISHED' );
  expect( handler.slice( 0, finished ) ).toContain( 'stillRunning' );
  expect( handler ).toContain( 'reportError( error )' );
  expect( handler ).toContain( 'reportError( err )' );
  expect( source ).toContain( 'forgetRun( id, proc )' );
} );

it( 'a failed run still reports the exit error', () => {
  const result = runResult( { cancelled: false }, 'exit', 1, null );
  expect( result ).toEqual( new Error( 'Exited with code 1. Check console output for more information.' ) );
} );
