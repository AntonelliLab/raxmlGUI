export async function selectTree( showOpenDialog, type ) {
  const result = await showOpenDialog( {
    title: 'Select a tree file',
    properties: ['openFile'],
  } );
  if ( result.canceled ) {
    return null;
  }
  return { type, filePath: result.filePaths[0] };
}
