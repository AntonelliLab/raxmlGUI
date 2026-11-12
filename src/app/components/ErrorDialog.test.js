// @ts-nocheck — Jest globals. checkJs has no test runner types.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorDialog from './ErrorDialog';

it( 'the reload action reloads the window', () => {
  const reload = jest.fn();
  window.rendererBridge = { reload };
  const div = document.createElement( 'div' );
  document.body.appendChild( div );
  const root = createRoot( div );
  // createRoot().render paints on a later tick. act flushes that paint.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act( () => {
    root.render(
      <ErrorDialog
        error={new Error( 'boom' )}
        onClose={() => {}}
        needReload
      />,
    );
  } );

  const button = [...document.body.querySelectorAll( 'button' )]
    .find( ( item ) => item.textContent === 'Ignore and reload' );
  act( () => {
    button.click();
  } );

  expect( reload ).toHaveBeenCalledTimes( 1 );

  act( () => {
    root.unmount();
  } );
  div.remove();
} );
