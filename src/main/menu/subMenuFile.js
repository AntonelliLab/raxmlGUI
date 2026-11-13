import * as ipc from '../../constants/ipc';
import { appStore } from '../appStore';
import { activeWindow } from '../utils/utils';
// The page's store class is decorated. This build does not compile decorators.
const sendToFocusedWindow = ( channel ) => {
  const win = activeWindow();
  if ( !win ) {
    return;
  }
  win.webContents.send( channel );
};
const subMenuFile = {
  label: 'File',
  submenu: [
    {
      label: 'New Tab',
      accelerator: 'CmdOrCtrl+T',
      click() {
        sendToFocusedWindow( ipc.ADD_RUN );
      },
    },
    {
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click() {
        sendToFocusedWindow( ipc.REMOVE_RUN );
      },
    },
    {
      label: 'Theme',
      submenu: [
        {
          label: 'Light mode',
          type: 'radio',
          checked: !appStore.get( 'darkMode' ),
          click() {
            appStore.set( 'darkMode', false );
            sendToFocusedWindow( ipc.LIGHT_MODE );
          },
        },
        {
          label: 'Dark mode',
          type: 'radio',
          checked: Boolean( appStore.get( 'darkMode' ) ),
          click() {
            appStore.set( 'darkMode', true );
            sendToFocusedWindow( ipc.DARK_MODE );
          },
        },
      ],
    },
  ],
};
export default subMenuFile;
