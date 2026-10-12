import { createClient } from './client.js';
const $ = id => document.getElementById(id);
const roleNames = { ADMIN: 'Administrador', INVENTORY: 'Inventario', SUPERVISOR: 'Supervisor', CONSULTATION: 'Consulta' };
let client;
function render(user) {
  $('access').hidden = !!user; $('account').hidden = !user; $('logout').hidden = !user;
  $('display-name').textContent = user?.displayName || '';
  $('account-name').textContent = user?.username || '';
  $('roles').textContent = user?.roles.map(role => roleNames[role] || role).join(', ') || '';
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
setInterval(() => { if (client) client.current(); }, 1000);
document.addEventListener('visibilitychange', () => { if (client) client.current(); });
