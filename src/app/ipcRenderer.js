// Workaround from https://medium.freecodecamp.org/building-an-electron-application-with-create-react-app-97945861647c
const electron = window.require('electron');
// eslint-disable-next-line no-unused-vars
const fs = electron.remote.require('fs');
const ipcRenderer  = electron.ipcRenderer;

export default ipcRenderer;