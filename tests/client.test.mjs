import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/client.js';
const user = { id: 'user-id', username: 'demo', displayName: 'Demo', roles: ['INV'] };
const auth = { accessToken: 'test-only-token', tokenType: 'Bearer', expiresIn: 3600 };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
test('authenticates via gateway and validates identity before opening session', async () => {
  const calls = [];
  const client = createClient('http://localhost:8088', { fetcher: async (url, options) => { calls.push([url, options]); return json(calls.length === 1 ? auth : user); } });
  assert.deepEqual(await client.login('demo', 'fixture-password'), user);
  assert.equal(calls[0][0].pathname, '/api/v1/auth/login');
  assert.equal(calls[1][1].headers.get('Authorization'), 'Bearer test-only-token');
  assert.equal(calls[0][1].credentials, 'omit');
  assert.equal(calls[0][1].redirect, 'error');
  assert.equal(Object.hasOwn(client.current(), 'accessToken'), false);
  await assert.rejects(client.request('//external.example/api/v1/stock'), /Invalid API path/);
  await assert.rejects(client.request('/api/v1/../../health'), /Invalid API path/);
  client.logout(); assert.equal(client.current(), null);
});
test('rejects invalid credentials without retaining session', async () => {
  const client = createClient('http://localhost:8088', { fetcher: async () => json({ error: 'UNAUTHORIZED' }, 401) });
  await assert.rejects(client.login('demo', 'wrong'), error => error.status === 401);
  assert.equal(client.current(), null);
});
test('expires session and refuses protected requests', async () => {
  let time = 0, calls = 0;
  const client = createClient('http://localhost:8088', { now: () => time, fetcher: async () => json(++calls === 1 ? auth : user) });
  await client.login('demo', 'fixture'); time = 3600000;
  await assert.rejects(client.request('/api/v1/stock'), error => error.status === 401);
  assert.equal(calls, 2);
});
test('late login response cannot undo logout', async () => {
  let resolve;
  const delayed = new Promise(done => { resolve = done; });
  let calls = 0;
  const client = createClient('http://localhost:8088', { fetcher: async () => ++calls === 1 ? delayed : json(user) });
  const pending = client.login('demo', 'fixture'); client.logout(); resolve(json(auth));
  await assert.rejects(pending, error => error.status === 401);
  assert.equal(client.current(), null);
});
test('protected 401 clears session, while 403 preserves identity', async () => {
  let calls = 0, status = 403;
  const client = createClient('http://localhost:8088', { fetcher: async () => json(++calls === 1 ? auth : calls === 2 ? user : { error: 'DENIED' }, calls <= 2 ? 200 : status) });
  await client.login('demo', 'fixture');
  await assert.rejects(client.request('/api/v1/stock'), error => error.status === 403);
  assert.deepEqual(client.current(), user); status = 401;
  await assert.rejects(client.request('/api/v1/stock'), error => error.status === 401);
  assert.equal(client.current(), null);
});
test('rejects external paths and malformed authentication response', async () => {
  const client = createClient('http://localhost:8088', { fetcher: async () => json({ ...auth, tokenType: 'Other' }) });
  await assert.rejects(client.login('demo', 'fixture'), error => error.status === 502);
  assert.throws(() => createClient('http://user:password@localhost:8088'));
});
