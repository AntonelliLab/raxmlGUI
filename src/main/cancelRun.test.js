// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { spawn } from 'child_process';
import { once } from 'events';

import { cancelRun, finishedRun, runResult, trackRun } from './cancelRun';

it( 'cancelRun stops that run and sends no terminal event', async () => {
  const proc = spawn( process.execPath, ['-e', 'setTimeout(() => {}, 30000)'] );
  const payload = {
    id: 'run-7',
    resultDir: '/out',
    resultFilenames: ['primates.tre'],
    exitCode: 'SIGTERM',
  };
  trackRun( 'run-7', proc );
  try {
    cancelRun( 'run-7' );
    await once( proc, 'exit' );
    const exitCode = runResult( proc, 'exit', 1, null );
    expect( exitCode ).toBe( 'SIGTERM' );
    expect( finishedRun( exitCode, payload ) ).toBeNull();
  } finally {
    if ( proc.exitCode === null && proc.signalCode === null ) {
      proc.kill( 'SIGKILL' );
    }
  }
} );

it( 'a finished run still reports its result', () => {
  const payload = {
    id: 'run-7',
    resultDir: '/out',
    resultFilenames: ['primates.tre'],
    exitCode: 0,
  };
  expect( runResult( { cancelled: false }, 'exit', 0, null ) ).toBe( 0 );
  expect( finishedRun( 0, payload ) ).toEqual( payload );
} );

it( 'a failed run still reports the exit error', () => {
  const result = runResult( { cancelled: false }, 'exit', 1, null );
  expect( result ).toEqual( new Error( 'Exited with code 1. Check console output for more information.' ) );
} );
