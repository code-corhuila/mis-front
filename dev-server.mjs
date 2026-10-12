import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Map([['/', ['index.html', 'text/html']], ['/src/app.js', ['src/app.js', 'text/javascript']], ['/src/client.js', ['src/client.js', 'text/javascript']], ['/src/style.css', ['src/style.css', 'text/css']]]);
const port = Number(process.env.PORT || 5173);
const gateway = new URL(process.env.GATEWAY_ORIGIN || 'http://localhost:8088');
if (!['http:', 'https:'].includes(gateway.protocol) || gateway.username || gateway.password || gateway.pathname !== '/' || gateway.search || gateway.hash) throw Error('Invalid GATEWAY_ORIGIN');
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  if (req.url === '/config.json') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ gateway: gateway.origin })); return; }
  const file = files.get(req.url);
  if (!file) { res.writeHead(404); res.end(); return; }
  try { res.setHeader('Content-Type', `${file[1]}; charset=utf-8`); res.end(await readFile(new URL(file[0], import.meta.url))); }
  catch { res.writeHead(500); res.end('Unable to load application'); }
});
server.listen(port, '127.0.0.1', () => console.log(`MediStock: http://localhost:${port}`));
