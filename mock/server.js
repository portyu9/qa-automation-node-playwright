const http = require('http');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/posts') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data.posts));
  } else {
    res.writeHead(404);
    res.end();
  }
});

if (require.main === module) {
  const port = process.env.MOCK_PORT || 3001;
  server.listen(port, () => {
    console.log(`Mock API listening on port ${port}`);
  });
}

module.exports = server;
