const { test, expect } = require('@playwright/test');

test('navigation returns a successful document and accessible heading', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'navigation should return an HTTP response').not.toBeNull();
  expect(response.ok(), `unexpected HTTP status ${response.status()}`).toBeTruthy();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('main, div').first()).toContainText(/Example Domain/);
});
