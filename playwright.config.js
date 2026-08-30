const { defineConfig, devices } = require('@playwright/test');
const { DEFAULT_FIXTURE_URL, loadEnv } = require('./config/env');

const env = loadEnv();
const isCI = Boolean(process.env.CI);
const usesLocalFixture = env.baseURL === DEFAULT_FIXTURE_URL;

module.exports = defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results',
  timeout: 45_000,
  expect: { timeout: 7_500 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['line'],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  webServer: usesLocalFixture
    ? {
        command: 'node mock/server.js',
        url: `${DEFAULT_FIXTURE_URL}/health`,
        reuseExistingServer: env.reuseLocalServer,
        timeout: 15_000,
      }
    : undefined,
  use: {
    baseURL: env.baseURL,
    headless: env.headless,
    actionTimeout: env.actionTimeoutMs,
    navigationTimeout: env.navigationTimeoutMs,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
