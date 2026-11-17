import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';
import { computeStats, computeBadges } from '../src/routes/garden.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

const DAY = 24 * 3600_000;
const session = (endedAt, minutes = 25) => ({ ended_at: endedAt, planned_seconds: minutes * 60 });
// Monday 2025-01-06 08:00 UTC
const NOW = Date.UTC(2025, 0, 6, 8, 0, 0);

test('stats: today, week (starts Monday), and month totals', () => {
  const sessions = [
    session(NOW - 3600_000),            // today
    session(NOW - DAY * 1),             // Sunday 5 Jan, last week, this month
    session(NOW - DAY * 10),            // 27 Dec, last month
  ];
  const st = computeStats(sessions, NOW, 0);
  assert.equal(st.todayMinutes, 25);
  assert.equal(st.weekMinutes, 25);   // Sunday belongs to the previous week
  assert.equal(st.monthMinutes, 50);
  assert.equal(st.totalPlants, 3);
  assert.equal(st.todaySessions, 1);
});

test('stats: streak stays alive if today is empty but yesterday has a session', () => {
  const st = computeStats([session(NOW - DAY), session(NOW - 2 * DAY), session(NOW - 3 * DAY)], NOW, 0);
  assert.equal(st.currentStreak, 3);
  assert.equal(st.longestStreak, 3);
  const broken = computeStats([session(NOW - 3 * DAY)], NOW, 0);
  assert.equal(broken.currentStreak, 0);
  assert.equal(broken.longestStreak, 1);
});

test('stats: longest streak is found across gaps', () => {
  const days = [0, 1, 2, 5, 6, 7, 8, 9].map((d) => session(NOW - d * DAY));
  const st = computeStats(days, NOW, 0);
  assert.equal(st.longestStreak, 5);
  assert.equal(st.currentStreak, 3);
});

test('stats: the time zone moves the day boundary', () => {
  // 23:30 UTC on Sunday is already Monday 07:30 in UTC+8 (tzOffset -480).
  const late = Date.UTC(2025, 0, 5, 23, 30, 0);
  const now = Date.UTC(2025, 0, 6, 1, 0, 0);
  assert.equal(computeStats([session(late)], now, 0).todaySessions, 0);
  assert.equal(computeStats([session(late)], now, -480).todaySessions, 1);
});

test('T-E5 badges: progress and earned flags', () => {
  const st = { totalPlants: 6, longestStreak: 3, totalSeconds: 6 * 1500 };
  const b = Object.fromEntries(computeBadges(st).map((x) => [x.id, x]));
  assert.equal(b.first_plant.earned, true);
  assert.equal(b.ten_plants.earned, false);
  assert.equal(b.ten_plants.progress, 6);
  assert.equal(b.seven_day_streak.progress, 3);
  assert.equal(b.hundred_hours.progress, 2);
});

test('garden endpoint: plants, withered, stats, badges, and only the signed-in user data', async () => {
  const c = await s.register('garden@example.com');
  const other = await s.register('garden2@example.com');
  const grow = async (client) => {
    const { body } = await client.post('/sessions', { kind: 'focus', plantType: 'sunflower' });
    s.clock.t += 25 * 60_000;
    await client.post(`/sessions/${body.session.id}/complete`);
  };
  await grow(c); await grow(c); await grow(other);
  const w = await c.post('/sessions', { kind: 'focus', plantType: 'tulip' });
  await c.post(`/sessions/${w.body.session.id}/give-up`);

  // Finished plants wait to be collected. Collect one of the two.
  const waiting = (await c.get('/garden?tzOffset=0')).body;
  assert.equal(waiting.plants.length, 0);
  assert.equal(waiting.pending.length, 2);
  await c.post('/sessions/' + waiting.pending[0].id + '/collect');

  const g = (await c.get('/garden?tzOffset=0')).body;
  assert.equal(g.plants.length, 1);
  assert.equal(g.pending.length, 1);
  assert.equal(g.withered.length, 1);
  assert.equal(g.withered[0].plantType, 'tulip');
  assert.equal(g.stats.totalPlants, 1); // only collected plants; withered plants never count (BR-8)
  assert.equal(g.stats.pendingPlants, 1);
  assert.equal(g.stats.todayMinutes, 50);
  assert.equal(g.stats.todaySessions, 2);
  assert.equal(g.badges.find((b) => b.id === 'first_plant').earned, true);
  assert.equal((await other.get('/garden')).body.pending.length, 1);
  assert.equal((await c.get('/garden?tzOffset=abc')).status, 400);
});
