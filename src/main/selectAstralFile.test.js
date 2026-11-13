// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { selectAstralFile } from './selectAstralFile';

it( 'selectAstralFile resolves the chosen ASTRAL path and name', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  let options;
  const dialogResult = {
    canceled: false,
    filePaths: ['/data/trees.tre'],
  };
  const chosen = await selectAstralFile( async ( dialogOptions ) => {
    options = dialogOptions;
    return dialogResult;
  } );
  expect( options ).toEqual( {
    title: 'Select an input trees file',
    properties: ['openFile'],
  } );
  expect( chosen ).toEqual( { path: '/data/trees.tre', name: 'trees.tre' } );
  expect( debug ).toHaveBeenCalledWith( 'ASTRAL_FILE_SELECTED', dialogResult );
  debug.mockRestore();
} );

it( 'selectAstralFile resolves null when the person cancels', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const chosen = await selectAstralFile( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
  debug.mockRestore();
} );

it( 'selectAstralFile rejects when the dialog fails', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const err = new Error( 'dialog failed' );
  await expect( selectAstralFile( async () => {
    throw err;
  } ) ).rejects.toThrow( 'dialog failed' );
  expect( debug ).toHaveBeenCalledWith( 'ASTRAL_FILE_SELECTED', err );
  debug.mockRestore();
} );
