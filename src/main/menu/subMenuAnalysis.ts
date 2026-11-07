import type { MenuItemConstructorOptions } from 'electron';

import * as ipc from '../../constants/ipc';
import { activeWindow } from '../utils/utils';

const sendToFocusedWindow = ( channel: string ) => {
  const win = activeWindow();
  if ( !win ) {
    return;
  }
  win.webContents.send( channel );
};

const subMenuAnalysis = {
  label: 'Analysis',
  submenu: [
    {
      label: 'Enforce constraint...',
      submenu: [
        {
          label: 'Use backbone constraint',
          type: 'checkbox',
          checked: false,
          click() {
            sendToFocusedWindow( ipc.TOGGLE_BACKBONE_CONSTRAINT );
          },
        },
        {
          label: 'Use multifurcating constraint',
          type: 'checkbox',
          checked: false,
          click() {
            sendToFocusedWindow( ipc.TOGGLE_MULTIFURCATING_CONSTRAINT );
          },
        },
      ],
    },
  ],
} satisfies MenuItemConstructorOptions;

export default subMenuAnalysis;
