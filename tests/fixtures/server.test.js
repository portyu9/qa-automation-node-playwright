'use strict';

const server = require('../../mock/server');
const { parsePort } = server;

describe('deterministic fixture server contract', () => {
  let baseURL;

  beforeAll(async () => {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', reject);
        const address = server.address();
        if (!address || typeof address === 'string') {
          reject(new Error('Fixture server did not expose a TCP address'));
          return;
        }
        baseURL = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test.each([
    ['3001x'],
    ['0'],
    ['65536'],
    [''],
    ['  '],
  ])('rejects invalid command-line fixture port %p', (value) => {
    expect(() => parsePort(value)).toThrow('MOCK_PORT must be an integer between 1 and 65535');
  });

  test('accepts a valid command-line fixture port', () => {
    expect(parsePort(' 4173 ')).toBe(4173);
  });

  test('serves the fixture with a defensive response-header contract', async () => {
    const response = await fetch(`${baseURL}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });

  test('serves capability behavior through a same-origin script compatible with CSP', async () => {
    const response = await fetch(`${baseURL}/assets/capabilities.js`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/javascript');
    expect(body).toContain("[data-testid=\"load-profile\"]");
  });
});
