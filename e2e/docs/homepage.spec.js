// @ts-check
const { test, expect } = require('playwright/test');

test.describe('GitHub Pages docs', () => {
  test('homepage renders key content and assets', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1.project-name')).toHaveText('raxmlGUI 2.0');

    await expect(
      page.getByRole('link', { name: 'View on GitHub' }),
    ).toHaveAttribute('href', 'https://github.com/AntonelliLab/raxmlGUI');

    await expect(
      page.getByRole('link', { name: 'Accompanying Paper' }),
    ).toHaveAttribute('href', 'http://dx.doi.org/10.1111/2041-210X.13512');

    const downloadLink = page.locator('#downloadLink');
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\/AntonelliLab\/raxmlGUI\/releases\/latest\/download\//,
    );

    await expect(
      page.getByRole('link', { name: 'Download example input data' }),
    ).toHaveAttribute(
      'href',
      'https://github.com/AntonelliLab/raxmlGUI/raw/master/static/example-files/example_data_raxmlGUI.zip',
    );

    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();

    const screenshot = page.locator('#basic-screenshot-light');
    await expect(screenshot).toBeVisible();
    await expect
      .poll(async () => screenshot.evaluate((img) => img.naturalWidth))
      .toBeGreaterThan(0);
  });

  test('unknown path renders 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText('Page not found :(')).toBeVisible();
  });
});
