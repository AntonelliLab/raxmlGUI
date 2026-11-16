// @ts-check
const fs = require('fs/promises');
const path = require('path');
const { test, expect } = require('playwright/test');
const { launchApp, getAppWindow, repoRoot } = require('./helpers/launchApp');
const { cleanupOutputFiles } = require('./helpers/cleanupOutput');
const { waitForOutputFile } = require('./helpers/waitForOutput');
const { parseModelTestLog } = require('./helpers/modeltestOutcome');
const { checkFixture } = require('./helpers/fixtures');

const outputDir = path.join(repoRoot, 'static', 'test-results');
const modelTestOutput = path.join(outputDir, 'RAxML_GUI_ModelTest_nucleotide');

// Same choice as src/app/store/Run.js
const binary =
  process.platform === 'win32'
    ? 'modeltest-ng.exe'
    : process.platform === 'darwin' && process.arch === 'arm64'
      ? 'modeltest-ng-ARM64'
      : 'modeltest-ng';

// seed is ModelTest-NG's default; the GUI passes none
const settings = {
  seed: 12345,
  runs: 1,
  analysis: 'modeltest',
  criterion: 'AICc',
  binary,
  binaryVersions: { 'modeltest-ng': '0.1.7' },
};

test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('ModelTest outcome', () => {
  /** @type {import('playwright/test').ElectronApplication} */
  let electronApp;
  const outputId = `e2e_modeltest_${Date.now()}`;

  test.beforeAll(async () => {
    electronApp = await launchApp();
  });

  test.afterAll(async () => {
    await electronApp?.close();
    await cleanupOutputFiles(outputDir, outputId);
  });

  test('AICc on nucleotide.txt matches the host fixture', async () => {
    const page = await getAppWindow(electronApp);
    await expect(page.getByText('nucleotide', { exact: true })).toBeVisible({
      timeout: 60_000,
    });
    await cleanupOutputFiles(outputDir, outputId);
    await page.locator('#output-name').fill(outputId);

    await page.getByTestId('run-modeltest').click();
    await expect(page.getByTestId('console-output')).toContainText(
      '> raxml-ng',
      { timeout: 4 * 60 * 1000 },
    );
    await expect(page.locator('#error-dialog-title')).toHaveCount(0);

    for (const ext of ['out', 'log', 'tree']) {
      await waitForOutputFile(`${modelTestOutput}.${ext}`, { timeout: 30_000 });
    }

    const actual = parseModelTestLog(
      await fs.readFile(`${modelTestOutput}.out`, 'utf8'),
    );
    const { ok, message } = checkFixture('modeltest', settings, actual);
    expect(ok, message).toBe(true);
  });
});
