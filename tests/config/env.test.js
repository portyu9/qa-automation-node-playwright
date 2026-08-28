const { loadEnv } = require('../../config/env');

describe('runtime configuration', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.TEST_BROWSER;
    delete process.env.TEST_BASE_URL;
    delete process.env.TEST_HEADLESS;
  });

  afterAll(() => {
    process.env = original;
  });

  test('provides deterministic safe defaults', () => {
    const env = loadEnv();
    expect(env.browser).toBe('chromium');
    expect(env.headless).toBe(true);
    expect(env.baseURL).toBe('https://example.com');
    expect(env.runId).toBeTruthy();
  });

  test.each([
    ['TEST_BROWSER', 'ie'],
    ['TEST_BASE_URL', 'localhost:3000'],
    ['TEST_HEADLESS', 'sometimes'],
    ['TEST_ACTION_TIMEOUT_MS', '0'],
  ])('rejects invalid %s before test execution', (name, value) => {
    process.env[name] = value;
    expect(() => loadEnv()).toThrow();
  });
});
