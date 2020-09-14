import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import util from 'util';
const writeFile = util.promisify(fs.writeFile);

const saveScreenshot = async () => {
  console.log('Save screenshot...');
  const win = BrowserWindow.getFocusedWindow();
  const img = await win.webContents.capturePage()
  try {
    const file = await dialog.showSaveDialog({
      title: "Select the File Path to save",
      buttonLabel: "Save",
      // Restricting the user to only Image Files.
      filters: [
          {
              name: "Image Files",
              extensions: ["png", "jpeg", "jpg"],
          },
      ],
      properties: [],
    });

    if (!file.canceled) {
        console.log(`Save screenshot to '${file.filePath}'...`);
        // Creating and Writing to the image.png file
        // Can save the File as a jpeg file as well,
        // by simply using img.toJPEG(100);
        await writeFile(file.filePath.toString(), img.toPNG(), "base64");
        console.log('Saved!');
    }
  }
  catch (err) {
    console.log(err);
  }
}

export default saveScreenshot;
