const { test, expect } = require('@playwright/test');

// A very simple end‑to‑end test that navigates to example.com and checks the title.
// Playwright automatically handles launching the browser and cleaning up.
test('homepage has correct title and contains expected text', async ({ page }) => {
  await page.goto('https://example.com');
  // Assert that the page title contains "Example Domain"
  await expect(page).toHaveTitle(/Example Domain/);
  // Locate the heading and check its text content
  const heading = page.locator('h1');
  await expect(heading).toHaveText('Example Domain');
  // Click the More information link and verify navigation
  const moreInfo = page.locator('a:has-text("More information")');
  await moreInfo.click();
  await expect(page).toHaveURL(/iana.org/);
});
