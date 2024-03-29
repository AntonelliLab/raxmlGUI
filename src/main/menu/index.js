import { app, Menu } from 'electron';

import subMenuFile from './subMenuFile';
import subMenuAnalysis from './subMenuAnalysis';
import subMenuDeveloper from './subMenuDeveloper';
import saveScreenshot from '../utils/saveScreenshot';

const menuTemplate = [
  subMenuFile,
  subMenuAnalysis,
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' },
      {
        label: 'Save screenshot',
        accelerator: 'CmdOrCtrl+S',
        click() {
          saveScreenshot();
        }
      },
    ]
  },
];

export default class MenuBuilder {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      menuTemplate.push(subMenuDeveloper);
      this.setupDevelopmentEnvironment();
    }

    if (process.platform === 'darwin') {
      menuTemplate.unshift({
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;
      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }
}
