export function catalogContext(client, active) {
  return Object.freeze({ request(path, options = {}) {
    if (!active() || !client.current()) return Promise.reject(Error('Inactive portal'));
    if (!/^\/api\/v1\/medications\?page=[1-9]\d*&limit=(?:[1-9]\d?|100)$/.test(path) || Object.keys(options).length) return Promise.reject(Error('Catalog read outside contract'));
    return client.request(path);
  } });
}
