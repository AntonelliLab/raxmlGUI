import path from 'path';
import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';

type ShowOpenDialog = (
  options: OpenDialogOptions,
) => Promise<OpenDialogReturnValue>;

interface SelectedAstralFile {
  path: string;
  name: string;
}

export async function selectAstralFile(
  showOpenDialog: ShowOpenDialog,
): Promise<SelectedAstralFile | null> {
  try {
    const result = await showOpenDialog( {
      title: 'Select an input trees file',
      properties: ['openFile'],
    } );
    console.debug( 'ASTRAL_FILE_SELECTED', result );
    if ( result.canceled ) {
      return null;
    }
    const filePath = result.filePaths[0];
    return {
      path: filePath,
      name: path.basename( filePath ),
    };
  } catch ( err: unknown ) {
    console.debug( 'ASTRAL_FILE_SELECTED', err );
    throw err;
  }
}
