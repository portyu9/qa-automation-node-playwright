'use strict';

const { test, expect } = require('../fixtures/test');
const { installJsonRoute } = require('../../src/testing/networkSandbox');

test.describe('Playwright browser capability contracts', () => {
  test('route fulfillment composes with locators, steps, and APIRequestContext', async ({
    page,
    request,
  }) => {
    const route = await installJsonRoute(page, '**/api/profile', {
      id: 42,
      name: 'Ada Lovelace',
    });

    try {
      await test.step('exercise browser-side network interception', async () => {
        await page.goto('/capabilities');
        await page.getByTestId('load-profile').click();
        await expect(page.getByTestId('profile-output')).toHaveText('Ada Lovelace');
        expect(route.hits()).toBe(1);
      });

      await test.step('verify the same target through Playwright request context', async () => {
        const response = await request.get('/health');
        expect(response.ok()).toBeTruthy();
        expect(await response.json()).toEqual({ status: 'ok' });
      });
    } finally {
      await route.dispose();
    }
  });

  test('context state, upload, download, and popup events remain isolated per test', async ({
    page,
    context,
  }) => {
    await page.goto('/capabilities');
    const origin = new URL(page.url()).origin;

    await context.addCookies([
      {
        name: 'capability-mode',
        value: 'enabled',
        url: origin,
      },
    ]);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => document.cookie))
      .toContain('capability-mode=enabled');

    await page.evaluate(() => localStorage.setItem('capability-token', 'context-owned'));
    const state = await context.storageState();
    const originState = state.origins.find((entry) => entry.origin === origin);
    expect(originState?.localStorage).toContainEqual({
      name: 'capability-token',
      value: 'context-owned',
    });

    await page.getByTestId('upload-input').setInputFiles({
      name: 'runtime-evidence.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('in-memory fixture'),
    });
    await expect(page.getByTestId('upload-output')).toHaveText('runtime-evidence.txt');

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-evidence').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('evidence.txt');

    const popupPromise = page.waitForEvent('popup');
    await page.getByTestId('open-popup').click();
    const popup = await popupPromise;
    await expect(popup.getByTestId('details-title')).toHaveText('Fixture Details');
    await popup.close();
  });
});
