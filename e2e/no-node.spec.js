// @ts-check
const { test, expect } = require('playwright/test');
const { launchApp, getAppWindow } = require('./helpers/launchApp');

test.describe('Node shut out', () => {
  /** @type {import('playwright/test').ElectronApplication | undefined} */
  let electronApp;

  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
      electronApp = undefined;
    }
  });

  test('the built page has no Node', async () => {
    electronApp = await launchApp();
    const page = await getAppWindow(electronApp);

    await expect(page.getByText('nucleotide', { exact: true })).toBeVisible({
      timeout: 60_000,
    });

    const probe = await page.evaluate(() => ({
      require: typeof require,
      processVersions:
        typeof process !== 'undefined' && process && process.versions
          ? process.versions
          : null,
      bridgeRequire: typeof window.require,
      bridgeProcess: typeof window.process,
    }));

    expect(probe.require).toBe('undefined');
    expect(probe.bridgeRequire).toBe('undefined');
    expect(probe.bridgeProcess).toBe('undefined');
    expect(probe.processVersions && probe.processVersions.node).toBeFalsy();
  });
});
