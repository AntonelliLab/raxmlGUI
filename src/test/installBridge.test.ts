import { expect, test, vi } from 'vitest';

import { runEvents } from '../app/store/StoreBase';

import { installBridge } from './setup';

test( 'the page sees the supplied methods on the same default bridge object', () => {
  const defaultBridge = window.rendererBridge;
  const readFile = vi.fn( () => Promise.resolve( '>Homo\nAT' ) );

  const installed = installBridge( { readFile } );

  expect( installed ).toBe( defaultBridge );
  expect( window.rendererBridge ).toBe( defaultBridge );
  expect( window.rendererBridge.readFile ).toBe( readFile );
} );

test( 'the defaults the setup stubs are still there', () => {
  const { host, getVersion } = window.rendererBridge;

  installBridge( { openPath: () => Promise.resolve( '' ) } );

  expect( window.rendererBridge.host ).toBe( host );
  expect( window.rendererBridge.getVersion ).toBe( getVersion );
  for ( const name of Object.values( runEvents ) ) {
    expect( typeof window.rendererBridge[name] ).toBe( 'function' );
  }
} );

test( 'a supplied host getter is installed without being read', () => {
  const original = Object.getOwnPropertyDescriptor( window.rendererBridge, 'host' );
  const read = vi.fn( () => original.value );

  installBridge( Object.defineProperty( {}, 'host', { configurable: true, enumerable: true, get: read } ) );

  expect( read ).not.toHaveBeenCalled();
  Object.defineProperty( window.rendererBridge, 'host', original );
} );
