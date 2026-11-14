import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import * as ipc from '../constants/ipc';

type ShowOpenDialog = (
  options: OpenDialogOptions,
) => Promise<OpenDialogReturnValue>;

interface SelectedTree {
  type: string;
  filePath: string;
}

export async function selectTree(
  showOpenDialog: ShowOpenDialog,
  type: string,
): Promise<SelectedTree | null> {
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
  } catch ( err: unknown ) {
    console.debug( ipc.TREE_SELECT, err );
    throw err;
  }
}
