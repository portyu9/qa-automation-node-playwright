const { DEFAULT_FIXTURE_URL, loadEnv } = require('../../config/env');

describe('runtime configuration', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.TEST_BROWSER;
    delete process.env.TEST_BASE_URL;
    delete process.env.TEST_API_BASE_URL;
    delete process.env.TEST_HEADLESS;
    delete process.env.TEST_ACTION_TIMEOUT_MS;
    delete process.env.TEST_NAVIGATION_TIMEOUT_MS;
    delete process.env.TEST_API_TIMEOUT_MS;
    delete process.env.TEST_RUN_ID;
  });

  afterAll(() => {
    process.env = original;
  });

  test('provides deterministic safe defaults', () => {
    const env = loadEnv();
    expect(env.browser).toBe('chromium');
    expect(env.headless).toBe(true);
    expect(env.baseURL).toBe(DEFAULT_FIXTURE_URL);
    expect(env.apiBaseURL).toBe(DEFAULT_FIXTURE_URL);
    expect(env.apiTimeoutMs).toBe(10_000);
    expect(env.runId).toBeTruthy();
  });

  test('normalizes operator-controlled text inputs before use', () => {
    process.env.TEST_BROWSER = ' Firefox ';
    process.env.TEST_BASE_URL = ' https://example.test/app/ ';
    process.env.TEST_HEADLESS = ' yes ';
    process.env.TEST_RUN_ID = ' run:playwright-42 ';

    const env = loadEnv();
    expect(env.browser).toBe('firefox');
    expect(env.baseURL).toBe('https://example.test/app');
    expect(env.headless).toBe(true);
    expect(env.runId).toBe('run:playwright-42');
  });

  test.each([
    ['TEST_BROWSER', 'ie'],
    ['TEST_BASE_URL', 'localhost:3000'],
    ['TEST_BASE_URL', 'https://user:password@example.test'],
    ['TEST_BASE_URL', 'https://example.test/app?access_token=secret'],
    ['TEST_API_BASE_URL', 'https://:443'],
    ['TEST_API_BASE_URL', 'https://example.test/api#fragment'],
    ['TEST_HEADLESS', 'sometimes'],
    ['TEST_ACTION_TIMEOUT_MS', '0'],
    ['TEST_API_TIMEOUT_MS', '0'],
    ['TEST_RUN_ID', 'unsafe run id'],
    ['TEST_RUN_ID', 'line-break\nheader'],
    ['TEST_RUN_ID', 'x'.repeat(129)],
  ])('rejects invalid %s before test execution', (name, value) => {
    process.env[name] = value;
    expect(() => loadEnv()).toThrow();
  });
});
