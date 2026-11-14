import { dialog } from 'electron';
import fs from 'fs';
import util from 'util';
import { activeWindow } from './utils';

const writeFile = util.promisify( fs.writeFile );

const saveScreenshot = async (): Promise<void> => {
  console.log( 'Save screenshot...' );
  const win = activeWindow();
  if ( !win ) {
    console.log( 'No focused window for screenshot' );
    return;
  }
  const img = await win.webContents.capturePage();
  try {
    const file = await dialog.showSaveDialog( {
      title: 'Select the File Path to save',
      buttonLabel: 'Save',
      // Restricting the user to only Image Files.
      filters: [
        {
          name: 'Image Files',
          extensions: ['png', 'jpeg', 'jpg'],
        },
      ],
      properties: [],
    } );
    if ( !file.canceled && file.filePath ) {
      console.log( `Save screenshot to '${file.filePath}'...` );
      // Creating and Writing to the image.png file
      // Can save the File as a jpeg file as well,
      // by simply using img.toJPEG(100);
      await writeFile( file.filePath, img.toPNG(), 'base64' );
      console.log( 'Saved!' );
    }
  }
  catch ( err: unknown ) {
    console.log( err );
  }
};

export default saveScreenshot;
