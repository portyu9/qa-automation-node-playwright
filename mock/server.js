'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

const pages = {
  '/': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quality Engineering Fixture</title>
</head>
<body>
  <main>
    <h1 data-testid="fixture-title">Quality Engineering Fixture</h1>
    <p>Repository-owned browser fixture for deterministic navigation contracts.</p>
    <a data-testid="fixture-details" href="/details">Open fixture details</a>
  </main>
</body>
</html>`,
  '/details': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fixture Details</title>
</head>
<body>
  <main>
    <h1 data-testid="details-title">Fixture Details</h1>
    <p>The browser gate is independent of public DNS, TLS, and third-party availability.</p>
    <a href="/">Return to fixture home</a>
  </main>
</body>
</html>`,
};

function write(res, status, contentType, body) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    write(res, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
    return;
  }

  const requestUrl = new URL(req.url, 'http://127.0.0.1');

  if (requestUrl.pathname === '/health') {
    write(res, 200, 'application/json; charset=utf-8', JSON.stringify({ status: 'ok' }));
    return;
  }

  if (requestUrl.pathname === '/posts') {
    write(res, 200, 'application/json; charset=utf-8', JSON.stringify(data.posts));
    return;
  }

  if (Object.hasOwn(pages, requestUrl.pathname)) {
    write(res, 200, 'text/html; charset=utf-8', pages[requestUrl.pathname]);
    return;
  }

  write(res, 404, 'text/plain; charset=utf-8', 'Not Found');
});

if (require.main === module) {
  const port = Number(process.env.MOCK_PORT || 3001);
  server.listen(port, '127.0.0.1', () => {
    console.log(`Local fixture listening on http://127.0.0.1:${port}`);
  });
}

module.exports = server;
