import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';
import { loadConfig, limitsFor } from '../src/config.js';

test('demo mode is on only in development, and never in production', () => {
  assert.equal(loadConfig({ DEMO_MODE: '1' }).demo, true);
  assert.equal(loadConfig({}).demo, false);
  assert.equal(loadConfig({ DEMO_MODE: '0' }).demo, false);
  const prod = loadConfig({ DEMO_MODE: '1', NODE_ENV: 'production' });
  assert.equal(prod.demo, false);
  assert.equal(prod.demoIgnored, true);
  assert.deepEqual(limitsFor(loadConfig({})).focus, [15, 90]);
  assert.deepEqual(limitsFor(loadConfig({ DEMO_MODE: '1' })).focus, [1, 90]);
});

test('normal mode: a 1 minute timer and an unearned tree are refused, and /settings says demo is off', async () => {
  const s = await startServer();
  try {
    const c = await s.register('nodemo@example.com');
    assert.equal((await c.get('/settings')).body.demo, false);
    assert.equal((await c.put('/settings', { focusMinutes: 1 })).status, 400);
    assert.equal((await c.put('/settings', { shortBreakMinutes: 1 })).status, 400);
    assert.equal((await c.post('/sessions', { kind: 'focus', plantType: 'cactus', minutes: 1 })).status, 400);
    assert.equal((await c.post('/sessions', { kind: 'focus', plantType: 'pine', minutes: 15 })).status, 400);
  } finally { await s.close(); }
});

test('demo mode: 1 minute focus and breaks, trees unlocked, and a whole round works', async () => {
  const s = await startServer({ demo: true });
  try {
    const c = await s.register('demo@example.com');
    const g = (await c.get('/settings')).body;
    assert.equal(g.demo, true);
    assert.deepEqual(g.limits.focus, [1, 90]);
    assert.equal((await c.put('/settings', { focusMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 1 })).status, 200);
    assert.equal((await c.put('/settings', { focusMinutes: 0 })).status, 400); // still not zero

    // a pine tree in one minute (it needs 40 in normal mode)
    const tree = await c.post('/sessions', { kind: 'focus', plantType: 'pine' });
    assert.equal(tree.status, 201);
    assert.equal(tree.body.session.plannedSeconds, 60);
    s.clock.t += 61_000;
    assert.equal((await c.post(`/sessions/${tree.body.session.id}/complete`)).body.session.status, 'completed');
    assert.equal((await c.post(`/sessions/${tree.body.session.id}/collect`)).status, 200);
    assert.equal((await c.put(`/garden/plants/${tree.body.session.id}/position`, { x: 50, y: 60 })).status, 200);

    const brk = await c.post('/sessions', { kind: 'break' });
    assert.equal(brk.body.session.plannedSeconds, 60);
  } finally { await s.close(); }
});

test('leaving demo mode raises a saved 1 minute timer back to the normal minimum', async () => {
  const demo = await startServer({ demo: true });
  const c = await demo.register('leave@example.com');
  await c.put('/settings', { focusMinutes: 1, shortBreakMinutes: 1 });
  const [{ id }] = await demo.db.query("SELECT id FROM users WHERE email = 'leave@example.com'");
  // same database, demo turned off
  const { createApp } = await import('../src/app.js');
  const config = { ...loadConfig({}), pgliteDir: 'memory', rateLimit: false };
  const silent = { log() {}, info() {}, error() {}, warn() {} };
  const app = createApp({ db: demo.db, config, now: () => demo.clock.t, logger: silent });
  const server = await new Promise((r) => { const sv = app.listen(0, '127.0.0.1', () => r(sv)); });
  try {
    const base = `http://127.0.0.1:${server.address().port}/api`;
    // sign in on the normal server using a fresh session row for that user
    const { randomToken, sha256 } = await import('../src/security.js');
    const token = randomToken(); const csrf = randomToken();
    await demo.db.query('INSERT INTO auth_sessions (token_hash, user_id, csrf_token, created_at, expires_at) VALUES ($1,$2,$3,$4,$5)', [sha256(token), id, csrf, demo.clock.t, demo.clock.t + 1e9]);
    const headers = { Cookie: `rootine_sid=${token}`, 'X-Rootine-CSRF': csrf, 'Content-Type': 'application/json' };
    const settings = await (await fetch(`${base}/settings`, { headers })).json();
    assert.equal(settings.demo, false);
    assert.equal(settings.settings.focusMinutes, 15);
    assert.equal(settings.settings.shortBreakMinutes, 3);
    const started = await (await fetch(`${base}/sessions`, { method: 'POST', headers, body: JSON.stringify({ kind: 'focus', plantType: 'rose' }) })).json();
    assert.equal(started.session.plannedSeconds, 15 * 60);
  } finally {
    await new Promise((r) => server.close(r));
    await demo.close();
  }
});
