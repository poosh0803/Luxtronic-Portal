const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

loadEnvFile(path.join(ROOT, '.env'));

const PORT = process.env.PORT || 3000;

const REDIRECTS = {
  '/links/mastex-price-list': process.env.MASTEX_PRICE_LIST_URL,
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (Object.prototype.hasOwnProperty.call(REDIRECTS, urlPath)) {
    const target = REDIRECTS[urlPath];
    if (!target) return send(res, 502, 'Redirect target not configured');
    return send(res, 302, '', { Location: target });
  }

  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, 'Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return fs.readFile(path.join(ROOT, '404.html'), (err404, data404) => {
        if (err404) return send(res, 404, 'Not found');
        send(res, 404, data404, { 'Content-Type': 'text/html; charset=utf-8' });
      });
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  });
});

server.listen(PORT, () => {
  console.log(`Luxtronic Portal running at http://localhost:${PORT}`);
});
