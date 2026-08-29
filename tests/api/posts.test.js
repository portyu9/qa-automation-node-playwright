'use strict';

const server = require('../../mock/server');
const { PostsApiClient } = require('../../src/apiClient');

describe('posts API client', () => {
  let localBaseURL;

  beforeAll(async () => {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', reject);
        const address = server.address();
        localBaseURL = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test('retrieves posts through the deterministic loopback boundary', async () => {
    const client = new PostsApiClient({
      baseURL: localBaseURL,
      timeoutMs: 2_000,
      runId: 'jest-local-contract',
    });

    const posts = await client.listPosts();

    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toEqual(
      expect.objectContaining({ id: expect.any(Number), title: expect.any(String) })
    );
  });

  test('applies correlation and timeout policy through an injectable fetch boundary', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, userId: 1, title: 'T1', body: 'B1' }],
    }));
    const client = new PostsApiClient({
      baseURL: 'https://api.example.test',
      timeoutMs: 1_500,
      runId: 'jest-contract',
      fetchImpl,
    });

    await expect(client.listPosts()).resolves.toHaveLength(1);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.example.test/posts');
    expect(fetchImpl.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-test-run-id': 'jest-contract',
        },
      })
    );
    expect(fetchImpl.mock.calls[0][1].signal).toEqual(
      expect.objectContaining({ aborted: false })
    );
  });

  test('preserves HTTP failure semantics', async () => {
    const client = new PostsApiClient({
      baseURL: 'https://api.example.test',
      timeoutMs: 1_000,
      runId: 'jest-contract',
      fetchImpl: async () => ({ ok: false, status: 503 }),
    });

    await expect(client.listPosts()).rejects.toThrow('status 503');
  });
});