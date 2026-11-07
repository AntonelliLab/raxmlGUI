const subMenuDeveloper = {
  // If you see this menu in production sth is wrong
  label: 'DEVELOPER!!!',
  submenu: [
    {
      label: 'Force Error',
      click() {
        throw new Error('Testing Error');
      },
    },
    { type: 'separator' },
    { role: 'toggleDevTools' },
    { role: 'reload' },
    { role: 'forceReload' },
    { type: 'separator' },
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' },
  ],
};
export default subMenuDeveloper;
