// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { selectTree } from './selectTree';

it( 'selectTree resolves the chosen tree or constraint', async () => {
  const cases = [
    ['tree', '/data/start.nwk'],
    ['backboneConstraint', '/data/backbone.nwk'],
    ['multifurcatingConstraint', '/data/multi.nwk'],
  ];
  for ( const [type, filePath] of cases ) {
    let options;
    const chosen = await selectTree( async ( dialogOptions ) => {
      options = dialogOptions;
      return {
        canceled: false,
        filePaths: [filePath],
      };
    }, type );
    expect( options ).toEqual( {
      title: 'Select a tree file',
      properties: ['openFile'],
    } );
    expect( chosen ).toEqual( { type, filePath } );
  }
} );

it( 'selectTree resolves null when the person cancels', async () => {
  const chosen = await selectTree( async () => ( {
    canceled: true,
    filePaths: [],
  } ), 'tree' );
  expect( chosen ).toBeNull();
} );

it( 'selectTree rejects when the dialog fails', async () => {
  await expect( selectTree( async () => {
    throw new Error( 'dialog failed' );
  }, 'tree' ) ).rejects.toThrow( 'dialog failed' );
} );
