// @ts-check
const path = require('path');

const docsRoot = path.join(__dirname, '..', '..', 'docs');
const baseUrl = 'http://127.0.0.1:4000/raxmlGUI/';

/** @type {import('playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: __dirname,
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: baseUrl,
    browserName: 'chromium',
  },
  webServer: {
    command:
      'bundle exec jekyll serve --config _config.yml,_config_dev.yml --host 127.0.0.1 --port 4000 --no-watch',
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    cwd: docsRoot,
    env: {
      ...process.env,
      PAGES_REPO_NWO: process.env.PAGES_REPO_NWO || 'AntonelliLab/raxmlGUI',
    },
    wait: {
      stdout: /Server running/i,
    },
  },
};

module.exports = config;
