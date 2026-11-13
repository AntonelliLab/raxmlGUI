import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Page from './index';

it( 'renders without crashing', () => {
  const div = document.createElement( 'div' );
  const root = createRoot( div );
  // createRoot().render paints on a later tick. act flushes that paint.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act( () => {
    root.render( <Page /> );
  } );
  expect( div.innerHTML ).not.toBe( '' );
} );
