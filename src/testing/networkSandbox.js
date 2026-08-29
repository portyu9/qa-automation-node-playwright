'use strict';

async function installJsonRoute(page, pattern, payload, { status = 200, headers = {} } = {}) {
  if (!page) throw new TypeError('page is required');
  if (!pattern) throw new TypeError('route pattern is required');
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    throw new TypeError('status must be an HTTP status code between 100 and 599');
  }

  let body;
  try {
    body = JSON.stringify(payload);
  } catch (error) {
    throw new TypeError(`payload must be JSON-serializable: ${error.message}`);
  }
  if (body === undefined) {
    throw new TypeError('payload must serialize to a JSON value');
  }

  const responseHeaders = Object.freeze({ 'cache-control': 'no-store', ...headers });
  let hitCount = 0;
  const handler = async (route) => {
    hitCount += 1;
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: responseHeaders,
      body,
    });
  };

  await page.route(pattern, handler);

  let disposed = false;
  return Object.freeze({
    hits: () => hitCount,
    async dispose() {
      if (disposed) return;
      disposed = true;
      await page.unroute(pattern, handler);
    },
  });
}

module.exports = { installJsonRoute };
