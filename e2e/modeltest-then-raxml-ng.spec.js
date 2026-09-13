// @ts-check
const fs = require('fs/promises');
const path = require('path');
const { test, expect } = require('playwright/test');
const { launchApp, getAppWindow, repoRoot } = require('./helpers/launchApp');
const { cleanupOutputFiles } = require('./helpers/cleanupOutput');

const outputDir = path.join(repoRoot, 'static', 'test-results');

test.describe('ModelTest then raxml-ng', () => {
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

  test('prefilled alignment runs ModelTest and raxml-ng with correct output', async () => {
    electronApp = await launchApp();
    const page = await getAppWindow(electronApp);

    await expect(page.getByText('nucleotide', { exact: true })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/sequences of length/i)).toBeVisible({
      timeout: 60_000,
    });

    outputId = `e2e_nucleotide_${Date.now()}`;
    await cleanupOutputFiles(outputDir, outputId);

    const outputNameField = page.locator('#output-name');
    await outputNameField.click();
    await outputNameField.fill('');
    await outputNameField.fill(outputId);
    await expect(outputNameField).toHaveValue(outputId);

    const modelTestButton = page.getByTestId('run-modeltest');
    await expect(modelTestButton).toBeEnabled();
    await modelTestButton.click();

    const consoleOutput = page.getByTestId('console-output');
    await expect(consoleOutput).toContainText('> raxml-ng', {
      timeout: 4 * 60 * 1000,
    });
    await expect(page.locator('#error-dialog-title')).toHaveCount(0);

    const commandPreview = page.locator('p').filter({ hasText: /^raxml-ng/ });
    await expect(commandPreview).toBeVisible();
    const commandText = (await commandPreview.textContent()) || '';
    expect(commandText).toMatch(/--model \S+/);
    expect(commandText).not.toMatch(/--model GTR(\s|$)/);

    const modeltestFiles = (await fs.readdir(outputDir)).filter((filename) =>
      filename.startsWith('RAxML_GUI_ModelTest_nucleotide')
    );
    expect(modeltestFiles.length).toBeGreaterThan(0);

    const runButton = page.getByTestId('run-analysis');
    await expect(runButton).toBeEnabled();
    await runButton.click();

    await expect(page.getByText('Calculation finished!')).toBeVisible({
      timeout: 10 * 60 * 1000,
    });
    await expect(page.locator('#error-dialog-title')).toHaveCount(0);

    await expect(page.getByText(`Result for output id '${outputId}'`)).toBeVisible();
    await expect(page.getByText(`${outputId}.raxml.bestTree.tre`)).toBeVisible();
    await expect(page.getByText(`${outputId}.raxml.support.tre`)).toBeVisible();
    await expect(page.getByText(`${outputId}.raxml.bootstraps.tre`)).toBeVisible();

    const bestTreePath = path.join(outputDir, `${outputId}.raxml.bestTree.tre`);
    const supportTreePath = path.join(
      outputDir,
      `${outputId}.raxml.support.tre`
    );
    const bootstrapsTreePath = path.join(
      outputDir,
      `${outputId}.raxml.bootstraps.tre`
    );
    const logPath = path.join(outputDir, `${outputId}.raxml.log.txt`);
    const bestModelPath = path.join(outputDir, `${outputId}.raxml.bestModel.txt`);
    const settingsPath = path.join(
      outputDir,
      `RAxML_GUI_Settings_${outputId}.txt`
    );

    await expect.poll(async () => fs.stat(bestTreePath).then(() => true).catch(() => false)).toBe(true);
    await expect.poll(async () => fs.stat(supportTreePath).then(() => true).catch(() => false)).toBe(true);
    await expect.poll(async () => fs.stat(bootstrapsTreePath).then(() => true).catch(() => false)).toBe(true);
    await expect.poll(async () => fs.stat(logPath).then(() => true).catch(() => false)).toBe(true);
    await expect.poll(async () => fs.stat(bestModelPath).then(() => true).catch(() => false)).toBe(true);
    await expect.poll(async () => fs.stat(settingsPath).then(() => true).catch(() => false)).toBe(true);

    const bestTree = await fs.readFile(bestTreePath, 'utf8');
    expect(bestTree).toContain('TAXON_');
    expect(bestTree).toMatch(/[()]/);

    const logText = await fs.readFile(logPath, 'utf8');
    expect(logText).toMatch(/Elapsed time/i);
    expect(logText).not.toMatch(/\bERROR\b/);

    const bestModelText = await fs.readFile(bestModelPath, 'utf8');
    const modelMatch = /--model (\S+)/.exec(commandText);
    expect(modelMatch).not.toBeNull();
    const baseModel = modelMatch[1].split('+')[0];
    expect(bestModelText).toContain(baseModel);
    if (modelMatch[1].includes('+I')) {
      expect(bestModelText).toMatch(/\+IU?\{/);
    }
  });
});
