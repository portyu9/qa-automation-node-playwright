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
    <a data-testid="fixture-capabilities" href="/capabilities">Open capability surface</a>
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
  '/capabilities': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Browser Capability Surface</title>
</head>
<body>
  <main>
    <h1 data-testid="capability-title">Browser Capability Surface</h1>
    <button data-testid="load-profile" type="button">Load profile</button>
    <output data-testid="profile-output">idle</output>
    <label>
      Evidence file
      <input data-testid="upload-input" type="file">
    </label>
    <output data-testid="upload-output">none</output>
    <a data-testid="download-evidence" href="/download/evidence.txt" download>Download evidence</a>
    <a data-testid="open-popup" href="/details" target="_blank" rel="noopener">Open details window</a>
  </main>
  <script>
    document.querySelector('[data-testid="load-profile"]').addEventListener('click', async () => {
      const response = await fetch('/api/profile', { headers: { Accept: 'application/json' } });
      const body = await response.json();
      document.querySelector('[data-testid="profile-output"]').textContent = body.name;
    });
    document.querySelector('[data-testid="upload-input"]').addEventListener('change', (event) => {
      const [file] = event.target.files;
      document.querySelector('[data-testid="upload-output"]').textContent = file ? file.name : 'none';
    });
  </script>
</body>
</html>`,
};

function write(res, status, contentType, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
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

  if (requestUrl.pathname === '/api/profile') {
    write(
      res,
      200,
      'application/json; charset=utf-8',
      JSON.stringify({ id: 1, name: 'fixture-profile' })
    );
    return;
  }

  if (requestUrl.pathname === '/download/evidence.txt') {
    write(res, 200, 'text/plain; charset=utf-8', 'deterministic evidence\n', {
      'Content-Disposition': 'attachment; filename="evidence.txt"',
    });
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
