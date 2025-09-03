/**
 * Playwright configuration file.
 *
 * This configuration tells Playwright where to locate end‑to‑end tests,
 * which browsers to use, and sets useful defaults such as headless mode
 * and trace collection on failure. Feel free to modify this file as you
 * explore more advanced Playwright features.
 */

const { devices } = require('@playwright/test');

/**
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
const config = {
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  use: {
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'WebKit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
};

module.exports = config;
