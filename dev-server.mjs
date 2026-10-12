import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const files = new Map([['/', ['index.html', 'text/html']], ['/src/app.js', ['src/app.js', 'text/javascript']], ['/src/client.js', ['src/client.js', 'text/javascript']], ['/src/style.css', ['src/style.css', 'text/css']]]);
files.set('/assets/medistock-demo.png', ['assets/medistock-demo.png', 'image/png']);
for (const name of ['pill', 'truck', 'boxes', 'user-round', 'log-out', 'layout-dashboard']) files.set(`/assets/${name}.svg`, [`assets/${name}.svg`, 'image/svg+xml']);
for (const name of ['overview', 'overview-model']) files.set(`/src/${name}.js`, [`src/${name}.js`, 'text/javascript']);
const port = Number(process.env.PORT || 5173);
const gateway = new URL(process.env.GATEWAY_ORIGIN || 'http://localhost:8088');
if (!['http:', 'https:'].includes(gateway.protocol) || gateway.username || gateway.password || gateway.pathname !== '/' || gateway.search || gateway.hash) throw Error('Invalid GATEWAY_ORIGIN');
const catalogRoot = resolve(process.env.CATALOG_PORTAL_ROOT || fileURLToPath(new URL('../mis-catalog-portal/', import.meta.url)));
const suppliersRoot = resolve(process.env.SUPPLIERS_PORTAL_ROOT || fileURLToPath(new URL('../mis-suppliers-portal/', import.meta.url)));
const inventoryRoot = resolve(process.env.INVENTORY_PORTAL_ROOT || fileURLToPath(new URL('../mis-inventory-portal/', import.meta.url)));
let angularRoot = catalogRoot;
try { await readFile(resolve(angularRoot, 'node_modules/@angular/core/package.json')); }
catch { angularRoot = inventoryRoot; }
const imports = { rxjs: '/vendor/rxjs/dist/esm/index.js', 'rxjs/operators': '/vendor/rxjs/dist/esm/operators/index.js', tslib: '/vendor/tslib/tslib.es6.mjs' };
let catalogAvailable = false, angularAvailable = false;
try {
  for (const name of ['common', 'compiler', 'core', 'platform-browser']) {
    const pkg = JSON.parse(await readFile(resolve(angularRoot, 'node_modules/@angular', name, 'package.json'), 'utf8'));
    if (pkg.version !== '21.2.25') throw Error('Unexpected Angular version');
    for (const [entry, target] of Object.entries(pkg.exports)) {
      if (target.default?.startsWith('./fesm2022/')) imports[`@angular/${name}${entry === '.' ? '' : entry.slice(1)}`] = `/vendor/@angular/${name}/${target.default.slice(2)}`;
    }
  }
  angularAvailable = true;
} catch { console.log('Angular runtime unavailable; install the locked Catalog or Inventory dependencies.'); }
try { await readFile(resolve(catalogRoot, 'src/portal.js')); catalogAvailable = angularAvailable; } catch {}
files.set('/src/portals.js', ['src/portals.js', 'text/javascript']);
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  if (req.url === '/config.json') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ gateway: gateway.origin, catalogAvailable })); return; }
  if (req.url === '/suppliers/portal.js') {
    try { res.setHeader('Content-Type', 'text/javascript'); res.end(await readFile(resolve(suppliersRoot, 'dist/portal.js'))); }
    catch { res.writeHead(404); res.end(); } return;
  }
  if (req.url.startsWith('/vendor/') || req.url.startsWith('/catalog/') || req.url.startsWith('/inventory/')) {
    const vendor = req.url.startsWith('/vendor/'), inventory = req.url.startsWith('/inventory/');
    const root = vendor ? angularRoot : inventory ? inventoryRoot : catalogRoot;
    const relative = vendor ? `node_modules/${req.url.slice(8)}` : req.url.slice(inventory ? 11 : 9);
    const allowed = /^(src\/(portal|model|styles|exit-model|create-model|maintenance-model)\.js|node_modules\/@angular\/(common|compiler|core|platform-browser)\/fesm2022\/[a-zA-Z0-9_-]+\.mjs|node_modules\/rxjs\/dist\/esm\/[a-zA-Z0-9_/]+(?:\.js)?|node_modules\/tslib\/tslib\.es6\.mjs)$/.test(relative);
    const path = resolve(root, relative.endsWith('.js') || relative.endsWith('.mjs') ? relative : `${relative}.js`);
    if (!angularAvailable || !allowed || !path.startsWith(root + sep)) { res.writeHead(404); res.end(); return; }
    try { res.setHeader('Content-Type', 'text/javascript'); res.end(await readFile(path)); }
    catch { res.writeHead(404); res.end(); } return;
  }
  const file = files.get(req.url);
  if (!file) { res.writeHead(404); res.end(); return; }
  try {
    res.setHeader('Content-Type', `${file[1]}; charset=utf-8`);
    if (file[1].startsWith('image/')) { res.end(await readFile(new URL(file[0], import.meta.url))); return; }
    let content = await readFile(new URL(file[0], import.meta.url), 'utf8');
    if (file[0] === 'index.html') content = content.replace('<!--portal-imports-->', `<script type="importmap">${JSON.stringify({ imports })}</script>`);
    res.end(content);
  }
  catch { res.writeHead(500); res.end('Unable to load application'); }
});
server.listen(port, '127.0.0.1', () => console.log(`MediStock: http://localhost:${port}`));
