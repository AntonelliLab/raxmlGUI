// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { act } from 'react';

import Config from './Config';

it( 'loads dark mode from the renderer bridge', async () => {
  const getDarkMode = jest.fn( async () => true );
  const setDarkMode = jest.fn( async () => {} );
  window.rendererBridge = { getDarkMode, setDarkMode };

  const config = new Config();
  expect( config.isDarkMode ).toBe( false );
  await act( async () => {
    await getDarkMode.mock.results[0].value;
  } );
  expect( config.isDarkMode ).toBe( true );

  config.setDarkMode( false );
  expect( config.isDarkMode ).toBe( false );
  expect( setDarkMode ).toHaveBeenCalledWith( false );
} );
