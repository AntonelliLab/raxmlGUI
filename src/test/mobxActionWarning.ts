// @ts-nocheck — this test setup is not typed yet.
// Fails a test when MobX warns that observable state was changed outside an action.
import { afterEach, beforeEach, vi } from 'vitest';

const collected = [];
let warn;

// The warnings collected during the running test; the proof test clears them after asserting.
export const actionWarnings = () => collected;

beforeEach( () => {
  collected.length = 0;
  const original = console.warn;
  warn = vi.spyOn( console, 'warn' ).mockImplementation( ( ...args ) => {
    if ( /\[MobX\] Since strict-mode is enabled/.test( String( args[0] ) ) ) {
      collected.push( args[0] );
    } else {
      original.apply( console, args );
    }
  } );
} );

afterEach( () => {
  warn.mockRestore();
  if ( collected.length ) {
    throw new Error( `MobX changed observable state outside an action:\n${collected.join( '\n' )}` );
  }
} );
