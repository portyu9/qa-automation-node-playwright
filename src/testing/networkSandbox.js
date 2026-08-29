'use strict';

async function installJsonRoute(page, pattern, payload, { status = 200, headers = {} } = {}) {
  if (!page) throw new TypeError('page is required');
  if (!pattern) throw new TypeError('route pattern is required');

  let hitCount = 0;
  const handler = async (route) => {
    hitCount += 1;
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'cache-control': 'no-store', ...headers },
      body: JSON.stringify(payload),
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
