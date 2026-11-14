import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import * as ipc from '../constants/ipc';

type ShowOpenDialog = (
  options: OpenDialogOptions,
) => Promise<OpenDialogReturnValue>;

export async function selectOutputDir(
  showOpenDialog: ShowOpenDialog,
): Promise<string | null> {
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
  } catch ( err: unknown ) {
    console.debug( ipc.OUTPUT_DIR_SELECT, err );
    throw err;
  }
}
