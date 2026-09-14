const path = require('path');
const { _electron: electron } = require('playwright/test');

const repoRoot = path.join(__dirname, '..', '..');
const mainEntry = path.join(repoRoot, 'dist', 'main', 'main.js');

/**
 * Launch the raxmlGUI Electron app against the CRA dev server.
 * @returns {Promise<import('playwright/test').ElectronApplication>}
 */
async function launchApp() {
  return electron.launch({
    args: [mainEntry],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_START_URL: 'http://localhost:3000/',
      RAXMLGUI_E2E: '1',
    },
    cwd: repoRoot,
  });
}

/**
 * Return the renderer window (not DevTools).
 * @param {import('playwright/test').ElectronApplication} electronApp
 */
async function getAppWindow(electronApp) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    for (const window of electronApp.windows()) {
      const url = window.url();
      if (url.includes('localhost:3000')) {
        return window;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Could not find raxmlGUI renderer window on localhost:3000');
}

module.exports = {
  launchApp,
  getAppWindow,
  repoRoot,
};
