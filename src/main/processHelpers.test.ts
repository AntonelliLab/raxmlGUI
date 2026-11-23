import { expect, it, vi } from 'vitest';
import type { IpcMainEvent } from 'electron';

vi.mock( 'electron', () => ( {
  app: { isPackaged: false, getAppPath: () => '' },
  Notification: class {},
} ) );

// The build defines __static; the module reads it at import.
vi.stubGlobal( '__static', '' );

const { send } = await import( './processHelpers' );

const eventWith = ( destroyed: boolean ) => {
  const sender = {
    isDestroyed: () => destroyed,
    send: vi.fn( () => {
      if ( destroyed ) {
        throw new TypeError( 'Object has been destroyed' );
      }
    } ),
  };
  return { event: { sender } as unknown as IpcMainEvent, sender };
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
