// @ts-check
const fs = require('fs/promises');
const path = require('path');
const { test, expect } = require('playwright/test');
const { launchApp, getAppWindow, repoRoot } = require('./helpers/launchApp');
const { cleanupOutputFiles } = require('./helpers/cleanupOutput');
const { waitForOutputFile } = require('./helpers/waitForOutput');
const { parseModelTestLog } = require('./helpers/modeltestOutcome');
const { parseRaxmlNgOutput } = require('./helpers/raxmlNgOutcome');
const { parseRaxmlHpcOutput } = require('./helpers/raxmlHpcOutcome');
const { getTaxa } = require('./helpers/newick');
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

const alignmentFile = path.join(
  repoRoot,
  'static',
  'example-files',
  'fasta',
  'nucleotide.txt',
);
const raxmlNgSettings = {
  seed: 12345,
  runs: 1,
  analysis: 'TI',
  binary: 'raxml-ng',
  binaryVersions: { 'raxml-ng': '1.2.2' },
};
const raxmlNgSuffixes = [
  'raxml.bestTree.tre',
  'raxml.bestTreeCollapsed.tre',
  'raxml.bestModel.txt',
  'raxml.log.txt',
  'raxml.startTree.tre',
  'raxml.rba',
];
// The serial build: the PTHREADS builds give other trees and scores
const raxmlHpcBinary =
  process.platform === 'win32' ? 'raxmlHPC.exe' : 'raxmlHPC';
const raxmlHpcSettings = {
  seed: 12345,
  runs: 1,
  analysis: 'ML',
  binary: raxmlHpcBinary,
  binaryVersions: { raxmlHPC: '8.2.12' },
};

const alignmentTaxa = async () =>
  (await fs.readFile(alignmentFile, 'utf8'))
    .split('\n')
    .filter((line) => line.startsWith('>'))
    .map((line) => line.slice(1).trim())
    .sort();

test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('ModelTest outcome', () => {
  /** @type {import('playwright/test').ElectronApplication} */
  let electronApp;
  const outputId = `e2e_modeltest_${Date.now()}`;
  /** @type {import('playwright/test').Page} */
  let page;
  let modelTestModel = '';

  test.beforeAll(async () => {
    electronApp = await launchApp();
  });

  test.afterAll(async () => {
    await electronApp?.close();
    await cleanupOutputFiles(outputDir, outputId);
  });

  test('AICc on nucleotide.txt matches the host fixture', async () => {
    page = await getAppWindow(electronApp);
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
    modelTestModel = actual.criteria.AICc.model;
    const { ok, message } = checkFixture('modeltest', settings, actual);
    expect(ok, message).toBe(true);
  });

  test('TI with the ModelTest model matches the host fixture', async () => {
    test.skip(
      process.platform === 'win32',
      'Windows binary set has no raxml-ng',
    );
    await page.locator('#mui-component-select-Analysis').click();
    await page
      .getByRole('option', { name: 'ML tree inference', exact: true })
      .click();
    await page.getByTitle('Random seed').locator('input').fill('12345');

    // The model comes from the ModelTest result, not from this test
    const command = page.locator('p').filter({ hasText: /^raxml-ng/ });
    await expect(command).toContainText(`--model ${modelTestModel}`);
    await expect(command).toContainText('--seed 12345');
    await expect(command).toContainText('rand{1}');

    await page.getByTestId('run-analysis').click();
    await expect(page.getByText('Calculation finished!')).toBeVisible({
      timeout: 10 * 60 * 1000,
    });
    await expect(page.locator('#error-dialog-title')).toHaveCount(0);

    for (const suffix of raxmlNgSuffixes) {
      await waitForOutputFile(path.join(outputDir, `${outputId}.${suffix}`), {
        timeout: 30_000,
      });
    }
    await waitForOutputFile(
      path.join(outputDir, `RAxML_GUI_Settings_${outputId}.txt`),
      { timeout: 30_000 },
    );

    const actual = parseRaxmlNgOutput({
      log: await fs.readFile(
        path.join(outputDir, `${outputId}.raxml.log.txt`),
        'utf8',
      ),
      bestTree: await fs.readFile(
        path.join(outputDir, `${outputId}.raxml.bestTree.tre`),
        'utf8',
      ),
    });
    expect(getTaxa(actual.bestTree)).toEqual(await alignmentTaxa());

    const { ok, message } = checkFixture('raxml-ng', raxmlNgSettings, actual);
    expect(ok, message).toBe(true);
  });

  test('ML search with the ModelTest model matches the host fixture', async () => {
    const readClipboard = () =>
      electronApp.evaluate(({ clipboard }) => clipboard.readText());
    // A name of its own, so the app does not rename it after the raxml-ng run
    const hpcId = `${outputId}_hpc`;
    await page.locator('#output-name').fill(hpcId);
    await page.locator('#mui-component-select-Binary').click();
    await page
      .getByRole('option', { name: raxmlHpcBinary, exact: true })
      .click();
    await page.locator('#mui-component-select-Analysis').click();
    await page.getByRole('option', { name: 'ML search', exact: true }).click();
    await page.getByTitle('Random seed').locator('input').fill('12345');

    // The app filled this in from the ModelTest result; this test never sets it
    const command = page.locator('p').filter({ hasText: /^raxmlHPC/ });
    await expect(command).toContainText('-f d');
    await expect(command).toContainText('-m GTRCATIX ');
    await expect(command).toContainText('-N 1 ');
    await expect(command).toContainText('-p 12345');
    await expect(command).not.toContainText('-T ');
    const commandText = (await command.textContent()) || '';

    await page.getByLabel('copy-command').click();
    await expect.poll(readClipboard).toBe(commandText);

    await page.getByText('How to cite?').click();
    await page.getByRole('button', { name: 'Copy to clipboard' }).click();
    await expect.poll(readClipboard).toContain('10.1111/2041-210X.13512');
    await page
      .locator('#show-citation')
      .getByRole('button', { name: 'Close' })
      .click();

    await page.getByTestId('run-analysis').click();
    const bestTreePath = path.join(outputDir, `RAxML_bestTree.${hpcId}.tre`);
    await waitForOutputFile(bestTreePath, { timeout: 3 * 60 * 1000 });
    const infoPath = await waitForOutputFile(
      [
        path.join(outputDir, `RAxML_info.${hpcId}.txt`),
        path.join(outputDir, `RAxML_info.${hpcId}.tre`),
      ],
      { timeout: 60_000 },
    );
    await waitForOutputFile(
      path.join(outputDir, `RAxML_GUI_Settings_${hpcId}.txt`),
      { timeout: 60_000 },
    );
    await expect(page.locator('#error-dialog-title')).toHaveCount(0);

    const actual = parseRaxmlHpcOutput({
      info: await fs.readFile(infoPath, 'utf8'),
      bestTree: await fs.readFile(bestTreePath, 'utf8'),
    });
    expect(getTaxa(actual.bestTree)).toEqual(await alignmentTaxa());

    const { ok, message } = checkFixture('raxmlHPC', raxmlHpcSettings, actual);
    expect(ok, message).toBe(true);
  });
});
