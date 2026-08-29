const { test, expect } = require('../fixtures/test');
const { HomePage } = require('../../src/pages/home.page');

test.describe('configured application landing page', () => {
  test('@smoke exposes the expected semantic page contract', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    await expect(page).toHaveTitle('Quality Engineering Fixture');
    await expect(homePage.heading).toHaveText('Quality Engineering Fixture');
    await expect(homePage.primaryLink).toBeVisible();
    await expect(homePage.primaryLink).toHaveAttribute('href', '/details');

    await homePage.followPrimaryLink();
    await expect(page).toHaveURL(/\/details$/);
    await expect(page.getByTestId('details-title')).toHaveText('Fixture Details');
  });
});
