// import { ipcRenderer } from 'electron';
// export default ipcRenderer;

// Above doesn't work when webpack target is browser, should be electron-renderer
// TODO: Fix issues using target electron-renderer (https://medium.com/@andrew.rapo/using-create-react-app-craco-to-build-apps-for-both-the-web-and-electron-8f4ab827877f)
// Exposed to window from preload script instead
export default window.ipcRenderer;
