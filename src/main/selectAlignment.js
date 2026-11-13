import path from 'path';

export async function selectAlignment( showOpenDialog ) {
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
  } catch ( err ) {
    console.debug( 'ALIGNMENT_SELECTED', err );
    throw err;
  }
}
