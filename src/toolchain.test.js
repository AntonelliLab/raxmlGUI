// @ts-nocheck — Jest globals. checkJs has no test runner types.
import fs from 'fs';
import path from 'path';

const pkg = require( '../package.json' );
const root = path.join( __dirname, '..' );

const goneScripts = [
  'react-start',
  'react-build',
  'react-eject',
  'electron-dev',
  'electron-start',
  'wait-dev',
  'electron-compile',
  'electron-copy',
  'compile',
];

const gonePackages = [
  '@craco/craco',
  'react-scripts',
  'electron-webpack',
  '@sentry/webpack-plugin',
  'cross-env',
  'shx',
  'wait-on',
];

it( 'drops the Create React App and electron-webpack toolchain', () => {
  goneScripts.forEach( ( name ) => {
    expect( pkg.scripts[ name ] ).toBeUndefined();
  } );
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };
  gonePackages.forEach( ( name ) => {
    expect( declared[ name ] ).toBeUndefined();
  } );
  expect( pkg.electronWebpack ).toBeUndefined();
  [
    'craco.config.js',
    'webpack.config.js',
    'patches/electron-webpack+2.8.2.patch',
    'scripts/hooks/pre-commit',
  ].forEach( ( file ) => {
    expect( fs.existsSync( path.join( root, file ) ) ).toBe( false );
  } );
} );
