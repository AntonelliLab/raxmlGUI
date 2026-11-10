const path = require('path');
const { _electron: electron } = require('playwright/test');

const repoRoot = path.join(__dirname, '..', '..');
const mainEntry = path.join(repoRoot, 'out', 'main', 'index.js');

/**
 * Launch the built shell. No dev server and no page URL override.
 * @returns {Promise<import('playwright/test').ElectronApplication>}
 */
async function launchApp() {
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    RAXMLGUI_E2E: '1',
  };
  delete env.ELECTRON_START_URL;
  delete env.ELECTRON_RENDERER_URL;

  return electron.launch({
    args: [mainEntry],
    env,
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
      if (url.includes('out/renderer/index.html')) {
        return window;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Could not find the built raxmlGUI page');
}

module.exports = {
  launchApp,
  getAppWindow,
  repoRoot,
};
