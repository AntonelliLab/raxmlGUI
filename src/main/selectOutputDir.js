import * as ipc from '../constants/ipc';

export async function selectOutputDir( showOpenDialog ) {
  try {
    const result = await showOpenDialog( {
      title: 'Select a directory for RAxML output',
      properties: ['openFile', 'openDirectory'],
    } );
    console.debug( ipc.OUTPUT_DIR_SELECT, result );
    if ( result.canceled ) {
      return null;
    }
    return result.filePaths[0];
  } catch ( err ) {
    console.debug( ipc.OUTPUT_DIR_SELECT, err );
    throw err;
  }
}
