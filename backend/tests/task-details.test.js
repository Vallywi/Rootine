import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';
import { computeBadges } from '../src/routes/garden.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

test('a new task has sensible defaults: other, medium, to do, no date', async () => {
  const c = await s.register('td1@example.com');
  const r = await c.post('/tasks', { title: 'Plain task' });
  assert.equal(r.status, 201);
  assert.deepEqual(
    [r.body.task.category, r.body.task.priority, r.body.task.status, r.body.task.dueDate, r.body.task.notes, r.body.task.isDone],
    ['other', 'medium', 'todo', null, null, false],
  );
});

test('a task can carry a kind, urgency, status, due date, and notes', async () => {
  const c = await s.register('td2@example.com');
  const r = await c.post('/tasks', { title: 'Essay', category: 'study', priority: 'urgent', status: 'doing', dueDate: '2026-03-31', notes: 'Chapter 3 first', estimatedPomodoros: 4 });
  assert.equal(r.status, 201);
  const t = r.body.task;
  assert.deepEqual([t.category, t.priority, t.status, t.dueDate, t.notes, t.isDone], ['study', 'urgent', 'doing', '2026-03-31', 'Chapter 3 first', false]);
  const p = await c.patch(`/tasks/${t.id}`, { priority: 'low', dueDate: null, notes: null, category: 'work' });
  assert.deepEqual([p.body.task.priority, p.body.task.dueDate, p.body.task.notes, p.body.task.category, p.body.task.status], ['low', null, null, 'work', 'doing']);
});

test('status and isDone stay in step', async () => {
  const c = await s.register('td3@example.com');
  const t = (await c.post('/tasks', { title: 'Sync' })).body.task;
  let r = await c.patch(`/tasks/${t.id}`, { status: 'done' });
  assert.equal(r.body.task.isDone, true);
  r = await c.patch(`/tasks/${t.id}`, { isDone: false });
  assert.deepEqual([r.body.task.isDone, r.body.task.status], [false, 'todo']);
  r = await c.patch(`/tasks/${t.id}`, { isDone: true });
  assert.deepEqual([r.body.task.isDone, r.body.task.status], [true, 'done']);
  r = await c.patch(`/tasks/${t.id}`, { status: 'doing' });
  assert.deepEqual([r.body.task.isDone, r.body.task.status], [false, 'doing']);
});

test('bad values are refused with a message for the field', async () => {
  const c = await s.register('td4@example.com');
  for (const body of [{ category: 'sleep' }, { priority: 'asap' }, { status: 'maybe' }, { dueDate: '31/03/2026' }, { dueDate: '2026-02-31' }, { notes: 'x'.repeat(501) }]) {
    const r = await c.post('/tasks', { title: 'Bad', ...body });
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.ok(Object.keys(r.body.fields).length >= 1, JSON.stringify(body));
  }
});

test('badges: more of them, grouped, with progress and a hint', () => {
  const none = computeBadges({});
  assert.ok(none.length >= 20);
  assert.ok(none.every((b) => b.earned === false && b.icon && b.hint && b.group && b.target > 0));
  assert.equal(new Set(none.map((b) => b.id)).size, none.length, 'ids are unique');
  const b = Object.fromEntries(computeBadges({ totalPlants: 5, longestStreak: 3, totalSeconds: 3700, species: 5, trees: 1, bestSessionMinutes: 50, tasksDone: 1, friends: 1 }).map((x) => [x.id, x]));
  for (const id of ['first_plant', 'five_plants', 'three_day_streak', 'one_hour', 'first_tree', 'plant_collector', 'deep_diver', 'task_tamer', 'buddy']) assert.equal(b[id].earned, true, id);
  for (const id of ['ten_plants', 'seven_day_streak', 'ten_hours', 'marathon', 'full_garden', 'garden_club']) assert.equal(b[id].earned, false, id);
});

test('the garden counts species, trees, long sessions, finished tasks, and friends for badges', async () => {
  const c = await s.register('td5@example.com');
  const task = (await c.post('/tasks', { title: 'Done one' })).body.task;
  await c.patch(`/tasks/${task.id}`, { isDone: true });
  const grow = async (plantType, minutes) => {
    const r = await c.post('/sessions', { kind: 'focus', plantType, minutes });
    s.clock.t += minutes * 60_000;
    await c.post(`/sessions/${r.body.session.id}/complete`);
    await c.post(`/sessions/${r.body.session.id}/collect`);
  };
  await grow('rose', 15);
  await grow('pine', 40);
  const g = (await c.get('/garden')).body;
  const by = Object.fromEntries(g.badges.map((b) => [b.id, b]));
  assert.equal(by.plant_collector.progress, 2);
  assert.equal(by.first_tree.earned, true);
  assert.equal(by.task_tamer.earned, true);
  assert.equal(by.deep_diver.progress, 40);
  assert.equal(by.buddy.earned, false);
});
