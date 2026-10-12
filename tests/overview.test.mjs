import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overviewModel } from '../src/overview-model.js';
const id = '11111111-1111-4111-8111-111111111111';
const lot = { lotId: id, lotNumber: 'SYNTHETIC', expiresOn: '2020-01-01', expired: true, onHandQuantity: 3 };
const listing = (path, data = [], total = data.length) => { const url = new URL(path, 'http://fixture'); return { data, meta: { page: Number(url.searchParams.get('page')), limit: Number(url.searchParams.get('limit')), total } }; };
test('counts owner metadata, not page length or quantities; pages expired lots and restricts consultation', async () => {
  const calls = []; const model = overviewModel(async path => { calls.push(path); return path.includes('expired=true') ? listing(path, [lot], 21) : listing(path, [], 45); }, false);
  await model.load(); assert.equal(model.snapshot().metrics.medications.value, 45); assert.equal(model.snapshot().metrics.lots.value, 45);
  assert.equal(model.snapshot().expired.total, 21); assert.equal(model.snapshot().expired.data[0].onHandQuantity, 3);
  await model.loadExpired(2); assert.equal(model.snapshot().expired.page, 2); assert.ok(calls.every(path => !path.includes('movements')));
});
test('authorized movements use only the latest five records and keep total metadata', async () => {
  const movement = { id, lotNumber: 'SYNTHETIC', type: 'EXIT', quantity: 2, createdAt: '2026-10-12T12:00:00Z' };
  const model = overviewModel(async path => path.includes('movements') ? listing(path, [movement], 80) : listing(path), true);
  await model.load(); assert.equal(model.snapshot().movements.total, 80); assert.equal(model.snapshot().movements.data.length, 1);
});
test('partial outages and malformed metadata are unavailable, never zero; retry recovers', async () => {
  let fail = true;
  const model = overviewModel(async path => { if (fail && path.includes('suppliers')) throw Error('offline'); if (fail && path.includes('medications')) return { data: [], meta: { total: '0' } }; return listing(path); }, false);
  await model.load(); assert.equal(model.snapshot().metrics.suppliers.value, null); assert.equal(model.snapshot().metrics.medications.error, true); assert.equal(model.snapshot().metrics.lots.value, 0);
  fail = false; await model.load(); assert.equal(model.snapshot().metrics.suppliers.value, 0); assert.equal(model.snapshot().metrics.medications.error, false);
});
test('expired/movement schema failures cannot become reassuring empty results', async () => {
  const model = overviewModel(async path => path.includes('expired') ? listing(path, [{ ...lot, expired: false }]) : path.includes('movements') ? listing(path, [{ id, type: 'UNKNOWN' }]) : listing(path), true);
  await model.load(); assert.equal(model.snapshot().expired.total, null); assert.ok(model.snapshot().expired.error); assert.equal(model.snapshot().movements.total, null); assert.ok(model.snapshot().movements.error);
  const invalidDate = overviewModel(async path => path.includes('expired') ? listing(path, [{ ...lot, expiresOn: '2026-02-30' }]) : listing(path), false); await invalidDate.load(); assert.ok(invalidDate.snapshot().expired.error);
});
test('latest expiry page and refresh win over delayed responses', async () => {
  let resolve; const wait = new Promise(done => { resolve = done; });
  const model = overviewModel(path => path.includes('page=1&limit=20') ? wait : Promise.resolve(listing(path, [lot], 21)), false);
  const first = model.loadExpired(1); await model.loadExpired(2); resolve(listing('/api/v1/stock?page=1&limit=20', [lot], 21)); await first; assert.equal(model.snapshot().expired.page, 2);
  let finish; const slow = new Promise(done => { finish = done; }); let attempt = 0;
  const refresh = overviewModel(path => ++attempt <= 4 ? slow.then(() => listing(path, [], 99)) : Promise.resolve(listing(path)), false);
  const pending = refresh.load(); await refresh.load(); finish(); await pending; assert.equal(refresh.snapshot().metrics.medications.value, 0);
});
test('dispose prevents publishing late data; invalid page requests are not sent', async () => {
  let resolve, calls = 0; const wait = new Promise(done => { resolve = done; });
  const model = overviewModel(path => { calls++; return wait.then(() => listing(path)); }, false);
  await model.loadExpired(0); await model.loadExpired(1000001); assert.equal(calls, 0);
  const pending = model.load(); model.dispose(); resolve(); await pending; assert.deepEqual(model.snapshot().metrics, {}); assert.deepEqual(model.snapshot().expired.data, []);
});
