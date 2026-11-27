import { expect, it, vi } from 'vitest';
import path from 'path';
import type { IpcMainInvokeEvent } from 'electron';

vi.mock( 'electron', () => ( {
  app: { isPackaged: false, getAppPath: () => '' },
  Notification: class {},
} ) );

vi.mock( './utils/utils', () => ( {
  activeWindow: () => ( { isFocused: () => true } ),
} ) );

// The build defines __static; the module reads it at import.
vi.stubGlobal( '__static', '' );

const { runProcess, send } = await import( './processHelpers' );

const eventWith = ( destroyed: boolean ) => {
  const sender = {
    isDestroyed: () => destroyed,
    send: vi.fn( () => {
      if ( destroyed ) {
        throw new TypeError( 'Object has been destroyed' );
      }
    } ),
  };
  return { event: { sender } as unknown as IpcMainInvokeEvent, sender };
};

it( 'send delivers to a live window', () => {
  const { event, sender } = eventWith( false );
  send( event, 'channel', { id: 1 } );
  expect( sender.send ).toHaveBeenCalledWith( 'channel', { id: 1 } );
} );

it( 'send skips a destroyed window instead of throwing', () => {
  const { event, sender } = eventWith( true );
  expect( () => send( event, 'channel', { id: 1 } ) ).not.toThrow();
  expect( sender.send ).not.toHaveBeenCalled();
} );

// A stand-in binary: node prints the fatal line, then exits with RAxML's failure code.
// The line goes through the env and the script has no quotes or spaces: on Windows the args pass through cmd.exe.
const failWith = ( line: string ) => {
  vi.stubEnv( 'RAXMLGUI_TEST_STDOUT', line );
  return runProcess(
    'test',
    eventWith( false ).event,
    path.dirname( process.execPath ),
    path.basename( process.execPath ),
    ['-e', 'process.exitCode=255,process.stdout.write(process.env.RAXMLGUI_TEST_STDOUT)'],
  );
};

it( 'runProcess rejects with a UserFixError when the binary prints a known cause', async () => {
  await expect( failWith( 'ERROR: Bad base (_) at site 99 of sequence 1\n' ) ).rejects.toMatchObject( {
    isUserFix: true,
    message: expect.stringContaining( 'bad base (_) at site 99 of sequence 1' ),
  } );
} );

it( 'runProcess rejects with the exit code when the cause is unknown', async () => {
  const error = await failWith( 'Segmentation fault\n' ).catch( ( err: unknown ) => err );
  expect( error ).toMatchObject( { message: expect.stringContaining( 'Exited with code 255' ) } );
  expect( error ).not.toHaveProperty( 'isUserFix' );
} );
