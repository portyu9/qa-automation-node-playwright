const { test, expect } = require('../fixtures/test');
const { HomePage } = require('../../src/pages/home.page');

test.describe('configured application landing page', () => {
  test('@smoke exposes the expected semantic page contract', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    await expect(page).toHaveTitle(/Example Domain/);
    await expect(homePage.heading).toHaveText('Example Domain');
    await expect(homePage.primaryLink).toBeVisible();
    await expect(homePage.primaryLink).toHaveAttribute('href', /^https:\/\/iana\.org\//);
  });
});
