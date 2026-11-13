// @ts-nocheck — Jest globals. checkJs has no test runner types.
import * as ipc from '../constants/ipc';
import { selectPartitionFile } from './selectPartitionFile';

it( 'selectPartitionFile resolves the chosen partition path', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  let options;
  const dialogResult = {
    canceled: false,
    filePaths: ['/data/genes.part'],
  };
  const chosen = await selectPartitionFile( async ( dialogOptions ) => {
    options = dialogOptions;
    return dialogResult;
  } );
  expect( options ).toEqual( {
    title: 'Select a partition file',
    properties: ['openFile'],
  } );
  expect( chosen ).toBe( '/data/genes.part' );
  expect( debug ).toHaveBeenCalledWith( ipc.PARTITION_FILE_SELECT, dialogResult );
  debug.mockRestore();
} );

it( 'selectPartitionFile resolves null when the person cancels', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const chosen = await selectPartitionFile( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
  debug.mockRestore();
} );

it( 'selectPartitionFile rejects when the dialog fails', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const err = new Error( 'dialog failed' );
  await expect( selectPartitionFile( async () => {
    throw err;
  } ) ).rejects.toThrow( 'dialog failed' );
  expect( debug ).toHaveBeenCalledWith( ipc.PARTITION_FILE_SELECT, err );
  debug.mockRestore();
} );
