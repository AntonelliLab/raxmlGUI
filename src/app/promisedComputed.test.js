// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { observable, runInAction, reaction, when } from 'mobx';
import { promisedComputed } from './promisedComputed';

it( 'keeps the last value while pending and throws a rejection', async () => {
  const input = observable.box( 1 );
  const pc = promisedComputed( 0, async () => {
    const n = input.get();
    if ( n === 3 ) {
      throw new Error( 'boom' );
    }
    return n * 10;
  } );
  const seen = [];
  const errors = [];
  const stop = reaction(
    () => {
      try {
        return pc.get();
      } catch ( e ) {
        errors.push( e.message );
        return 'error';
      }
    },
    ( v ) => seen.push( v ),
    { fireImmediately: true },
  );
  await when( () => pc.value === 10, { timeout: 1000 } ).catch( () => {} );
  runInAction( () => input.set( 2 ) );
  await when( () => pc.value === 20, { timeout: 1000 } );
  runInAction( () => input.set( 3 ) );
  await new Promise( ( r ) => setTimeout( r, 20 ) );
  stop();
  expect( seen ).toEqual( [0, 10, 20, 'error'] );
  expect( errors ).toEqual( ['boom'] );
} );
