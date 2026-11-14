// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { spawn } from 'child_process';
import { once } from 'events';
import fs from 'fs';
import path from 'path';

import {
  beginRun,
  cancelRun,
  finishedRun,
  forgetRun,
  runResult,
  stillRunning,
  trackRun,
} from './cancelRun';

it( 'cancelRun stops that run and sends no terminal event', async () => {
  const proc = spawn( process.execPath, ['-e', 'setTimeout(() => {}, 30000)'] );
  trackRun( 7, proc );
  try {
    cancelRun( 7 );
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
  const token = beginRun( 8 );
  trackRun( 8, oldProc );
  cancelRun( 8 );
  expect( stillRunning( 8, token ) ).toBe( false );
  const next = beginRun( 8 );
  trackRun( 8, nextProc );
  forgetRun( 8, oldProc );
  expect( stillRunning( 8, next ) ).toBe( true );
  cancelRun( 8 );
  expect( nextProc.killed ).toBe( true );
} );

it( 'a finished run still reports its result', () => {
  expect( runResult( { cancelled: false }, 'exit', 0, null ) ).toBe( 0 );
  expect( finishedRun( 0 ) ).toBe( true );
} );

it( 'the model selection handler returns before a terminal event once cancelled', () => {
  const handler = fs.readFileSync( path.join( __dirname, 'modelSelection.ts' ), 'utf8' );
  const started = handler.indexOf( 'await runProcess' );
  const success = handler.lastIndexOf( 'ipc.ALIGNMENT_MODEL_SELECTION_SUCCESS' );
  const failure = handler.indexOf( 'ipc.ALIGNMENT_MODEL_SELECTION_FAILURE' );
  const beforeStart = handler.slice( handler.indexOf( 'await fs.unlink' ), started );
  const afterStart = handler.slice( started, success );
  expect( handler.slice( 0, started ) ).toContain( 'beginRun' );
  expect( beforeStart ).toContain( '!stillRunning' );
  expect( afterStart ).toContain( '!stillRunning' );
  expect( afterStart ).toContain( "exitCode === 'SIGTERM'" );
  expect( handler.slice( 0, failure ) ).toContain( '!stillRunning' );
} );

it( 'the run handler returns before a terminal event once the run is no longer current', () => {
  const handler = fs.readFileSync( path.join( __dirname, 'startRun.ts' ), 'utf8' );
  const helpers = fs.readFileSync( path.join( __dirname, 'processHelpers.ts' ), 'utf8' );
  const finished = handler.lastIndexOf( 'ipc.RUN_FINISHED' );
  const tail = handler.slice( handler.lastIndexOf( 'await ', finished ), finished );
  expect( tail ).toContain( '!stillRunning' );
  expect( handler ).toContain( 'reportError( error )' );
  expect( handler ).toContain( 'reportError( err )' );
  expect( helpers ).toContain( 'forgetRun( id, proc )' );
} );

it( 'a failed run still reports the exit error', () => {
  const result = runResult( { cancelled: false }, 'exit', 1, null );
  expect( result ).toEqual( new Error( 'Exited with code 1. Check console output for more information.' ) );
} );
