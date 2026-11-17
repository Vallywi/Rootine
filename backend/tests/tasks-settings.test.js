import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

test('protected routes return 401 when signed out', async () => {
  const c = s.newClient();
  for (const p of ['/tasks', '/settings', '/sessions/current', '/garden']) {
    assert.equal((await c.get(p)).status, 401, p);
  }
});

test('tasks: create, list, update, delete', async () => {
  const c = await s.register('tasks@example.com');
  const created = await c.post('/tasks', { title: '  Review Chapter 4  ', estimatedPomodoros: 3 });
  assert.equal(created.status, 201);
  assert.equal(created.body.task.title, 'Review Chapter 4');
  assert.equal(created.body.task.completedSessions, 0);
  const id = created.body.task.id;

  assert.equal((await c.post('/tasks', { title: '' })).status, 400);
  assert.equal((await c.post('/tasks', { title: 'x'.repeat(121) })).status, 400);
  assert.equal((await c.post('/tasks', { title: 'ok', estimatedPomodoros: 100 })).status, 400);
  assert.equal((await c.post('/tasks', { title: 'ok', owner: 5 })).status, 400);

  const done = await c.patch(`/tasks/${id}`, { isDone: true });
  assert.equal(done.body.task.isDone, true);
  const cleared = await c.patch(`/tasks/${id}`, { estimatedPomodoros: null });
  assert.equal(cleared.body.task.estimatedPomodoros, null);

  await c.post('/tasks', { title: 'Second' });
  const list = await c.get('/tasks');
  assert.equal(list.body.tasks[0].title, 'Second'); // open tasks first
  assert.equal(list.body.tasks[1].isDone, true);

  assert.equal((await c.del(`/tasks/${id}`)).status, 200);
  assert.equal((await c.del(`/tasks/${id}`)).status, 404);
});

test('tasks: HTML in a title is stored and returned as plain text', async () => {
  const c = await s.register('xss@example.com');
  const r = await c.post('/tasks', { title: '<img src=x onerror=alert(1)>' });
  assert.equal(r.status, 201);
  assert.equal(r.body.task.title, '<img src=x onerror=alert(1)>');
  assert.match(r.headers.get('content-type'), /application\/json/);
});

test('tasks: another user gets 404 for read, update, and delete (BR-9)', async () => {
  const a = await s.register('owner@example.com');
  const b = await s.register('other@example.com');
  const { body } = await a.post('/tasks', { title: 'Private' });
  const id = body.task.id;
  assert.equal((await b.patch(`/tasks/${id}`, { title: 'Hacked' })).status, 404);
  assert.equal((await b.del(`/tasks/${id}`)).status, 404);
  assert.equal((await b.get('/tasks')).body.tasks.length, 0);
  assert.equal((await b.post('/sessions', { kind: 'focus', plantType: 'cactus', taskId: id })).status, 404);
  assert.equal((await a.get('/tasks')).body.tasks[0].title, 'Private');
  assert.equal((await a.patch('/tasks/abc', { title: 'x' })).status, 404);
});

test('tasks: limit of 200 per user returns 409', async () => {
  const c = await s.register('many@example.com');
  const [u] = await s.db.query("SELECT id FROM users WHERE email = 'many@example.com'");
  await s.db.query("INSERT INTO tasks (user_id, title, created_at, updated_at) SELECT $1, 't' || g, 1, 1 FROM generate_series(1, 200) g", [u.id]);
  assert.equal((await c.post('/tasks', { title: 'one too many' })).status, 409);
});

test('settings: defaults, update, limits, and unknown fields', async () => {
  const c = await s.register('set@example.com');
  const g = await c.get('/settings');
  assert.deepEqual(g.body.settings, {
    focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4,
    soundEnabled: true, notificationsEnabled: false, dailyGoal: 4, theme: 'light', shareProgress: true,
  });
  const ok = await c.put('/settings', { focusMinutes: 30, soundEnabled: false });
  assert.equal(ok.body.settings.focusMinutes, 30);
  assert.equal(ok.body.settings.soundEnabled, false);
  for (const bad of [{ focusMinutes: 14 }, { focusMinutes: 91 }, { focusMinutes: 25.5 }, { shortBreakMinutes: 2 }, { shortBreakMinutes: 21 }, { longBreakMinutes: 31 }, { longBreakInterval: 7 }, { dailyGoal: 0 }, { dailyGoal: 13 }, { theme: 'blue' }, { evil: 1 }]) {
    const r = await c.put('/settings', bad);
    assert.equal(r.status, 400, JSON.stringify(bad));
  }
});

test('T-E4 daily goal and T-E6 theme persist across devices', async () => {
  const a = await s.register('goal@example.com');
  assert.equal((await a.put('/settings', { dailyGoal: 5, theme: 'dark' })).status, 200);
  const b = s.newClient();
  await b.post('/auth/login', { email: 'goal@example.com', password: 'growing-plants-1' });
  const g = await b.get('/settings');
  assert.equal(g.body.settings.dailyGoal, 5);
  assert.equal(g.body.settings.theme, 'dark');
});

test('settings: timer lengths are locked during a session, other settings are not', async () => {
  const c = await s.register('lockset@example.com');
  await c.post('/sessions', { kind: 'focus', plantType: 'tulip' });
  const locked = await c.put('/settings', { focusMinutes: 40 });
  assert.equal(locked.status, 409);
  const free = await c.put('/settings', { soundEnabled: false, dailyGoal: 6, theme: 'dark' });
  assert.equal(free.status, 200);
});

test('presets: all six rhythms can be saved (15/3, 25/5, 40/10, 50/10, 75/15, 90/20)', async () => {
  const c = await s.register('presets@example.com');
  for (const [focus, rest] of [[15, 3], [25, 5], [40, 10], [50, 10], [75, 15], [90, 20]]) {
    const r = await c.put('/settings', { focusMinutes: focus, shortBreakMinutes: rest });
    assert.equal(r.status, 200, `${focus}/${rest}`);
    assert.equal(r.body.settings.focusMinutes, focus);
    assert.equal(r.body.settings.shortBreakMinutes, rest);
  }
  const limits = (await c.get('/settings')).body.limits;
  assert.deepEqual([limits.focus, limits.shortBreak], [[15, 90], [3, 20]]);
});
