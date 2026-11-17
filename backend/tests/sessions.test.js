import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

let n = 0;
const newUser = () => s.register(`timer${++n}@example.com`);
const startFocus = (c, extra = {}) => c.post('/sessions', { kind: 'focus', plantType: 'cactus', ...extra });

test('T-M1 start a focus session: copies duration and task title, server sets the times', async () => {
  const c = await newUser();
  const { body: t } = await c.post('/tasks', { title: 'Essay' });
  const r = await startFocus(c, { taskId: t.task.id });
  assert.equal(r.status, 201);
  const ses = r.body.session;
  assert.equal(ses.status, 'active');
  assert.equal(ses.plannedSeconds, 1500);
  assert.equal(ses.taskTitle, 'Essay');
  assert.equal(ses.targetAt - ses.startedAt, 25 * 60_000);
  assert.equal(r.body.serverNow, s.clock.t);
});

test('T-M2 second start returns 409 with the running session (BR-1)', async () => {
  const c = await newUser();
  await startFocus(c);
  const r = await startFocus(c);
  assert.equal(r.status, 409);
  assert.equal(r.body.session.status, 'active');
});

test('T-M2b two simultaneous starts: exactly one wins (database unique index)', async () => {
  const c = await newUser();
  const [a, b] = await Promise.all([startFocus(c), startFocus(c)]);
  assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  const [{ n: open }] = await s.db.query("SELECT count(*)::int AS n FROM timer_sessions WHERE status IN ('active','paused')");
  assert.ok(open >= 1);
});

test('start validation: unknown plant, missing plant, minutes out of range', async () => {
  const c = await newUser();
  assert.equal((await c.post('/sessions', { kind: 'focus', plantType: 'rose' })).status, 400);
  assert.equal((await c.post('/sessions', { kind: 'focus' })).status, 400);
  assert.equal((await startFocus(c, { minutes: 14 })).status, 400);
  assert.equal((await startFocus(c, { minutes: 61 })).status, 400);
  const custom = await startFocus(c, { minutes: 30 });
  assert.equal(custom.body.session.plannedSeconds, 1800);
});

test('T-M3 pause freezes, resume continues from the frozen remainder', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  const id = body.session.id;
  s.clock.t += s.minutes(10);
  const paused = await c.post(`/sessions/${id}/pause`);
  assert.equal(paused.body.session.status, 'paused');
  assert.equal(paused.body.session.remainingMs, s.minutes(15));
  s.clock.t += s.minutes(60); // time passes while paused
  assert.equal((await c.get('/sessions/current')).body.session.remainingMs, s.minutes(15));
  assert.equal((await c.post(`/sessions/${id}/pause`)).status, 409);
  const resumed = await c.post(`/sessions/${id}/resume`);
  assert.equal(resumed.body.session.status, 'active');
  assert.equal(resumed.body.session.targetAt, s.clock.t + s.minutes(15));
  assert.equal((await c.post(`/sessions/${id}/resume`)).status, 409);
});

test('T-M4 complete too early gives 409; on time works; repeated complete changes nothing (BR-6)', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  const id = body.session.id;
  s.clock.t += s.minutes(24);
  assert.equal((await c.post(`/sessions/${id}/complete`)).status, 409);
  s.clock.t += s.minutes(1);
  const done = await c.post(`/sessions/${id}/complete`);
  assert.equal(done.status, 200);
  assert.equal(done.body.session.status, 'completed');
  assert.equal(done.body.focusSinceLongBreak, 1);
  const again = await c.post(`/sessions/${id}/complete`);
  assert.equal(again.status, 200);
  assert.equal(again.body.focusSinceLongBreak, 1); // not counted twice
  const [{ n: plants }] = await s.db.query("SELECT count(*)::int AS n FROM timer_sessions WHERE id = $1 AND status = 'completed'", [id]);
  assert.equal(plants, 1);
});

test('T-M4b parallel complete calls count the session once', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  s.clock.t += s.minutes(25);
  const results = await Promise.all([1, 2, 3].map(() => c.post(`/sessions/${body.session.id}/complete`)));
  assert.ok(results.every((r) => r.status === 200));
  assert.equal((await c.get('/sessions/current')).body.focusSinceLongBreak, 1);
});

