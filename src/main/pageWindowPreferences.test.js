// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { pageWindowPreferences } from './pageWindowPreferences';

it( 'every window runs with Node shut out, isolation on, and the sandbox on', () => {
  expect( pageWindowPreferences( { preloadPath: '/preload.js' } ) ).toEqual( {
    backgroundThrottling: false,
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: '/preload.js',
    allowEval: false,
  } );
  expect( pageWindowPreferences() ).not.toHaveProperty( 'enableRemoteModule' );
  expect( pageWindowPreferences() ).not.toHaveProperty( 'preload' );
} );
