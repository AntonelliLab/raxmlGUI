export async function selectPartitionFile( showOpenDialog ) {
  const result = await showOpenDialog( {
    title: 'Select a partition file',
    properties: ['openFile'],
  } );
  if ( result.canceled ) {
    return null;
  }
  return result.filePaths[0];
}
