export async function selectOutputDir( showOpenDialog ) {
  const result = await showOpenDialog( {
    title: 'Select a directory for RAxML output',
    properties: ['openFile', 'openDirectory'],
  } );
  if ( result.canceled ) {
    return null;
  }
  return result.filePaths[0];
}
