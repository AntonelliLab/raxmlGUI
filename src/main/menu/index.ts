import {
  app,
  Menu,
  
  
  
} from 'electron';
import type {BrowserWindow, ContextMenuParams, MenuItemConstructorOptions} from 'electron';

import subMenuFile from './subMenuFile';
import subMenuAnalysis from './subMenuAnalysis';
import subMenuDeveloper from './subMenuDeveloper';
import saveScreenshot from '../utils/saveScreenshot';

const windowMenuSection = {
  role: 'window',
  submenu: [
    { role: 'minimize' },
    { role: 'close' },
    {
      label: 'Save screenshot',
      accelerator: 'CmdOrCtrl+S',
      click() {
        saveScreenshot();
      },
    },
  ],
} satisfies MenuItemConstructorOptions;

const baseMenuTemplate: MenuItemConstructorOptions[] = [
  subMenuFile,
  subMenuAnalysis,
  windowMenuSection,
];

const darwinAppMenu = {
  label: app.name,
  submenu: [
    { role: 'about' },
    { type: 'separator' },
    { role: 'services' },
    { type: 'separator' },
    { role: 'hide' },
    { role: 'hideOthers' },
    { role: 'unhide' },
    { type: 'separator' },
    { role: 'quit' },
  ],
} satisfies MenuItemConstructorOptions;

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor( mainWindow: BrowserWindow ) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    const menuTemplate: MenuItemConstructorOptions[] = [...baseMenuTemplate];

    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      menuTemplate.push( subMenuDeveloper );
      this.setupDevelopmentEnvironment();
    }

    if ( process.platform === 'darwin' ) {
      menuTemplate.unshift( darwinAppMenu );
    }

    const menu = Menu.buildFromTemplate( menuTemplate );
    Menu.setApplicationMenu( menu );

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.openDevTools();
    this.mainWindow.webContents.on(
      'context-menu',
      ( _e, props: ContextMenuParams ) => {
        const { x, y } = props;
        Menu.buildFromTemplate( [
          {
            label: 'Inspect element',
            click: () => {
              this.mainWindow.webContents.inspectElement( x, y );
            },
          },
        ] ).popup( { window: this.mainWindow } );
      },
    );
  }
}
