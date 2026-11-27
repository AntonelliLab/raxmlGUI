import { app, Notification } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import path from 'path';
import childProcess from 'child_process';
import type { ChildProcess } from 'child_process';
import { serializeError } from 'serialize-error';
import * as ipc from '../constants/ipc';
import { is, platform } from '../common/utils';
import UserFixError from '../common/errors';
import { activeWindow } from './utils/utils';
import { userFixMessage } from './binaryErrors';
import {
  forgetRun,
  runResult,
  stopRun,
  trackRun,
} from './cancelRun';

/** Run number, or alignment composite `${run.id}_${path}`. */
type TrackedId = string | number;

type ProcessExit =
  | 'SIGTERM'
  | number
  | NodeJS.Signals
  | null;

export interface RunOutputPayload {
  id: TrackedId;
  content: string;
}

interface RunProcessHooks {
  onStdOut?: ( content: string ) => void;
  onStdErr?: ( content: string ) => void;
}

// Packaged: electron-builder's extraResources copies static/ beside the asar. Unpacked: out/main/ sits two levels below the repo root.
export function getStaticDir(): string {
  return app.isPackaged
    ? path.join( process.resourcesPath, 'static' )
    : path.join( __dirname, '..', '..', 'static' );
}

export const get_space_safe_binary_path = ( bin_path: string ): string => {
  // For Windows users with spaces in user dir
  return is.windows
    ? `"${bin_path}"`
    : bin_path;
};

const binParentDir = app.isPackaged
  ? ''
  : platform( {
    macos: 'Mac',
    windows: 'Windows',
    linux: 'Linux',
  } );

export const binaryDir: string = path.join( getStaticDir(), 'bin', binParentDir );

export function send(
  event: IpcMainInvokeEvent,
  channel: string,
  data: { error?: unknown; [key: string]: unknown },
): void {
  // A run can outlive its window; sending to a destroyed WebContents throws.
  if ( event.sender.isDestroyed() ) {
    return;
  }
  if ( !data.error ) {
    event.sender.send( channel, data );
    return;
  }
  event.sender.send( channel, Object.assign( {}, data, { error: serializeError( data.error ) } ) );
}

export function spawnProcess(
  binaryDir: string,
  binaryName: string,
  args: string[],
): ChildProcess {
  const binaryPath = path.join( binaryDir, binaryName );
  const proc = childProcess.execFile( get_space_safe_binary_path( binaryPath ), args, {
    shell: is.windows,
  } );
  return proc;
}

export async function runProcess(
  id: TrackedId,
  event: IpcMainInvokeEvent,
  binaryDir: string,
  binaryName: string,
  args: string[],
  { onStdOut = ( _content: string ) => { }, onStdErr = ( _content: string ) => { } }: RunProcessHooks = {},
): Promise<ProcessExit> {
  return new Promise( ( resolve, reject ) => {
    stopRun( id );
    try {
      const proc = spawnProcess( binaryDir, binaryName, args );
      trackRun( id, proc );
      let exited = false;
      // Last stdout only: the binary prints its fatal reason just before exiting.
      let stdoutTail = '';
      proc.stdout.on( 'data', ( buffer: string | Buffer ) => {
        const content = String( buffer );
        stdoutTail = ( stdoutTail + content ).slice( -8192 );
        console.log( 'on stdout:', content );
        onStdOut( content );
        send( event, ipc.RUN_STDOUT, { id, content } );
      } );
      proc.stderr.on( 'data', ( buffer: string | Buffer ) => {
        const content = String( buffer );
        console.error( 'on stderr:', content );
        onStdErr( content );
        send( event, ipc.RUN_STDERR, { id, content } );
      } );
      const onQuit = ( message: string ) => (
        code: number | Error | null,
        signal: NodeJS.Signals | null,
      ) => {
        if ( exited ) {
          return;
        }
        console.log( `Process finished with event '${message}' and error/code/signal:`, signal || code );
        exited = true;
        forgetRun( id, proc );
        const result = runResult( proc, message, code as number | null, signal );
        const win = activeWindow();
        if ( !win || !win.isFocused() ) {
          const notification = new Notification( {
            title: app.name,
            body: 'Calculation finished',
          } );
          notification.show();
        }
        if ( result === 'SIGTERM' ) {
          resolve( result );
          return;
        }
        const fixMessage = result instanceof Error && userFixMessage( stdoutTail );
        if ( fixMessage ) {
          reject( new UserFixError( fixMessage ) );
          return;
        }
        if ( message === 'error' || result instanceof Error ) {
          reject( result ); // code is an error object on 'error' event
          return;
        }
        resolve( result ); // Add code last to get through code 0
      };
      // Not 'exit': stdout can still deliver the binary's last line after it, and the user-fix match needs that line.
      ( ['error', 'close'] as const ).forEach( ( message ) => {
        proc.on( message, onQuit( message ) as ( ...args: unknown[] ) => void );
      } );
    }
    catch ( err: unknown ) {
      console.log( 'Run catch error:', err );
      reject( err );
    }
  } );
}
