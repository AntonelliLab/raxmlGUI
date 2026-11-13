import * as ipc from '../constants/ipc';

export async function selectTree( showOpenDialog, type ) {
  try {
    const result = await showOpenDialog( {
      title: 'Select a tree file',
      properties: ['openFile'],
    } );
    console.debug( ipc.TREE_SELECT, result );
    if ( result.canceled ) {
      return null;
    }
    return { type, filePath: result.filePaths[0] };
  } catch ( err ) {
    console.debug( ipc.TREE_SELECT, err );
    throw err;
  }
}