test('complete while paused returns 409', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  await c.post(`/sessions/${body.session.id}/pause`);
  const r = await c.post(`/sessions/${body.session.id}/complete`);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Resume/);
});

test('T-M5 give up withers the plant, is idempotent, and cannot become completed (BR-3)', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  const id = body.session.id;
  const r = await c.post(`/sessions/${id}/give-up`);
  assert.equal(r.body.session.status, 'given_up');
  assert.equal((await c.post(`/sessions/${id}/give-up`)).status, 200);
  s.clock.t += s.minutes(30);
  assert.equal((await c.post(`/sessions/${id}/complete`)).status, 409);
  assert.equal((await c.get('/sessions/current')).body.session, null);
  assert.equal((await startFocus(c)).status, 201); // a new session can start
});

test('T-M6 refresh: current returns the open session; an expired one is completed once', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  s.clock.t += s.minutes(5);
  const cur = await c.get('/sessions/current');
  assert.equal(cur.body.session.id, body.session.id);
  assert.equal(cur.body.session.remainingMs, s.minutes(20));
  s.clock.t += s.minutes(60); // tab was closed
  const settled = await c.get('/sessions/current');
  assert.equal(settled.body.session.status, 'completed');
  assert.equal(settled.body.session.endedAt, body.session.targetAt); // counted at the planned end time
  assert.equal((await c.get('/sessions/current')).body.session, null);
  assert.equal(settled.body.focusSinceLongBreak, 1);
});

test('T-M7 task link: completed focus sessions count on the task; deleting the task keeps history (BR-11)', async () => {
  const c = await newUser();
  const { body: t } = await c.post('/tasks', { title: 'Read' , estimatedPomodoros: 2 });
  for (let i = 0; i < 2; i++) {
    const { body } = await startFocus(c, { taskId: t.task.id });
    s.clock.t += s.minutes(25);
    await c.post(`/sessions/${body.session.id}/complete`);
  }
  assert.equal((await c.get('/tasks')).body.tasks[0].completedSessions, 2);
  await c.del(`/tasks/${t.task.id}`);
  await c.post('/sessions/collect-all');
  const garden = await c.get('/garden');
  assert.equal(garden.body.plants.length, 2);
  assert.equal(garden.body.plants[0].taskTitle, 'Read');
});

test('T-M8 later settings changes do not change a copied duration (BR-12)', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  s.clock.t += s.minutes(25);
  await c.post(`/sessions/${body.session.id}/complete`);
  await c.put('/settings', { focusMinutes: 50 });
  await c.post('/sessions/collect-all');
  const plants = (await c.get('/garden')).body.plants;
  assert.equal(plants[0].minutes, 25);
});

test('T-M9 breaks: short breaks first, long break after 4 focus sessions, and a long break resets the counter', async () => {
  const c = await newUser();
  const doFocus = async () => {
    const { body } = await startFocus(c);
    s.clock.t += s.minutes(25);
    return (await c.post(`/sessions/${body.session.id}/complete`)).body;
  };
  for (let i = 1; i <= 3; i++) {
    const r = await doFocus();
    assert.equal(r.nextBreak, 'short_break');
    const br = await c.post('/sessions', { kind: 'break' });
    assert.equal(br.body.session.kind, 'short_break');
    assert.equal(br.body.session.plannedSeconds, 300);
    assert.equal((await c.post(`/sessions/${br.body.session.id}/give-up`)).body.session.status, 'skipped');
  }
  const fourth = await doFocus();
  assert.equal(fourth.nextBreak, 'long_break');
  assert.equal(fourth.focusSinceLongBreak, 4);
  const lb = await c.post('/sessions', { kind: 'break' });
  assert.equal(lb.body.session.kind, 'long_break');
  assert.equal(lb.body.session.plannedSeconds, 900);
  s.clock.t += s.minutes(15);
  const end = await c.post(`/sessions/${lb.body.session.id}/complete`);
  assert.equal(end.body.focusSinceLongBreak, 0);
  assert.equal(end.body.nextBreak, 'short_break');
  // breaks never create plants (BR-4)
  await c.post('/sessions/collect-all');
  assert.equal((await c.get('/garden')).body.plants.length, 4);
});

