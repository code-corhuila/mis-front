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
