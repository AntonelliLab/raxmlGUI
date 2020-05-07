import { BrowserWindow } from 'electron';

import * as ipc from '../../constants/ipc';
import { store } from '../../app/store/Config';

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
    {
      label: 'Theme',
      submenu: [
        {
          label: 'Light mode',
          type: 'radio',
          checked: !store.get('darkMode'),
          click() {
            BrowserWindow.getFocusedWindow().webContents.send(ipc.LIGHT_MODE);
          }
        },
        {
          label: 'Dark mode',
          type: 'radio',
          checked: store.get('darkMode'),
          click() {
            BrowserWindow.getFocusedWindow().webContents.send(ipc.DARK_MODE);
          }
        }
      ]
    }
  ],
};

export default subMenuFile;
