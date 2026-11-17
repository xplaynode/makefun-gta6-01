// Costa Serena — tiny local development server.
// Usage: node serve.ts [--port 8080]  then open http://localhost:8080
// Serves only files inside game/, with the MIME types the game needs.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const argv = process.argv.slice(2);
const portAt = argv.indexOf('--port');
const wanted = portAt === -1 ? 8080 : Number(argv[portAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname = '/';
  try { pathname = decodeURIComponent(url.pathname); } catch {
    response.writeHead(400).end('bad request'); return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = resolve(join(gameRoot, normalize(pathname)));
  if (filePath !== gameRoot && !filePath.startsWith(gameRoot + sep)) {
    response.writeHead(403).end('forbidden'); return;
  }
  let size = 0;
  try {
    const info = statSync(filePath);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch { response.writeHead(404).end('not found'); return; }
  response.writeHead(200, {
    'content-type': MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Costa Serena game/ is live at http://localhost:${port}`);
});
