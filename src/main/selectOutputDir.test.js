// @ts-nocheck — Jest globals. checkJs has no test runner types.
import * as ipc from '../constants/ipc';
import { selectOutputDir } from './selectOutputDir';

it( 'selectOutputDir resolves the chosen output directory', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  let options;
  const dialogResult = {
    canceled: false,
    filePaths: ['/data/results'],
  };
  const chosen = await selectOutputDir( async ( dialogOptions ) => {
    options = dialogOptions;
    return dialogResult;
  } );
  expect( options ).toEqual( {
    title: 'Select a directory for RAxML output',
    properties: ['openFile', 'openDirectory'],
  } );
  expect( chosen ).toBe( '/data/results' );
  expect( debug ).toHaveBeenCalledWith( ipc.OUTPUT_DIR_SELECT, dialogResult );
  debug.mockRestore();
} );

it( 'selectOutputDir resolves null when the person cancels', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const chosen = await selectOutputDir( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
  debug.mockRestore();
} );

it( 'selectOutputDir rejects when the dialog fails', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const err = new Error( 'dialog failed' );
  await expect( selectOutputDir( async () => {
    throw err;
  } ) ).rejects.toThrow( 'dialog failed' );
  expect( debug ).toHaveBeenCalledWith( ipc.OUTPUT_DIR_SELECT, err );
  debug.mockRestore();
} );
