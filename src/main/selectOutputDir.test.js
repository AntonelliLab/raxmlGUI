// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { selectOutputDir } from './selectOutputDir';

it( 'selectOutputDir resolves the chosen output directory', async () => {
  let options;
  const chosen = await selectOutputDir( async ( dialogOptions ) => {
    options = dialogOptions;
    return {
      canceled: false,
      filePaths: ['/data/results'],
    };
  } );
  expect( options ).toEqual( {
    title: 'Select a directory for RAxML output',
    properties: ['openFile', 'openDirectory'],
  } );
  expect( chosen ).toBe( '/data/results' );
} );

it( 'selectOutputDir resolves null when the person cancels', async () => {
  const chosen = await selectOutputDir( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
} );

it( 'selectOutputDir rejects when the dialog fails', async () => {
  await expect( selectOutputDir( async () => {
    throw new Error( 'dialog failed' );
  } ) ).rejects.toThrow( 'dialog failed' );
} );
