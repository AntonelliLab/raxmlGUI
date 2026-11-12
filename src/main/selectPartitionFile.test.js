// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { selectPartitionFile } from './selectPartitionFile';

it( 'selectPartitionFile resolves the chosen partition path', async () => {
  let options;
  const chosen = await selectPartitionFile( async ( dialogOptions ) => {
    options = dialogOptions;
    return {
      canceled: false,
      filePaths: ['/data/genes.part'],
    };
  } );
  expect( options ).toEqual( {
    title: 'Select a partition file',
    properties: ['openFile'],
  } );
  expect( chosen ).toBe( '/data/genes.part' );
} );

it( 'selectPartitionFile resolves null when the person cancels', async () => {
  const chosen = await selectPartitionFile( async () => ( {
    canceled: true,
    filePaths: [],
  } ) );
  expect( chosen ).toBeNull();
} );

it( 'selectPartitionFile rejects when the dialog fails', async () => {
  await expect( selectPartitionFile( async () => {
    throw new Error( 'dialog failed' );
  } ) ).rejects.toThrow( 'dialog failed' );
} );
