import { BrowserWindow } from 'electron';

import * as ipc from '../../constants/ipc';

const subMenuFile = {
  label: 'File',
  submenu: [
    {
      label: 'New Tab',
      accelerator: 'CmdOrCtrl+T',
      click() {
        BrowserWindow.getFocusedWindow().webContents.send(ipc.ADD_RUN);
      }
    },
    {
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click() {
        BrowserWindow.getFocusedWindow().webContents.send(ipc.REMOVE_RUN);
      }
    },
  ],
};

export default subMenuFile;
