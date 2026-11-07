import type { MenuItemConstructorOptions } from 'electron';

import * as ipc from '../../constants/ipc';
import { store } from '../../app/store/Config';
import { activeWindow } from '../utils/utils';

const sendToFocusedWindow = (channel: string) => {
  const win = activeWindow();
  if (!win) {
    return;
  }
  win.webContents.send(channel);
};

const subMenuFile = {
  label: 'File',
  submenu: [
    {
      label: 'New Tab',
      accelerator: 'CmdOrCtrl+T',
      click() {
        sendToFocusedWindow(ipc.ADD_RUN);
      },
    },
    {
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click() {
        sendToFocusedWindow(ipc.REMOVE_RUN);
      },
    },
    {
      label: 'Theme',
      submenu: [
        {
          label: 'Light mode',
          type: 'radio',
          checked: !store.get('darkMode'),
          click() {
            sendToFocusedWindow(ipc.LIGHT_MODE);
          },
        },
        {
          label: 'Dark mode',
          type: 'radio',
          checked: Boolean(store.get('darkMode')),
          click() {
            sendToFocusedWindow(ipc.DARK_MODE);
          },
        },
      ],
    },
  ],
} satisfies MenuItemConstructorOptions;

export default subMenuFile;
