import path from 'path';
import type { IpcMainEvent } from 'electron';
import * as ipc from '../constants/ipc';
import { quote } from '../common/utils';
import {
  binaryDir,
  runProcess,
  send,
} from './processHelpers';

type RunId = number;

type ProcessExit =
  | 'SIGTERM'
  | number
  | NodeJS.Signals
  | null;

interface AstralPayload {
  id: RunId;
  binaryName: string;
  args: string[][];
}

export async function runAstral(
  event: IpcMainEvent,
  payload: AstralPayload,
): Promise<void> {
  const { id, binaryName, args } = payload;
  const javaBin = 'java';
  const [arg] = args;
  arg.splice( 0, 0, '-jar', quote( path.join( binaryDir, binaryName ) ) );
  let exitCode: ProcessExit = 0;
  try {
    console.log( 'arg', arg );
    console.log( `ASTRAL?` );
    exitCode = await runProcess( id, event, '', javaBin, arg );
    if ( exitCode !== 0 ) {
      if ( exitCode === 'SIGTERM' ) {
        // Cancelled
        return;
      }
      throw new Error( `Error trying to run ASTRAL, exited with code '${exitCode}'.` );
    }
  }
  catch ( err: unknown ) {
    console.error( 'ASTRAL run error:', err );
    send( event, ipc.RUN_ERROR, { id, error: err } );
    return;
  }
  send( event, ipc.ASTRAL_SUCCESS, {
    id,
    exitCode,
  } );
}
