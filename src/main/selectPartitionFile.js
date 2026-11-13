import * as ipc from '../constants/ipc';

export async function selectPartitionFile( showOpenDialog ) {
  try {
    const result = await showOpenDialog( {
      title: 'Select a partition file',
      properties: ['openFile'],
    } );
    console.debug( ipc.PARTITION_FILE_SELECT, result );
    if ( result.canceled ) {
      return null;
    }
    return result.filePaths[0];
  } catch ( err ) {
    console.debug( ipc.PARTITION_FILE_SELECT, err );
    throw err;
  }
}
