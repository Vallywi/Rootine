import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';
import { PLANT_CATALOG } from '../../shared/plants.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

let n = 0;
const newUser = () => s.register(`yard${++n}@example.com`);

// Grow and collect one plant. Returns the session id.
async function collectedPlant(c, plantType = 'sunflower', minutes) {
  const { body } = await c.post('/sessions', { kind: 'focus', plantType, ...(minutes ? { minutes } : {}) });
  assert.equal(body.session.status, 'active', `could not start ${plantType}`);
  s.clock.t += body.session.plannedSeconds * 1000;
  await c.post(`/sessions/${body.session.id}/complete`);
  assert.equal((await c.post(`/sessions/${body.session.id}/collect`)).status, 200);
  return body.session.id;
}

test('catalog: 13 plants, 9 flowers and plants plus 4 trees, with rising minimum focus lengths', () => {
  assert.equal(PLANT_CATALOG.length, 13);
  assert.equal(PLANT_CATALOG.filter((p) => p.kind === 'plant').length, 9);
  const trees = PLANT_CATALOG.filter((p) => p.kind === 'tree');
  assert.deepEqual(trees.map((t) => [t.id, t.minMinutes]), [['pine', 40], ['apple', 50], ['cherry', 75], ['ginkgo', 90]]);
  assert.ok(PLANT_CATALOG.filter((p) => p.kind === 'plant').every((p) => p.minMinutes === 15));
});

test('every plant can be started once the focus session is long enough', async () => {
  const c = await newUser();
  for (const p of PLANT_CATALOG) {
    const r = await c.post('/sessions', { kind: 'focus', plantType: p.id, minutes: Math.max(p.minMinutes, 15) });
    assert.equal(r.status, 201, `${p.id} should start`);
    assert.equal(r.body.session.plantType, p.id);
    await c.post(`/sessions/${r.body.session.id}/give-up`);
  }
});

test('trees need a long enough session: Pine 40, Apple 50, Cherry 75, Ginkgo 90 minutes', async () => {
  const c = await newUser();
  for (const [id, min] of [['pine', 40], ['apple', 50], ['cherry', 75], ['ginkgo', 90]]) {
    const tooShort = await c.post('/sessions', { kind: 'focus', plantType: id, minutes: min - 1 });
    assert.equal(tooShort.status, 400, `${id} at ${min - 1}`);
    assert.match(tooShort.body.fields.plantType, new RegExp(`${min} minutes`));
    // the default (25 minute) rhythm is also too short
    assert.equal((await c.post('/sessions', { kind: 'focus', plantType: id })).status, 400);
  }
  // with the saved rhythm long enough, no custom length is needed
  await c.put('/settings', { focusMinutes: 50 });
  const apple = await c.post('/sessions', { kind: 'focus', plantType: 'apple' });
  assert.equal(apple.status, 201);
  assert.equal(apple.body.session.plannedSeconds, 50 * 60);
  // a refused request must not leave a running session behind
  const c2 = await newUser();
  await c2.post('/sessions', { kind: 'focus', plantType: 'pine' });
  assert.equal((await c2.get('/sessions/current')).body.session, null);
});

test('unknown plants are rejected', async () => {
  const c = await newUser();
  assert.equal((await c.post('/sessions', { kind: 'focus', plantType: 'oak' })).status, 400);
});

test('yard: place, move, read back, and take a plant out', async () => {
  const c = await newUser();
  const id = await collectedPlant(c, 'tulip');
  let g = (await c.get('/garden')).body;
  assert.equal(g.plants[0].x, null); // starts in the tray

  const put = await c.put(`/garden/plants/${id}/position`, { x: 42.37, y: 71.04 });
  assert.equal(put.status, 200);
  assert.deepEqual(put.body.plant, { id, x: 42.4, y: 71 }); // rounded to one decimal
  g = (await c.get('/garden')).body;
  assert.deepEqual([g.plants[0].x, g.plants[0].y], [42.4, 71]);

  assert.equal((await c.put(`/garden/plants/${id}/position`, { x: 10, y: 55 })).status, 200); // moving
  g = (await c.get('/garden')).body;
  assert.deepEqual([g.plants[0].x, g.plants[0].y], [10, 55]);

  const out = await c.del(`/garden/plants/${id}/position`);
  assert.equal(out.status, 200);
  assert.equal((await c.del(`/garden/plants/${id}/position`)).status, 200); // repeating is fine
  g = (await c.get('/garden')).body;
  assert.deepEqual([g.plants[0].x, g.plants[0].y], [null, null]);
});