test('skipping a long break does not reset the counter', async () => {
  const c = await newUser();
  await c.put('/settings', { longBreakInterval: 2 });
  for (let i = 0; i < 2; i++) {
    const { body } = await startFocus(c);
    s.clock.t += s.minutes(25);
    await c.post(`/sessions/${body.session.id}/complete`);
  }
  const lb = await c.post('/sessions', { kind: 'break' });
  const skipped = await c.post(`/sessions/${lb.body.session.id}/give-up`);
  assert.equal(skipped.body.focusSinceLongBreak, 2);
  assert.equal(skipped.body.nextBreak, 'long_break');
});

test("another user cannot see or change someone else's session (BR-9)", async () => {
  const a = await newUser();
  const b = await newUser();
  const { body } = await startFocus(a);
  for (const action of ['pause', 'resume', 'complete', 'give-up']) {
    assert.equal((await b.post(`/sessions/${body.session.id}/${action}`)).status, 404, action);
  }
  assert.equal((await b.get('/sessions/current')).body.session, null);
});

test('collect: a finished plant waits in "pending" until collected, and collecting twice changes nothing', async () => {
  const c = await newUser();
  const { body } = await startFocus(c);
  s.clock.t += s.minutes(25);
  await c.post(`/sessions/${body.session.id}/complete`);

  let g = (await c.get('/garden')).body;
  assert.equal(g.pending.length, 1);
  assert.equal(g.plants.length, 0);
  assert.equal(g.stats.pendingPlants, 1);
  assert.equal(g.stats.totalPlants, 0);
  assert.equal(g.stats.todaySessions, 1); // focus time is earned even before collecting

  const first = await c.post(`/sessions/${body.session.id}/collect`);
  assert.equal(first.status, 200);
  assert.equal(first.body.newlyCollected, true);
  assert.equal(first.body.plant.plantType, 'cactus');
  s.clock.t += s.minutes(5);
  const again = await c.post(`/sessions/${body.session.id}/collect`);
  assert.equal(again.status, 200);
  assert.equal(again.body.newlyCollected, false);
  assert.equal(again.body.plant.collectedAt, first.body.plant.collectedAt); // unchanged

  g = (await c.get('/garden')).body;
  assert.equal(g.pending.length, 0);
  assert.equal(g.plants.length, 1);
  assert.equal(g.stats.totalPlants, 1);
  assert.equal(g.badges.find((b) => b.id === 'first_plant').earned, true);
});

test('collect: only finished focus sessions can be collected; other users get 404', async () => {
  const a = await newUser();
  const b = await newUser();
  const running = (await startFocus(a)).body.session;
  assert.equal((await a.post(`/sessions/${running.id}/collect`)).status, 409); // still running
  await a.post(`/sessions/${running.id}/give-up`);
  assert.equal((await a.post(`/sessions/${running.id}/collect`)).status, 409); // withered
  const br = (await a.post('/sessions', { kind: 'break' })).body.session;
  s.clock.t += s.minutes(5);
  await a.post(`/sessions/${br.id}/complete`);
  assert.equal((await a.post(`/sessions/${br.id}/collect`)).status, 409); // breaks give no plants

  const done = (await startFocus(a)).body.session;
  s.clock.t += s.minutes(25);
  await a.post(`/sessions/${done.id}/complete`);
  assert.equal((await b.post(`/sessions/${done.id}/collect`)).status, 404);
  assert.equal((await a.post('/sessions/abc/collect')).status, 404);
  assert.equal((await b.get('/garden')).body.pending.length, 0);
});

test('collect-all: collects every waiting plant once and leaves other users alone', async () => {
  const a = await newUser();
  const b = await newUser();
  for (const client of [a, a, b]) {
    const { body } = await startFocus(client);
    s.clock.t += s.minutes(25);
    await client.post(`/sessions/${body.session.id}/complete`);
  }
  assert.equal((await a.get('/garden')).body.pending.length, 2);
  const r = await a.post('/sessions/collect-all');
  assert.deepEqual(r.body, { collected: 2 });
  assert.deepEqual((await a.post('/sessions/collect-all')).body, { collected: 0 });
  assert.equal((await a.get('/garden')).body.plants.length, 2);
  assert.equal((await b.get('/garden')).body.pending.length, 1); // b is untouched
});
