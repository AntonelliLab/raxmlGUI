import path from 'path';

export async function selectAstralFile( showOpenDialog ) {
  const result = await showOpenDialog( {
    title: 'Select an input trees file',
    properties: ['openFile'],
  } );
  if ( result.canceled ) {
    return null;
  }
  const filePath = result.filePaths[0];
  return {
    path: filePath,
    name: path.basename( filePath ),
  };
}
