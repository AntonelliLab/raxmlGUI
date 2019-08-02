window.ipcRenderer = require('electron').ipcRenderer;

if (process.env.NODE_ENV === 'development') {
  window.__devtron = { require: require, process: process };
}
