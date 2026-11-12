// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { selectAstralFile } from './selectAstralFile';

it( 'selectAstralFile resolves the chosen ASTRAL path and name', async () => {
  let options;
  const chosen = await selectAstralFile( async ( dialogOptions ) => {
    options = dialogOptions;
    return {
      canceled: false,
      filePaths: ['/data/trees.tre'],
    };
  } );
  expect( options ).toEqual( {
    title: 'Select an input trees file',
    properties: ['openFile'],
  } );
  expect( chosen ).toEqual( { path: '/data/trees.tre', name: 'trees.tre' } );
} );

it( 'selectAstralFile resolves null when the person cancels', async () => {
  const chosen = await selectAstralFile( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
} );

it( 'selectAstralFile rejects when the dialog fails', async () => {
  await expect( selectAstralFile( async () => {
    throw new Error( 'dialog failed' );
  } ) ).rejects.toThrow( 'dialog failed' );
} );
