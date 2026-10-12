import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alertsModel, alertsQuery } from '../src/alerts-model.js';
import { alertsContext } from '../src/portals.js';
const id = '11111111-1111-4111-8111-111111111111';
const alert = {id,lotId:id,severity:'EXPIRING',state:'OPEN',expiresOn:'2026-10-13',onHandQuantity:10,evaluatedOn:'2026-10-12',windowDays:30,evaluatedBy:id,firstDetectedAt:'2026-10-12T12:00:00Z',lastEvaluatedAt:'2026-10-12T12:00:00Z',resolvedAt:null};
const page = (data = [alert],total = data.length,number = 1) => ({data,meta:{page:number,limit:20,total}});
test('reads persisted alerts, metadata and filters without write commands', async () => {
  const calls = [], model = alertsModel(async path => {calls.push(path); const second=path.includes('page=2'); return page(Array.from({length:second?1:20},(_,n) => ({...alert,lotId:`11111111-1111-4111-8111-${String(n+1).padStart(12,'0')}`})),21,second?2:1);});
  await model.load(); assert.equal(model.snapshot().total,21); assert.equal(model.snapshot().data[0].lastEvaluatedAt,alert.lastEvaluatedAt);
  await model.load(2); assert.equal(model.snapshot().page,2); assert.equal(calls[1],'/api/v1/alerts/expiry?page=2&limit=20&state=OPEN');
  assert.equal(alertsQuery(1,{state:'RESOLVED',severity:'EXPIRED',lotId:id}),`/api/v1/alerts/expiry?page=1&limit=20&state=RESOLVED&severity=EXPIRED&lotId=${id}`);
});
test('resolved zero-stock history is valid; successful empty differs from failure', async () => {
  const resolved = {...alert,state:'RESOLVED',onHandQuantity:0,resolvedAt:alert.lastEvaluatedAt};
  const model = alertsModel(async () => page([resolved])); await model.load(1,{state:'RESOLVED',severity:'',lotId:''});
  assert.equal(model.snapshot().data[0].state,'RESOLVED');
  const empty = alertsModel(async () => page([])); await empty.load(); assert.equal(empty.snapshot().total,0); assert.equal(empty.snapshot().error,'');
});
test('invalid filters do not reach API and schema failures are not empty success', async () => {
  let calls = 0; const model = alertsModel(async () => {calls++; return page();});
  for (const filters of [{state:'bad',severity:'',lotId:''},{state:'',severity:'bad',lotId:''},{state:'',severity:'',lotId:'bad'}]) await model.load(1,filters);
  await model.load(0); await model.load(1000001); assert.equal(calls,0);
  for (const bad of [page([],21),page([alert,alert]),page([ {...alert,expiresOn:'2026-02-30'} ]),page([ {...alert,resolvedAt:alert.lastEvaluatedAt} ]),page([ {...alert,onHandQuantity:'10'} ]),page([ {...alert,state:'RESOLVED',resolvedAt:null} ]),page([ {...alert,lastEvaluatedAt:'2026-10-11T12:00:00Z'} ]),{data:[],meta:{page:1,limit:20,total:'0'}}]) {
    const invalid = alertsModel(async () => bad); await invalid.load(); assert.equal(invalid.snapshot().total,null); assert.ok(invalid.snapshot().error);
  }
});
test('denials and outages clear prior rows; retry recovers', async () => {
  let status = null; const model = alertsModel(async () => {if (status) throw {status}; return page();});
  await model.load(); for (status of [401,403,503]) {await model.load(); assert.equal(model.snapshot().total,null); assert.deepEqual(model.snapshot().data,[]); assert.ok(model.snapshot().error);}
  status = null; await model.load(); assert.equal(model.snapshot().error,''); assert.equal(model.snapshot().total,1);
});
test('newer requests and disposal prevent late rows from being published', async () => {
  let resolve; const pending = new Promise(done => {resolve = done;});
  const model = alertsModel(path => path.includes('page=1') ? pending : Promise.resolve(page([],0,2)));
  const first = model.load(); await model.load(2); resolve(page()); await first; assert.equal(model.snapshot().page,2); assert.deepEqual(model.snapshot().data,[]);
  let finish; const slow = alertsModel(() => new Promise(done => {finish = done;})); const loading = slow.load(); slow.dispose(); finish(page()); await loading; assert.deepEqual(slow.snapshot().data,[]); assert.equal(slow.snapshot().total,null);
});
test('context allows only authorized, active, bounded alert GETs and no raw tokens', async () => {
  let active = true; const client = {current:() => ({roles:['ADMIN']}),request:path => Promise.resolve(path)};
  const scope = alertsContext(client,() => active); assert.deepEqual(Object.keys(scope),['canAlerts','request']);
  await scope.request('/api/v1/alerts/expiry?page=1&limit=20&state=OPEN');
  for (const path of ['/api/v1/internal/alerts/expiry/evaluate','/api/v1/alerts/expiry?page=1&limit=100','/api/v1/alerts/expiry?page=1&page=2&limit=20','/api/v1/alerts/expiry?page=1&limit=20&state=','/api/v1/alerts/expiry?page=1&limit=20&extra=x','https://foreign/api/v1/alerts/expiry?page=1&limit=20']) await assert.rejects(scope.request(path));
  await assert.rejects(scope.request('/api/v1/alerts/expiry?page=1&limit=20',{method:'POST'}));
  active = false; await assert.rejects(scope.request('/api/v1/alerts/expiry?page=1&limit=20'));
  for (const role of ['ADMIN','INVENTORY','SUPERVISOR']) await alertsContext({...client,current:() => ({roles:[role]})},() => true).request('/api/v1/alerts/expiry?page=1&limit=20');
  const reader = alertsContext({...client,current:() => ({roles:['CONSULTATION']})},() => true); assert.equal(reader.canAlerts,false); await assert.rejects(reader.request('/api/v1/alerts/expiry?page=1&limit=20'));
});
