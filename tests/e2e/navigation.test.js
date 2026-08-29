const { test, expect } = require('../fixtures/test');

test('navigation returns a successful repository-owned document', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'navigation should return an HTTP response').not.toBeNull();
  expect(response.ok(), `unexpected HTTP status ${response.status()}`).toBeTruthy();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quality Engineering Fixture');
  await expect(page.locator('main')).toContainText('Repository-owned browser fixture');
});
