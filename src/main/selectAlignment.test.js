// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { selectAlignment } from './selectAlignment';

it( 'selectAlignment resolves the chosen alignment paths and names', async () => {
  let options;
  const chosen = await selectAlignment( async ( dialogOptions ) => {
    options = dialogOptions;
    return {
      canceled: false,
      filePaths: ['/data/primates.fasta', '/data/cats.phy'],
    };
  } );
  expect( options ).toEqual( {
    title: 'Select an alignment',
    properties: ['openFile', 'multiSelections'],
  } );
  expect( chosen ).toEqual( [
    { path: '/data/primates.fasta', name: 'primates.fasta' },
    { path: '/data/cats.phy', name: 'cats.phy' },
  ] );
} );

it( 'selectAlignment resolves null when the person cancels', async () => {
  const chosen = await selectAlignment( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
} );

it( 'selectAlignment rejects when the dialog fails', async () => {
  await expect( selectAlignment( async () => {
    throw new Error( 'dialog failed' );
  } ) ).rejects.toThrow( 'dialog failed' );
} );
