// @ts-check
const { test, expect } = require('playwright/test');
const { launchApp, getAppWindow } = require('./helpers/launchApp');

test('the page reads debug info with version, OS and architecture', async () => {
  const electronApp = await launchApp();
  try {
    const page = await getAppWindow(electronApp);
    await expect(page.getByText('nucleotide', { exact: true })).toBeVisible({
      timeout: 60_000,
    });
    const host = await electronApp.evaluate(({ app }) => ({
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
    }));

    const info = await page.evaluate(() => window.rendererBridge.debugInfo());

    expect(info).toContain(` ${host.version}\n`);
    expect(info).toContain(`\n${host.platform} ${host.arch} `);
  } finally {
    await electronApp.close();
  }
});
