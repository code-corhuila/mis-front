import { createClient } from './client.js';
import { catalogContext, suppliersContext } from './portals.js';
const $ = id => document.getElementById(id);
const roleNames = { ADMIN: 'Administrador', INVENTORY: 'Inventario', SUPERVISOR: 'Supervisor', CONSULTATION: 'Consulta' };
let client;
let cleanup, portalGeneration = 0, selectedPortal = 'catalog', suppliersRegistration = { pending: null };
const portalDefinitions = { catalog: { url: '/catalog/src/portal.js', label: 'catalogo' }, suppliers: { url: '/suppliers/portal.js', label: 'proveedores' } };
function markView(name) { for (const view of ['account', 'catalog', 'suppliers']) { if (view === name) $(`${view}-view`).setAttribute('aria-current', 'page'); else $(`${view}-view`).removeAttribute('aria-current'); } }
function removePortal() { portalGeneration++; cleanup?.(); cleanup = null; $('portal-host').replaceChildren(); $('portal-area').hidden = true; document.querySelector('main').classList.remove('wide'); }
function showAccount() { removePortal(); $('account').hidden = false; markView('account'); }
async function showPortal(name = selectedPortal) {
  if (!client.current()) return;
  selectedPortal = name; const definition = portalDefinitions[name];
  removePortal(); const version = portalGeneration;
  $('account').hidden = true; $('portal-area').hidden = false; document.querySelector('main').classList.add('wide');
  markView(name);
  $('portal-status').textContent = `Cargando ${definition.label}...`; $('portal-error').textContent = ''; $('portal-retry').hidden = true;
  try {
    const portal = await import(definition.url);
    if (version !== portalGeneration || !client.current()) return;
    const host = document.createElement('div'); $('portal-host').append(host);
    const active = () => version === portalGeneration;
    const context = name === 'catalog' ? catalogContext(client, active) : suppliersContext(client, active, suppliersRegistration);
    const destroy = await portal.mount(host, context);
    if (version !== portalGeneration || !client.current()) { destroy(); return; }
    cleanup = destroy;
  } catch { if (version === portalGeneration) { $('portal-error').textContent = `No fue posible abrir ${definition.label}.`; $('portal-retry').hidden = false; } }
  finally { if (version === portalGeneration) $('portal-status').textContent = ''; }
}
function render(user) {
  suppliersRegistration = { pending: null };
  removePortal(); $('views').hidden = !user;
  $('access').hidden = !!user; $('account').hidden = !user; $('logout').hidden = !user;
  $('display-name').textContent = user?.displayName || '';
  $('account-name').textContent = user?.username || '';
  $('roles').textContent = user?.roles.map(role => roleNames[role] || role).join(', ') || '';
  markView('account');
  if (!user) $('password').value = '';
}
function message(error) {
  if (error.status === 401) return 'Usuario o contrase\u00f1a incorrectos, o sesi\u00f3n vencida.';
  if (error.status === 403) return 'No tienes permiso para acceder.';
  if (error.status === 429) return 'Demasiados intentos. Espera y vuelve a intentar.';
  return 'No fue posible conectar. Vuelve a intentar.';
}
$('submit').disabled = true;
try {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw Error('Configuration unavailable');
  const config = await response.json();
  client = createClient(config.gateway, { changed: render });
  $('submit').disabled = false;
} catch { $('error').textContent = 'No fue posible cargar la configuraci\u00f3n. Recarga la p\u00e1gina.'; }
$('login').addEventListener('submit', async event => {
  event.preventDefault();
  if (!client || $('submit').disabled) return;
  $('error').textContent = ''; $('status').textContent = 'Verificando acceso...';
  $('submit').disabled = true;
  try {
    if (new TextEncoder().encode($('password').value).length > 72) throw Error('Password too long');
    await client.login($('username').value.trim(), $('password').value);
    $('account-title').focus();
  } catch (error) { $('error').textContent = message(error); }
  finally { $('password').value = ''; $('status').textContent = ''; $('submit').disabled = false; }
});
$('logout').addEventListener('click', () => { client.logout(); $('error').textContent = ''; $('username').focus(); });
$('account-view').addEventListener('click', showAccount);
$('catalog-view').addEventListener('click', () => showPortal('catalog'));
$('suppliers-view').addEventListener('click', () => showPortal('suppliers'));
$('portal-retry').addEventListener('click', () => showPortal());
setInterval(() => { if (client) client.current(); }, 1000);
document.addEventListener('visibilitychange', () => { if (client) client.current(); });
