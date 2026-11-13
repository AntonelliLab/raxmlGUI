import path from 'path';

export async function selectAstralFile( showOpenDialog ) {
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
  } catch ( err ) {
    console.debug( 'ASTRAL_FILE_SELECTED', err );
    throw err;
  }
}
