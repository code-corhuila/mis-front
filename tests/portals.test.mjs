import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogContext, suppliersContext } from '../src/portals.js';
test('portal only gets authenticated catalog reads, never a raw token', async () => {
  const client = { current: () => ({ username: 'fixture' }), request: path => Promise.resolve(path) };
  const context = catalogContext(client, () => true);
  assert.deepEqual(Object.keys(context), ['request']); assert.ok(Object.isFrozen(context));
  assert.equal(await context.request('/api/v1/medications?page=1&limit=20'), '/api/v1/medications?page=1&limit=20');
  await assert.rejects(context.request('/api/v1/stock'));
  await assert.rejects(context.request('/api/v1/medications?page=1&limit=20', { method: 'POST' }));
  await assert.rejects(catalogContext(client, () => false).request('/api/v1/medications?page=1&limit=20'));
});
test('suppliers context enforces path/role and keeps registration only within the provided session store', async () => {
  const registration = { pending: null }, calls = [];
  const client = { current: () => ({ roles: ['ADMIN'] }), request: (path, options) => { calls.push([path, options]); return Promise.resolve({}); } };
  const admin = suppliersContext(client, () => true, registration);
  assert.equal(admin.registration, registration); assert.equal(admin.canCreate, true);
  await admin.request('/api/v1/suppliers', { method: 'POST', headers: { 'Idempotency-Key': 'fixture-key' }, body: '{}' });
  assert.equal(calls.length, 1);
  await assert.rejects(admin.request('/api/v1/auth/login'));
  await assert.rejects(admin.request('/api/v1/suppliers', { method: 'POST', headers: { Authorization: 'forged' }, body: '{}' }));
  const reader = suppliersContext({ ...client, current: () => ({ roles: ['CONSULTATION'] }) }, () => true, registration);
  assert.equal(reader.canCreate, false);
  await assert.rejects(reader.request('/api/v1/suppliers', { method: 'POST', headers: { 'Idempotency-Key': 'fixture-key' }, body: '{}' }));
  await reader.request('/api/v1/suppliers?page=1&limit=20');
  await assert.rejects(suppliersContext(client, () => false, registration).request('/api/v1/suppliers?page=1&limit=20'));
});
