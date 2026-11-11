// @ts-check
const path = require('path');

/** @type {import('playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: path.join(__dirname),
  testIgnore: ['docs/**'],
  // Locator checks use Playwright's 5s expect timeout. A long wait passes its own timeout.
  timeout: 15 * 60 * 1000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
};

module.exports = config;
