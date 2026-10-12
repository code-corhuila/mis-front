export function catalogContext(client, active) {
  return Object.freeze({ request(path, options = {}) {
    if (!active() || !client.current()) return Promise.reject(Error('Inactive portal'));
    if (!/^\/api\/v1\/medications\?page=[1-9]\d*&limit=(?:[1-9]\d?|100)$/.test(path) || Object.keys(options).length) return Promise.reject(Error('Catalog read outside contract'));
    return client.request(path);
  } });
}
export function suppliersContext(client, active, registration) {
  const canCreate = client.current()?.roles.includes('ADMIN') === true;
  return Object.freeze({ canCreate, registration, request(path, options = {}) {
    if (!active() || !client.current()) return Promise.reject(Error('Inactive portal'));
    const read = /^\/api\/v1\/suppliers\?page=[1-9]\d*&limit=20$/.test(path) && Object.keys(options).length === 0;
    const write = canCreate && path === '/api/v1/suppliers' && options.method === 'POST' && typeof options.body === 'string' && options.body.length <= 65536 && Object.keys(options).sort().join() === 'body,headers,method' && Object.keys(options.headers || {}).join() === 'Idempotency-Key' && /^[A-Za-z0-9._:-]{8,128}$/.test(options.headers['Idempotency-Key']);
    if (!read && !write) return Promise.reject(Error('Suppliers request outside contract'));
    return client.request(path, options);
  } });
}
export function inventoryContext(client, active) {
  const canMovements = client.current()?.roles.some(role => ['ADMIN', 'INVENTORY', 'SUPERVISOR'].includes(role)) === true;
  return Object.freeze({ canMovements, request(path, options = {}) {
    if (!active() || !client.current()) return Promise.reject(Error('Inactive portal'));
    const url = new URL(path, 'http://inventory-context.invalid');
    const parameters = [...url.searchParams];
    const keys = parameters.map(([key]) => key);
    const references = ['/api/v1/medications?page=1&limit=100', '/api/v1/suppliers?page=1&limit=100'].includes(path);
    const allowed = url.pathname === '/api/v1/stock' ? ['page', 'limit', 'lotId', 'expired'] : url.pathname === '/api/v1/movements' && canMovements ? ['page', 'limit', 'lotId', 'from', 'to'] : [];
    const validValue = ([key, value]) => {
      if (['page', 'limit'].includes(key)) return true;
      if (key === 'expired') return ['true', 'false'].includes(value);
      if (key === 'lotId') return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
      return /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value);
    };
    const read = path.startsWith('/api/v1/') && url.origin === 'http://inventory-context.invalid' && !url.hash && allowed.length && keys.length === new Set(keys).size && keys.every(key => allowed.includes(key)) && /^(?:[1-9]\d{0,5}|1000000)$/.test(url.searchParams.get('page')) && url.searchParams.get('limit') === '20' && parameters.every(validValue);
    if (Object.keys(options).length || (!references && !read)) return Promise.reject(Error('Inventory read outside contract'));
    return client.request(path);
  } });
}
