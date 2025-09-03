const { test, expect } = require('@playwright/test');
const { HomePage } = require('../../src/pages/home.page');

// E2E test for Playwright documentation home page using the Page Object Model.
test.describe('Playwright Docs Home Page', () => {
  test('should display correct hero title and navigate to get started', async ({ page }) => {
    const homePage = new HomePage(page);
    // Navigate to the home page and verify the hero title contains the expected text
    await homePage.goto();
    const heroText = await homePage.getHeroTitleText();
    await expect(heroText).toContain('End-to-end');
    // Click the Get Started button and confirm URL contains "intro" path
    await homePage.clickGetStarted();
    await expect(page).toHaveURL(/.*intro/);
  });
});
