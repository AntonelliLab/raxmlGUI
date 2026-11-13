// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { debugInfo } from './debugInfo';

it( 'debugInfo includes the app name and version, the Electron version, the platform, the OS release, and the locale', () => {
  expect( debugInfo( {
    name: 'raxmlGUI',
    version: '2.0.18',
    electron: '45.2.3',
    platform: 'darwin',
    release: '25.6.0',
    locale: 'en-US',
  } ) ).toBe( `raxmlGUI 2.0.18
Electron 45.2.3
darwin 25.6.0
Locale: en-US` );
} );
