import { BrowserWindow } from 'electron';

export const sendToMainWindow = (tag, payload) => {
  if (tag.indexOf(':') !== -1) {
    throw new Error(`Old api string ${tag}`);
  }
  BrowserWindow.getAllWindows()[0].webContents.send(tag, payload);
}

export const logInMainWindow = (tag, payload) => {
  BrowserWindow.getAllWindows()[0].execute(
    `console.log('${tag}, ${JSON.stringify(payload)}');`
  );
}
