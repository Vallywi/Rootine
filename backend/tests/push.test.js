import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

const sent = [];
let outcome = 'sent';
const pusher = { publicKey: 'test-public-key', send: async (sub, payload) => { sent.push({ sub, payload }); return outcome; } };

let s;
before(async () => { s = await startServer({ pusher }); });
after(async () => { await s.close(); });

let n = 0;
const sub = (tag) => ({ endpoint: `https://push.example.com/${tag}`, keys: { p256dh: 'p256dh-key', auth: 'auth-key' } });
const setup = async () => {
  const c = await s.register(`push${++n}@example.com`);
  await c.put('/settings', { notificationsEnabled: true });
  await c.post('/push/subscribe', sub(`u${n}`));
  return c;
};
const dispatch = (secret = 'test-secret') => s.newClient().get('/push/dispatch', { headers: { Authorization: `Bearer ${secret}` } });
const focus = (c) => c.post('/sessions', { kind: 'focus', plantType: 'cactus' });

test('push: key is served to a logged-in user, subscribe needs login and https', async () => {
  const c = await s.register(`push-key${++n}@example.com`);
  assert.deepEqual((await c.get('/push/key')).body, { enabled: true, publicKey: 'test-public-key' });
  assert.equal((await s.newClient().get('/push/key')).status, 401);
  assert.equal((await c.post('/push/subscribe', { endpoint: 'http://insecure.example.com/x', keys: { p256dh: 'a', auth: 'b' } })).status, 400);
  assert.equal((await c.post('/push/subscribe', sub('ok'))).status, 201);
  assert.equal((await c.post('/push/subscribe', sub('ok'))).status, 201); // same browser again is fine
});

test('push: dispatch rejects a missing or wrong secret', async () => {
  assert.equal((await s.newClient().get('/push/dispatch')).status, 401);
  assert.equal((await dispatch('wrong')).status, 401);
});

test('push: a due session is pushed once, and not before it ends', async () => {
  sent.length = 0;
  const c = await setup();
  const r = await focus(c);
  s.clock.t += s.minutes(24);
  assert.deepEqual((await dispatch()).body, { due: 0, sent: 0 });
  s.clock.t += s.minutes(2);
  const d = await dispatch();
  assert.deepEqual(d.body, { due: 1, sent: 1 });
  assert.equal(sent[0].payload.title, 'Your plant is fully grown!');
  assert.equal(sent[0].payload.tag, `rootine-${r.body.session.id}`);
  assert.deepEqual((await dispatch()).body, { due: 0, sent: 0 }); // not sent twice
  await c.post(`/sessions/${r.body.session.id}/complete`);
});

test('push: pausing cancels the push and resuming moves it to the new end time', async () => {
  sent.length = 0;
  const c = await setup();
  const r = await focus(c);
  const id = r.body.session.id;
  s.clock.t += s.minutes(10);
  await c.post(`/sessions/${id}/pause`);
  s.clock.t += s.minutes(30); // paused for a long time
  assert.equal((await dispatch()).body.due, 0);
  await c.post(`/sessions/${id}/resume`); // 15 minutes left
  s.clock.t += s.minutes(14);
  assert.equal((await dispatch()).body.due, 0);
  s.clock.t += s.minutes(2);
  assert.equal((await dispatch()).body.sent, 1);
  await c.post(`/sessions/${id}/complete`);
});

test('push: giving up or completing in the app cancels the push', async () => {
  sent.length = 0;
  const c = await setup();
  const a = await focus(c);
  await c.post(`/sessions/${a.body.session.id}/give-up`);
  const b = await focus(c);
  s.clock.t += s.minutes(26);
  await c.post(`/sessions/${b.body.session.id}/complete`);
  assert.deepEqual((await dispatch()).body, { due: 0, sent: 0 });
  assert.equal(sent.length, 0);
});

test('push: no push when notifications are off, and a dead subscription is removed', async () => {
  sent.length = 0;
  const off = await setup();
  await off.put('/settings', { notificationsEnabled: false });
  const a = await focus(off);
  s.clock.t += s.minutes(26);
  assert.equal((await dispatch()).body.sent, 0);
  await off.post(`/sessions/${a.body.session.id}/complete`);

  const c = await setup();
  const b = await focus(c);
  s.clock.t += s.minutes(26);
  outcome = 'gone';
  await dispatch();
  outcome = 'sent';
  assert.equal(sent.length, 1);
  const rows = await s.db.query('SELECT 1 FROM push_subscriptions WHERE endpoint = $1', [`https://push.example.com/u${n}`]);
  assert.equal(rows.length, 0);
  await c.post(`/sessions/${b.body.session.id}/complete`);
});
