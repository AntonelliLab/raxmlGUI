// @ts-nocheck — Jest globals. checkJs has no test runner types.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Page from './index';
import store from './store';

it( 'the page shows an unhandled error title and error', () => {
  let hear;
  window.rendererBridge = {
    onUnhandledError( listener ) {
      hear = listener;
      return () => {};
    },
  };
  store.listen();

  const div = document.createElement( 'div' );
  document.body.appendChild( div );
  const root = createRoot( div );
  // createRoot().render paints on a later tick. act flushes that paint.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act( () => {
    root.render( <Page /> );
  } );

  act( () => {
    hear( {
      title: 'Unhandled Error',
      error: {
        name: 'Error',
        message: 'disk full',
        stack: 'Error: disk full\n    at main.js:1:1',
      },
    } );
  } );

  expect( document.getElementById( 'error-dialog-title' ).textContent ).toBe( 'Unhandled Error' );
  expect( document.body.textContent ).toContain( 'disk full' );

  act( () => {
    store.clearError();
    root.unmount();
  } );
  div.remove();
} );
