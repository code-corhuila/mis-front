import { createClient } from './client.js';
import { catalogContext } from './portals.js';
const $ = id => document.getElementById(id);
const roleNames = { ADMIN: 'Administrador', INVENTORY: 'Inventario', SUPERVISOR: 'Supervisor', CONSULTATION: 'Consulta' };
let client;
let cleanup, portalGeneration = 0;
function removePortal() { portalGeneration++; cleanup?.(); cleanup = null; $('portal-host').replaceChildren(); $('portal-area').hidden = true; document.querySelector('main').classList.remove('wide'); }
function showAccount() { removePortal(); $('account').hidden = false; $('account-view').setAttribute('aria-current', 'page'); $('catalog-view').removeAttribute('aria-current'); }
async function showCatalog() {
  if (!client.current()) return;
  removePortal(); const version = portalGeneration;
  $('account').hidden = true; $('portal-area').hidden = false; document.querySelector('main').classList.add('wide');
  $('catalog-view').setAttribute('aria-current', 'page'); $('account-view').removeAttribute('aria-current');
  $('portal-status').textContent = 'Cargando catalogo...'; $('portal-error').textContent = ''; $('portal-retry').hidden = true;
  try {
    const portal = await import('/catalog/src/portal.js');
    if (version !== portalGeneration || !client.current()) return;
    const host = document.createElement('div'); $('portal-host').append(host);
    const destroy = await portal.mount(host, catalogContext(client, () => version === portalGeneration));
    if (version !== portalGeneration || !client.current()) { destroy(); return; }
    cleanup = destroy;
  } catch { if (version === portalGeneration) { $('portal-error').textContent = 'No fue posible abrir el catalogo.'; $('portal-retry').hidden = false; } }
  finally { if (version === portalGeneration) $('portal-status').textContent = ''; }
}
function render(user) {
  removePortal(); $('views').hidden = !user;
  $('access').hidden = !!user; $('account').hidden = !user; $('logout').hidden = !user;
  $('display-name').textContent = user?.displayName || '';
  $('account-name').textContent = user?.username || '';
  $('roles').textContent = user?.roles.map(role => roleNames[role] || role).join(', ') || '';
  $('account-view').setAttribute('aria-current', 'page'); $('catalog-view').removeAttribute('aria-current');
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
$('catalog-view').addEventListener('click', showCatalog);
$('portal-retry').addEventListener('click', showCatalog);
setInterval(() => { if (client) client.current(); }, 1000);
document.addEventListener('visibilitychange', () => { if (client) client.current(); });
