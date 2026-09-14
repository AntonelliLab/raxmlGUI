// @ts-check
const path = require('path');

/** @type {import('playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: path.join(__dirname),
  timeout: 15 * 60 * 1000,
  expect: {
    timeout: 10 * 60 * 1000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'yarn react-start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    cwd: path.join(__dirname, '..'),
  },
};

module.exports = config;
