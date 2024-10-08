import electron from 'electron';
import path from 'path';
import url from 'url';
import log from 'electron-log/main';
import { autoUpdater } from 'electron-updater';
import ProgressBar from 'electron-progressbar';

import './api';
import MenuBuilder from './menu';
import { is } from '../common/utils';

// It preloads electron-log IPC code in renderer processes
log.initialize();

// TODO: Have removed electron-debug dependency, because it used remote module. Maybe we need some alternative.

//-------------------------------------------------------------------
// From https://github.com/iffy/electron-updater-example/blob/master/main.js
// Logging
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
// Fixes this error: https://github.com/electron-userland/electron-builder/issues/5717
autoUpdater.autoInstallOnAppQuit = false;
log.info('App starting...');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// Module to show dialogs
const dialog = electron.dialog;

// This is the dev mode definition from Daniel's initial version of the repository,
// without explanation where the --noDevServer comes from
// TODO: add an explanation
const isDevMode = is.development && process.argv.indexOf('--noDevServer') === -1;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let progressBar;

autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Found Updates',
      message:
        'An update for RAxML-GUI is available, do you want to update now and restart?',
      buttons: ['Yes', 'No'],
      cancelId: 1,
    })
    .then((r) => {
      // Button index
      if (r.response === 0) {
        progressBar = new ProgressBar({
          text: 'Downloading the update for the app',
          browserWindow: {
            webPreferences: {
              nodeIntegration: true,
            },
          },
        });
        progressBar
          .on('completed', function () {
            console.info(`completed...`);
            progressBar.detail = 'Download completed. Exiting...';
          })
          .on('aborted', function () {
            console.info(`aborted...`);
          });
        autoUpdater.downloadUpdate();
      }
    });
  log.info('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});
autoUpdater.on('error', (error) => {
  log.info('Error in auto-updater. ' + error);
  dialog.showErrorBox(
    'Error: ',
    error == null ? 'unknown' : (error.stack || error).toString()
  );
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message =
    log_message +
    ' (' +
    progressObj.transferred +
    '/' +
    progressObj.total +
    ')';
  log.info(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  progressBar.setCompleted();
  dialog
    .showMessageBox({
      title: 'Install Updates',
      message: 'Updates downloaded, the application will now quit to update...',
    })
    .then(() => {
      setImmediate(() => autoUpdater.quitAndInstall());
    });
  log.info('Update downloaded');
});

/**
 * Add event listeners...
 */
function initialize() {
  // Make this a single instance app
  const shouldQuit = makeSingleInstance();
  if (shouldQuit) return app.quit();

  function createMainWindow() {
    // Window options for the main window
    const mainWindowOptions = {
      width: 1280,
      minWidth: 960,
      height: 790,
      title: app.name,
      backgroundColor: '#333',
      resizable: true,
      webPreferences: {
        backgroundThrottling: false,
        // nodeIntegration: isDevMode,
        nodeIntegration: true,
        contextIsolation: false, // Needed to expose ipcRenderer from preload script
        // preload: path.join(app.getAppPath(), 'src', 'main', 'preload.js'),
        enableRemoteModule: true,
        allowEval: false,
      },
    };

    if (process.platform === 'linux') {
      // Set a window icon for linux
      mainWindowOptions.icon = path.join(__dirname, '/public/favicon.ico');
    }

    // Create the browser window.
    mainWindow = new BrowserWindow(mainWindowOptions);

    // and load the index.html of the app.
    const startUrl =
      process.env.ELECTRON_START_URL ||
      url.format({
        // pathname: path.join(__dirname, '..', 'build', 'index.html'),
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
      });
    mainWindow.loadURL(startUrl);

    // Open the DevTools.
    // TODO: make conditional as in app.ready
    if (isDevMode) {
      mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });

    // TODO: Use 'ready-to-show' event
    // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.on('did-finish-load', () => {
      if (!mainWindow) {
        throw new Error('The main window is not defined');
      }
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    // Set the main window menu
    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    // new AppUpdater();
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', async () => {
    // if (isDevMode) {
    //   await installExtensions();
    // }
    createMainWindow();

    autoUpdater.autoDownload = false;
    autoUpdater.checkForUpdates();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createMainWindow();
    }
  });
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance() {
  if (process.mas) return false;

  app.requestSingleInstanceLock();

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
  case '--squirrel-install':
  case '--squirrel-uninstall':
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit();
    break;
  default:
    initialize();
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
