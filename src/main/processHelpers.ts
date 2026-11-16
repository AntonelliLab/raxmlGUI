import { app, Notification } from 'electron';
import type { IpcMainEvent } from 'electron';
import path from 'path';
import childProcess from 'child_process';
import type { ChildProcess } from 'child_process';
import { serializeError } from 'serialize-error';
import * as ipc from '../constants/ipc';
import { is, platform } from '../common/utils';
import UserFixError from '../common/errors';
import { activeWindow } from './utils/utils';
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

interface RunProcessHooks {
  onStdOut?: ( content: string ) => void;
  onStdErr?: ( content: string ) => void;
}

export function getStaticDir(): string {
  if ( process.env.RAXMLGUI_E2E === '1' ) {
    return path.join( __dirname, '..', '..', 'static' );
  }
  return __static;
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
  event: IpcMainEvent,
  channel: string,
  data: { error?: unknown; [key: string]: unknown },
): void {
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
  event: IpcMainEvent,
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
      let unwritableFile: RegExpMatchArray | null = null;
      proc.stdout.on( 'data', ( buffer: string | Buffer ) => {
        const content = String( buffer );
        unwritableFile = unwritableFile || content.match( /The file (.+?) RAxML wants to open for writing or appending can not be opened/ );
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
        if ( unwritableFile && result instanceof Error ) {
          reject( new UserFixError( `RAxML could not write to the output file '${unwritableFile[1]}'. Check that the output folder is writable and that the file is not open in another program.` ) );
          return;
        }
        if ( message === 'error' || result instanceof Error ) {
          reject( result ); // code is an error object on 'error' event
          return;
        }
        resolve( result ); // Add code last to get through code 0
      };
      ( ['error', 'exit', 'close'] as const ).forEach( ( message ) => {
        proc.on( message, onQuit( message ) as ( ...args: unknown[] ) => void );
      } );
    }
    catch ( err: unknown ) {
      console.log( 'Run catch error:', err );
      reject( err );
    }
  } );
}
