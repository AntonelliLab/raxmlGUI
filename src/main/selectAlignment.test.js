// @ts-nocheck — Jest globals. checkJs has no test runner types.
import * as ipc from '../constants/ipc';
import { selectAlignment } from './selectAlignment';

it( 'selectAlignment resolves the chosen alignment paths and names', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  let options;
  const dialogResult = {
    canceled: false,
    filePaths: ['/data/primates.fasta', '/data/cats.phy'],
  };
  const chosen = await selectAlignment( async ( dialogOptions ) => {
    options = dialogOptions;
    return dialogResult;
  } );
  expect( options ).toEqual( {
    title: 'Select an alignment',
    properties: ['openFile', 'multiSelections'],
  } );
  expect( chosen ).toEqual( [
    { path: '/data/primates.fasta', name: 'primates.fasta' },
    { path: '/data/cats.phy', name: 'cats.phy' },
  ] );
  expect( debug ).toHaveBeenCalledWith( ipc.ALIGNMENT_SELECTED, dialogResult );
  debug.mockRestore();
} );

it( 'selectAlignment resolves null when the person cancels', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const chosen = await selectAlignment( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
  debug.mockRestore();
} );

it( 'selectAlignment rejects when the dialog fails', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const err = new Error( 'dialog failed' );
  await expect( selectAlignment( async () => {
    throw err;
  } ) ).rejects.toThrow( 'dialog failed' );
  expect( debug ).toHaveBeenCalledWith( ipc.ALIGNMENT_SELECTED, err );
  debug.mockRestore();
} );
