import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import * as ipc from '../constants/ipc';

type ShowOpenDialog = (
  options: OpenDialogOptions,
) => Promise<OpenDialogReturnValue>;

export async function selectPartitionFile(
  showOpenDialog: ShowOpenDialog,
): Promise<string | null> {
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
  } catch ( err: unknown ) {
    console.debug( ipc.PARTITION_FILE_SELECT, err );
    throw err;
  }
}
