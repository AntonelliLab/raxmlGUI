import path from 'path';
import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';

type ShowOpenDialog = (
  options: OpenDialogOptions,
) => Promise<OpenDialogReturnValue>;

interface SelectedAlignment {
  path: string;
  name: string;
}

export async function selectAlignment(
  showOpenDialog: ShowOpenDialog,
): Promise<SelectedAlignment[] | null> {
  try {
    const result = await showOpenDialog( {
      title: 'Select an alignment',
      properties: ['openFile', 'multiSelections'],
    } );
    console.debug( 'ALIGNMENT_SELECTED', result );
    if ( result.canceled ) {
      return null;
    }
    return result.filePaths.map( ( filePath ) => ( {
      path: filePath,
      name: path.basename( filePath ),
    } ) );
  } catch ( err: unknown ) {
    console.debug( 'ALIGNMENT_SELECTED', err );
    throw err;
  }
}
