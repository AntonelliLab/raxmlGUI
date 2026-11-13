// @ts-nocheck — Jest globals. checkJs has no test runner types.
import * as ipc from '../constants/ipc';
import { selectTree } from './selectTree';

it( 'selectTree resolves the chosen tree or constraint', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const cases = [
    ['tree', '/data/start.nwk'],
    ['backboneConstraint', '/data/backbone.nwk'],
    ['multifurcatingConstraint', '/data/multi.nwk'],
  ];
  for ( const [type, filePath] of cases ) {
    let options;
    const dialogResult = {
      canceled: false,
      filePaths: [filePath],
    };
    const chosen = await selectTree( async ( dialogOptions ) => {
      options = dialogOptions;
      return dialogResult;
    }, type );
    expect( options ).toEqual( {
      title: 'Select a tree file',
      properties: ['openFile'],
    } );
    expect( chosen ).toEqual( { type, filePath } );
    expect( debug ).toHaveBeenCalledWith( ipc.TREE_SELECT, dialogResult );
  }
  debug.mockRestore();
} );

it( 'selectTree resolves null when the person cancels', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const chosen = await selectTree( async () => ( {
    canceled: true,
    filePaths: [],
  } ), 'tree' );
  expect( chosen ).toBeNull();
  debug.mockRestore();
} );

it( 'selectTree rejects when the dialog fails', async () => {
  const debug = jest.spyOn( console, 'debug' ).mockImplementation( () => {} );
  const err = new Error( 'dialog failed' );
  await expect( selectTree( async () => {
    throw err;
  }, 'tree' ) ).rejects.toThrow( 'dialog failed' );
  expect( debug ).toHaveBeenCalledWith( ipc.TREE_SELECT, err );
  debug.mockRestore();
} );
