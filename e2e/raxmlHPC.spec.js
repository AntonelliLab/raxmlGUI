// @ts-check
const fs = require('fs/promises');
const path = require('path');
const { test, expect } = require('playwright/test');
const { launchApp, getAppWindow, repoRoot } = require('./helpers/launchApp');
const { cleanupOutputFiles } = require('./helpers/cleanupOutput');
const { waitForOutputFile } = require('./helpers/waitForOutput');

const outputDir = path.join(repoRoot, 'static', 'test-results');

test.describe('raxmlHPC', () => {
  /** @type {import('playwright/test').ElectronApplication | undefined} */
  let electronApp;
  /** @type {string | undefined} */
  let outputId;

  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
      electronApp = undefined;
    }
    if (outputId) {
      await cleanupOutputFiles(outputDir, outputId);
      outputId = undefined;
    }
  });

  test('prefilled alignment runs raxmlHPC with correct output', async () => {
    electronApp = await launchApp();
    const page = await getAppWindow(electronApp);

    await expect(page.getByText('nucleotide', { exact: true })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/sequences of length/i)).toBeVisible({
      timeout: 60_000,
    });

    outputId = `e2e_raxmlhpc_${Date.now()}`;
    await cleanupOutputFiles(outputDir, outputId);

    const outputNameField = page.locator('#output-name');
    await outputNameField.click();
    await outputNameField.fill('');
    await outputNameField.fill(outputId);
    await expect(outputNameField).toHaveValue(outputId);

    await page.locator('#mui-component-select-Binary').click();
    await page.getByRole('option', { name: 'raxmlHPC', exact: true }).click();

    await page.locator('#mui-component-select-Analysis').click();
    await page.getByRole('option', { name: 'ML search', exact: true }).click();

    const commandPreview = page.locator('p').filter({ hasText: /^raxmlHPC/ });
    await expect(commandPreview).toBeVisible();
    const commandText = (await commandPreview.textContent()) || '';
    expect(commandText).toMatch(/-f d/);
    expect(commandText).toMatch(/-m \S+/);

    const outputFilename = `${outputId}.tre`;
    const bestTreePath = path.join(
      outputDir,
      `RAxML_bestTree.${outputFilename}`
    );
    const infoPathTxt = path.join(outputDir, `RAxML_info.${outputId}.txt`);
    const infoPathTre = path.join(outputDir, `RAxML_info.${outputFilename}`);
    const settingsPath = path.join(
      outputDir,
      `RAxML_GUI_Settings_${outputId}.txt`
    );

    const runButton = page.getByTestId('run-analysis');
    await expect(runButton).toBeEnabled();
    await runButton.click();

    await waitForOutputFile(bestTreePath, { timeout: 3 * 60 * 1000 });
    await waitForOutputFile([infoPathTxt, infoPathTre], { timeout: 60_000 });
    await waitForOutputFile(settingsPath, { timeout: 60_000 });
    await expect(page.locator('#error-dialog-title')).toHaveCount(0);

    const bestTree = await fs.readFile(bestTreePath, 'utf8');
    expect(bestTree).toContain('TAXON_');
    expect(bestTree).toMatch(/[()]/);

    const infoPath = (await fs.stat(infoPathTxt).then(() => infoPathTxt).catch(() => infoPathTre));
    const infoText = await fs.readFile(infoPath, 'utf8');
    expect(infoText.length).toBeGreaterThan(0);
  });
});
