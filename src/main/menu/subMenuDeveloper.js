const subMenuDeveloper = {
  // If you see this menu in production sth is wrong
  label: 'DEVELOPER!!!',
  submenu: [
    { role: 'toggledevtools' },
    { role: 'reload' },
    { role: 'forcereload' },
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]
};

export default subMenuDeveloper;
