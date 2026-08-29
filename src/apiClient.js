'use strict';

class PostsApiClient {
  constructor({ baseURL, timeoutMs, runId, fetchImpl = globalThis.fetch }) {
    if (typeof fetchImpl !== 'function') {
      throw new TypeError('fetchImpl must be a function');
    }
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new TypeError('timeoutMs must be a positive integer');
    }

    this.baseURL = String(baseURL).replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.runId = String(runId);
    this.fetchImpl = fetchImpl;
  }

  async listPosts() {
    const response = await this.fetchImpl(`${this.baseURL}/posts`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-test-run-id': this.runId,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`posts request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload) || payload.some((item) => item === null || typeof item !== 'object')) {
      throw new Error('posts response must be a JSON array of objects');
    }
    return payload;
  }
}

module.exports = { PostsApiClient };