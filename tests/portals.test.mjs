import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogContext } from '../src/portals.js';
test('portal only gets authenticated catalog reads, never a raw token', async () => {
  const client = { current: () => ({ username: 'fixture' }), request: path => Promise.resolve(path) };
  const context = catalogContext(client, () => true);
  assert.deepEqual(Object.keys(context), ['request']); assert.ok(Object.isFrozen(context));
  assert.equal(await context.request('/api/v1/medications?page=1&limit=20'), '/api/v1/medications?page=1&limit=20');
  await assert.rejects(context.request('/api/v1/stock'));
  await assert.rejects(context.request('/api/v1/medications?page=1&limit=20', { method: 'POST' }));
  await assert.rejects(catalogContext(client, () => false).request('/api/v1/medications?page=1&limit=20'));
});
