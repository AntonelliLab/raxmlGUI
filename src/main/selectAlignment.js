import path from 'path';

export async function selectAlignment( showOpenDialog ) {
  const result = await showOpenDialog( {
    title: 'Select an alignment',
    properties: ['openFile', 'multiSelections'],
  } );
  if ( result.canceled ) {
    return null;
  }
  return result.filePaths.map( ( filePath ) => ( {
    path: filePath,
    name: path.basename( filePath ),
  } ) );
}
