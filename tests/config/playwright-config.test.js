'use strict';

describe('Playwright CI execution policy', () => {
  const originalCi = process.env.CI;

  afterEach(() => {
    if (originalCi === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = originalCi;
    }
    jest.resetModules();
  });

  test('keeps bounded retries diagnostic while failing retry-only passes', () => {
    process.env.CI = 'true';
    jest.resetModules();

    const config = require('../../playwright.config');

    expect(config.forbidOnly).toBe(true);
    expect(config.retries).toBe(2);
    expect(config.failOnFlakyTests).toBe(true);
  });
});
