import path from 'path';
import * as ipc from '../constants/ipc';

export async function selectAlignment( showOpenDialog ) {
  try {
    const result = await showOpenDialog( {
      title: 'Select an alignment',
      properties: ['openFile', 'multiSelections'],
    } );
    console.debug( ipc.ALIGNMENT_SELECTED, result );
    if ( result.canceled ) {
      return null;
    }
    return result.filePaths.map( ( filePath ) => ( {
      path: filePath,
      name: path.basename( filePath ),
    } ) );
  } catch ( err ) {
    console.debug( ipc.ALIGNMENT_SELECTED, err );
    throw err;
  }
}
