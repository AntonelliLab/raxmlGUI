const electron = require('electron');
const path = require('path');

const { ipcMain, dialog } = electron;

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('Got message:', arg);
  event.sender.send('asynchronous-reply', 'pong');
})