test('yard: bad coordinates and unknown fields are rejected', async () => {
  const c = await newUser();
  const id = await collectedPlant(c);
  for (const bad of [{ x: 101, y: 50 }, { x: -1, y: 50 }, { x: 'a', y: 50 }, { x: 50 }, { y: 50 }, { x: 50, y: 50, z: 1 }, {}]) {
    assert.equal((await c.put(`/garden/plants/${id}/position`, bad)).status, 400, JSON.stringify(bad));
  }
});

test('yard: only collected focus plants can go outside', async () => {
  const c = await newUser();
  // finished but not collected
  const { body } = await c.post('/sessions', { kind: 'focus', plantType: 'rose' });
  s.clock.t += 25 * 60_000;
  await c.post(`/sessions/${body.session.id}/complete`);
  assert.equal((await c.put(`/garden/plants/${body.session.id}/position`, { x: 50, y: 50 })).status, 409);
  await c.post(`/sessions/${body.session.id}/collect`);
  assert.equal((await c.put(`/garden/plants/${body.session.id}/position`, { x: 50, y: 50 })).status, 200);
  // withered plant and a break
  const w = (await c.post('/sessions', { kind: 'focus', plantType: 'daisy' })).body.session;
  await c.post(`/sessions/${w.id}/give-up`);
  assert.equal((await c.put(`/garden/plants/${w.id}/position`, { x: 50, y: 50 })).status, 409);
  const br = (await c.post('/sessions', { kind: 'break' })).body.session;
  assert.equal((await c.put(`/garden/plants/${br.id}/position`, { x: 50, y: 50 })).status, 409);
});

test("yard: another user's plant gives 404, and so do bad ids (BR-9)", async () => {
  const a = await newUser();
  const b = await newUser();
  const id = await collectedPlant(a);
  assert.equal((await b.put(`/garden/plants/${id}/position`, { x: 20, y: 60 })).status, 404);
  assert.equal((await b.del(`/garden/plants/${id}/position`)).status, 404);
  assert.equal((await a.put('/garden/plants/abc/position', { x: 20, y: 60 })).status, 404);
  assert.equal((await a.put('/garden/plants/999999/position', { x: 20, y: 60 })).status, 404);
  assert.equal((await b.put(`/garden/plants/${id}/position`, { x: 20, y: 60 })).status, 404);
  assert.equal((await a.get('/garden')).body.plants[0].x, null); // untouched
});

test('yard: at most 60 plants outside, but placed plants can still move', async () => {
  const c = await newUser();
  const [{ id: userId }] = await s.db.query("SELECT id FROM users WHERE email = $1", [`yard${n}@example.com`]);
  await s.db.query(
    `INSERT INTO timer_sessions (user_id, kind, plant_type, planned_seconds, status, started_at, target_at, ended_at, collected_at, yard_x, yard_y)
     SELECT $1, 'focus', 'daisy', 1500, 'completed', 1, 2, 3, 4, 10 + (g % 80), 40 + (g % 50) FROM generate_series(1, 60) g`,
    [userId],
  );
  const extra = await collectedPlant(c, 'cactus');
  const refused = await c.put(`/garden/plants/${extra}/position`, { x: 50, y: 50 });
  assert.equal(refused.status, 409);
  assert.match(refused.body.error, /full/);
  const [{ id: placedId }] = await s.db.query('SELECT id FROM timer_sessions WHERE user_id = $1 AND yard_x IS NOT NULL LIMIT 1', [userId]);
  assert.equal((await c.put(`/garden/plants/${placedId}/position`, { x: 33, y: 66 })).status, 200); // moving is fine
  assert.equal((await c.del(`/garden/plants/${placedId}/position`)).status, 200);
  assert.equal((await c.put(`/garden/plants/${extra}/position`, { x: 50, y: 50 })).status, 200); // room again
});

test('the database refuses a half-set or out-of-range yard position', async () => {
  const c = await newUser();
  const id = await collectedPlant(c);
  await assert.rejects(s.db.query('UPDATE timer_sessions SET yard_x = 10 WHERE id = $1', [id]));
  await assert.rejects(s.db.query('UPDATE timer_sessions SET yard_x = 101, yard_y = 10 WHERE id = $1', [id]));
});
