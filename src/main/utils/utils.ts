import electron from 'electron';

export const activeWindow = () => electron.BrowserWindow.getFocusedWindow();
